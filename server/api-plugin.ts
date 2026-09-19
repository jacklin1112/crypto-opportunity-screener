import type { Plugin, Connect } from 'vite'
import type { ServerResponse } from 'node:http'
import { fetchCoinGecko, cacheStats, clearCache } from './coingecko-cache.ts'

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=30')
  res.end(JSON.stringify(data))
}

function attachApi(middlewares: Connect.Server) {
  middlewares.use(async (req, res, next) => {
    const url = req.url || ''
    if (!url.startsWith('/api/')) {
      next()
      return
    }

    try {
      if (url === '/api/health' || url.startsWith('/api/health?')) {
        sendJson(res, 200, { ok: true, cache: cacheStats() })
        return
      }

      if (url.startsWith('/api/cache/clear')) {
        clearCache()
        sendJson(res, 200, { cleared: true })
        return
      }

      if (url.startsWith('/api/markets')) {
        const u = new URL(url, 'http://localhost')
        const page = u.searchParams.get('page') || '1'
        const perPage = u.searchParams.get('per_page') || '100'
        const path =
          `/coins/markets?vs_currency=usd&order=market_cap_desc` +
          `&per_page=${encodeURIComponent(perPage)}&page=${encodeURIComponent(page)}` +
          `&sparkline=false&price_change_percentage=24h,7d,30d`
        const result = await fetchCoinGecko(path)
        res.statusCode = result.status
        res.setHeader('Content-Type', result.contentType)
        res.setHeader('X-Cache-Expires', String(result.expiresAt))
        res.end(result.body)
        return
      }

      if (url.startsWith('/api/trending')) {
        const result = await fetchCoinGecko('/search/trending')
        res.statusCode = result.status
        res.setHeader('Content-Type', result.contentType)
        res.end(result.body)
        return
      }

      if (url.startsWith('/api/coin/')) {
        const id = decodeURIComponent(url.slice('/api/coin/'.length).split('?')[0] || '')
        if (!id || !/^[a-z0-9-]+$/i.test(id)) {
          sendJson(res, 400, { error: 'invalid coin id' })
          return
        }
        const path =
          `/coins/${id}?localization=false&tickers=false&market_data=false` +
          `&community_data=false&developer_data=false&sparkline=false`
        const result = await fetchCoinGecko(path)
        res.statusCode = result.status
        res.setHeader('Content-Type', result.contentType)
        res.end(result.body)
        return
      }

      if (url.startsWith('/api/screener')) {
        // Single markets call (per_page=150) + trending — fewer free-tier hits
        const marketsPath =
          `/coins/markets?vs_currency=usd&order=market_cap_desc` +
          `&per_page=150&page=1&sparkline=false&price_change_percentage=24h,7d,30d`

        const m1 = await fetchCoinGecko(marketsPath)
        const trending = await fetchCoinGecko('/search/trending')

        if (m1.status < 200 || m1.status >= 300) {
          sendJson(res, m1.status === 429 ? 429 : m1.status, {
            error: 'markets_failed',
            detail: m1.body.slice(0, 500) || 'rate_limited_or_empty',
            hint: 'CoinGecko 免费接口限流，请约 1 分钟后重试',
          })
          return
        }

        let markets: unknown[] = []
        try {
          const a = JSON.parse(m1.body)
          markets = Array.isArray(a) ? a : []
        } catch {
          sendJson(res, 502, { error: 'parse_failed' })
          return
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

        sendJson(res, 200, {
          fetchedAt: new Date().toISOString(),
          count: markets.length,
          markets,
          trendingIds,
          trending: trendingItems,
          cache: cacheStats(),
        })
        return
      }

      sendJson(res, 404, { error: 'not_found' })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      sendJson(res, 500, { error: 'proxy_error', message })
    }
  })
}

export function coinGeckoApiPlugin(): Plugin {
  return {
    name: 'coingecko-api-proxy',
    configureServer(server) {
      attachApi(server.middlewares)
    },
    configurePreviewServer(server) {
      attachApi(server.middlewares)
    },
  }
}
