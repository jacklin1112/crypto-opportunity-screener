import { buildScreener } from '../lib/screener'

export const config = {
  maxDuration: 30,
}

async function handle(): Promise<Response> {
  try {
    const result = await buildScreener()
    if (!result.ok) {
      return Response.json(result.error.body, {
        status: result.error.status,
        headers: { 'Cache-Control': 'public, max-age=30' },
      })
    }
    return Response.json(result.data, {
      status: 200,
      headers: { 'Cache-Control': 'public, max-age=30' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: 'proxy_error', message }, { status: 500 })
  }
}

export default {
  async fetch(_request: Request): Promise<Response> {
    return handle()
  },
}
