/**
 * Optional private gate: when SITE_PASSWORD is set on Vercel,
 * require a valid site_access cookie (issued by /api/auth).
 * Local Vite dev is unaffected (this file is Vercel Routing Middleware only).
 */
import { next } from '@vercel/functions'
import { passwordToken, parseCookies, SITE_COOKIE } from './lib/site-auth'

export const config = {
  matcher: [
    '/((?!gate\\.html|api/auth|favicon\\.svg|icons\\.svg|assets/).*)',
  ],
}

export default async function middleware(request: Request): Promise<Response> {
  const expected = process.env.SITE_PASSWORD
  if (!expected) {
    return next()
  }

  const cookies = parseCookies(request.headers.get('cookie'))
  const token = cookies[SITE_COOKIE]
  const valid = await passwordToken(expected)

  if (token && token === valid) {
    return next()
  }

  const url = new URL(request.url)
  const accept = request.headers.get('accept') || ''
  if (url.pathname.startsWith('/api/') || accept.includes('application/json')) {
    return Response.json(
      { error: 'unauthorized', hint: 'POST /api/auth with { password } or open /gate.html' },
      { status: 401 },
    )
  }

  url.pathname = '/gate.html'
  url.search = ''
  return Response.redirect(url, 302)
}
