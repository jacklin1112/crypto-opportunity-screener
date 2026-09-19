import type { ScreenerResponse } from '../types/coin'

export async function fetchScreener(): Promise<ScreenerResponse> {
  const res = await fetch('/api/screener')
  if (!res.ok) {
    let detail = ''
    try {
      const j = await res.json()
      detail = j?.detail || j?.error || ''
    } catch {
      detail = await res.text()
    }
    throw new Error(`加载失败 HTTP ${res.status}${detail ? `: ${detail}` : ''}`)
  }
  return res.json()
}
