import {
  passwordToken,
  buildAccessCookie,
  SITE_COOKIE,
} from '../lib/site-auth'

/**
 * POST { password } → sets HttpOnly cookie when SITE_PASSWORD matches.
 * GET → { gated: boolean } whether gate is active.
 * DELETE → clear cookie.
 */
async function handle(req: Request): Promise<Response> {
  const expected = process.env.SITE_PASSWORD || ''
  const url = new URL(req.url)

  if (req.method === 'GET') {
    return Response.json({ gated: Boolean(expected) })
  }

  if (req.method === 'POST') {
    if (!expected) {
      return Response.json({ ok: true, gated: false })
    }

    let password = ''
    const ct = req.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const body = (await req.json().catch(() => ({}))) as { password?: string }
      password = String(body.password || '')
    } else {
      const form = await req.formData().catch(() => null)
      password = form ? String(form.get('password') || '') : ''
    }

    const isForm =
      ct.includes('application/x-www-form-urlencoded') ||
      ct.includes('multipart/form-data')

    if (password !== expected) {
      if (isForm) {
        return Response.redirect(new URL('/gate.html?error=1', url.origin), 303)
      }
      return Response.json({ ok: false, error: 'invalid_password' }, { status: 401 })
    }

    const token = await passwordToken(expected)
    const secure = url.protocol === 'https:'
    const cookie = buildAccessCookie(token, secure)

    if (isForm) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: '/',
          'Set-Cookie': cookie,
        },
      })
    }

    return Response.json(
      { ok: true },
      {
        status: 200,
        headers: { 'Set-Cookie': cookie },
      },
    )
  }

  if (req.method === 'DELETE') {
    const secure = url.protocol === 'https:'
    const clear = `${SITE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`
    return Response.json({ ok: true }, { status: 200, headers: { 'Set-Cookie': clear } })
  }

  return Response.json({ error: 'method_not_allowed' }, { status: 405 })
}

export default {
  async fetch(request: Request): Promise<Response> {
    return handle(request)
  },
}
