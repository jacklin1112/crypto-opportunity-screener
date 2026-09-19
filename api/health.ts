import { cacheStats } from '../lib/coingecko-cache'

export default {
  async fetch(_request: Request): Promise<Response> {
    return Response.json(
      { ok: true, cache: cacheStats() },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=10' },
      },
    )
  },
}
