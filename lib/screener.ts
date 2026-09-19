/**
 * Shared screener composition: markets (Top 150) + trending.
 */
import { fetchCoinGecko, cacheStats } from './coingecko-cache.ts'

export type ScreenerOk = {
  fetchedAt: string
  count: number
  markets: unknown[]
  trendingIds: string[]
  trending: unknown[]
  cache: { size: number; ttlMs: number }
}

export type ScreenerErr = {
  status: number
  body: Record<string, unknown>
}

export type ScreenerResult =
  | { ok: true; data: ScreenerOk }
  | { ok: false; error: ScreenerErr }

export async function buildScreener(): Promise<ScreenerResult> {
  const marketsPath =
    `/coins/markets?vs_currency=usd&order=market_cap_desc` +
    `&per_page=150&page=1&sparkline=false&price_change_percentage=24h,7d,30d`

  const m1 = await fetchCoinGecko(marketsPath)
  const trending = await fetchCoinGecko('/search/trending')

  if (m1.status < 200 || m1.status >= 300) {
    return {
      ok: false,
      error: {
        status: m1.status === 429 ? 429 : m1.status,
        body: {
          error: 'markets_failed',
          detail: m1.body.slice(0, 500) || 'rate_limited_or_empty',
          hint: 'CoinGecko 免费接口限流，请约 1 分钟后重试',
        },
      },
    }
  }

  let markets: unknown[] = []
  try {
    const a = JSON.parse(m1.body)
    markets = Array.isArray(a) ? a : []
  } catch {
    return { ok: false, error: { status: 502, body: { error: 'parse_failed' } } }
  }

  let trendingIds: string[] = []
  let trendingItems: unknown[] = []
  try {
    if (trending.status >= 200 && trending.status < 300) {
      const t = JSON.parse(trending.body)
      trendingItems = t.coins || []
      trendingIds = (t.coins || [])
        .map((c: { item?: { id?: string } }) => c?.item?.id)
        .filter(Boolean) as string[]
    }
  } catch {
    // ignore trending parse errors
  }

  return {
    ok: true,
    data: {
      fetchedAt: new Date().toISOString(),
      count: markets.length,
      markets,
      trendingIds,
      trending: trendingItems,
      cache: cacheStats(),
    },
  }
}
