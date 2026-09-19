/**
 * In-memory CoinGecko proxy helpers with ~60s cache + request queue.
 * Shared by Vite middleware (dev/preview) and Vercel serverless functions.
 */

export type CacheEntry = {
  body: string
  status: number
  contentType: string
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60_000
const CG_BASE = 'https://api.coingecko.com/api/v3'

let lastRequestAt = 0
const MIN_GAP_MS = 2500
let chain: Promise<void> = Promise.resolve()

/** Serialize upstream calls with a minimum gap (gentle free-tier usage). */
function enqueueUpstream<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const now = Date.now()
    const wait = MIN_GAP_MS - (now - lastRequestAt)
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait))
    }
    lastRequestAt = Date.now()
    return fn()
  })
  chain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

export function getCached(key: string): CacheEntry | null {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() > hit.expiresAt) {
    cache.delete(key)
    return null
  }
  return hit
}

export function clearCache(): void {
  cache.clear()
}

async function fetchOnce(pathWithQuery: string): Promise<CacheEntry> {
  const url = `${CG_BASE}${pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`}`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'crypto-opportunity-screener-mvp/1.0 (research; vercel/local)',
    },
  })

  const body = await res.text()
  const contentType = res.headers.get('content-type') || 'application/json'

  if (res.ok) {
    const full: CacheEntry = {
      body,
      status: res.status,
      contentType,
      expiresAt: Date.now() + CACHE_TTL_MS,
    }
    cache.set(pathWithQuery, full)
    return full
  }

  if (res.status === 429) {
    const full: CacheEntry = {
      body,
      status: res.status,
      contentType,
      expiresAt: Date.now() + 45_000,
    }
    // Do not permanently poison cache for screener composition — short TTL only
    cache.set(pathWithQuery, full)
    return full
  }

  return { body, status: res.status, contentType, expiresAt: 0 }
}

export async function fetchCoinGecko(pathWithQuery: string): Promise<CacheEntry> {
  const key = pathWithQuery
  const cached = getCached(key)
  if (cached) return cached

  return enqueueUpstream(async () => {
    const again = getCached(key)
    if (again) return again

    let result = await fetchOnce(key)
    // One gentle retry on 429
    if (result.status === 429) {
      await new Promise((r) => setTimeout(r, 5000))
      lastRequestAt = Date.now()
      cache.delete(key)
      result = await fetchOnce(key)
    }
    return result
  })
}

export function cacheStats() {
  return { size: cache.size, ttlMs: CACHE_TTL_MS }
}
