import type { Plugin, Connect } from 'vite'
import type { ServerResponse } from 'node:http'
import { fetchCoinGecko, cacheStats, clearCache } from '../lib/coingecko-cache.ts'
import { buildScreener } from '../lib/screener.ts'

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
        const result = await buildScreener()
        if (!result.ok) {
          sendJson(res, result.error.status, result.error.body)
          return
        }
        sendJson(res, 200, result.data)
        return
      }

      // Local-only: accept password and set cookie (mirrors Vercel /api/auth)
      if (url.startsWith('/api/auth')) {
        sendJson(res, 200, {
          ok: true,
          note: 'SITE_PASSWORD gate is enforced on Vercel via middleware; local dev is open.',
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
