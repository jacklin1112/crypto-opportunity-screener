/**
 * Simple site gate helpers (cookie token derived from SITE_PASSWORD).
 * Used by Edge middleware and /api/auth.
 */

export const SITE_COOKIE = 'site_access'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

/** Deterministic token so changing SITE_PASSWORD invalidates old cookies. */
export async function passwordToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`site-gate:v1:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(digest)
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i]!.toString(16).padStart(2, '0')
  }
  return hex
}

export function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {}
  const out: Record<string, string> = {}
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const k = part.slice(0, idx).trim()
    const v = part.slice(idx + 1).trim()
    if (k) out[k] = decodeURIComponent(v)
  }
  return out
}

export function buildAccessCookie(token: string, secure: boolean): string {
  const parts = [
    `${SITE_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${COOKIE_MAX_AGE}`,
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}
