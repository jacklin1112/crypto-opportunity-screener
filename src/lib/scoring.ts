import type { CatalystHint, MarketCoin, RiskChip, ScoredCoin } from '../types/coin'

function num(v: number | null | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

/** Smooth squash: maps roughly ±scale into ~±1 */
function soft(x: number, scale: number): number {
  return Math.tanh(x / scale)
}

/**
 * 研究价值分（0–100）透明公式：
 *
 * score = clamp(0,100,
 *   momentum7d      (0–28)  +  // soft(7d%/25)*28，正向动能
 *   momentum24h     (0–18)  +  // soft(24h%/12)*18
 *   volumeAttention (0–20)  +  // min(vol/mcap * 400, 20) 成交关注度
 *   catalystBonus   (0–18)  +  // 趋势榜 / 分类线索
 *   mcapSweetSpot   (0–16)  +  // 中盘更易「值得深挖」
 *   penalties                // 极端拉升 / 低流动性 / 微盘惩罚（负分）
 * )
 *
 * 这不是收益预测，只是把公开市场数据压缩成「是否值得继续研究」的排序信号。
 */
export function computeScore(
  coin: MarketCoin,
  opts: { isTrending: boolean; categoryHints: string[] },
): Pick<ScoredCoin, 'score' | 'scoreBreakdown' | 'risks' | 'catalysts' | 'evidence' | 'volMcap' | 'change24h' | 'change7d' | 'change30d' | 'isTrending'> {
  const change24h =
    num(coin.price_change_percentage_24h_in_currency) ??
    num(coin.price_change_percentage_24h)
  const change7d = num(coin.price_change_percentage_7d_in_currency)
  const change30d = num(coin.price_change_percentage_30d_in_currency)
  const mcap = num(coin.market_cap)
  const vol = num(coin.total_volume)
  const volMcap = mcap && mcap > 0 && vol != null ? vol / mcap : null

  // --- positive components ---
  const momentum7d =
    change7d == null ? 8 : clamp((soft(change7d, 25) * 0.5 + 0.5) * 28, 0, 28)
  const momentum24h =
    change24h == null ? 6 : clamp((soft(change24h, 12) * 0.5 + 0.5) * 18, 0, 18)
  const volumeAttention =
    volMcap == null ? 4 : clamp(Math.min(volMcap * 400, 20), 0, 20)

  const catalysts: CatalystHint[] = []
  if (opts.isTrending) {
    catalysts.push({
      id: 'trending',
      label: 'CoinGecko 趋势榜',
      source: '/search/trending',
    })
  }
  for (const cat of opts.categoryHints.slice(0, 3)) {
    catalysts.push({
      id: `cat-${cat}`,
      label: cat,
      source: 'categories',
    })
  }

  let catalystBonus = 0
  if (opts.isTrending) catalystBonus += 12
  catalystBonus += Math.min(opts.categoryHints.length * 3, 6)
  catalystBonus = clamp(catalystBonus, 0, 18)

  // Mid-cap sweet spot: ~$80M – $8B preferred for "research before big move"
  let mcapSweetSpot = 6
  if (mcap != null) {
    if (mcap >= 8e7 && mcap <= 8e9) mcapSweetSpot = 16
    else if (mcap >= 3e7 && mcap < 8e7) mcapSweetSpot = 11
    else if (mcap > 8e9 && mcap <= 3e10) mcapSweetSpot = 10
    else if (mcap < 3e7) mcapSweetSpot = 3
    else mcapSweetSpot = 5
  }

  // --- penalties / risks ---
  const risks: RiskChip[] = []
  let penalties = 0

  if (change24h != null && Math.abs(change24h) >= 15) {
    risks.push({
      id: 'high-24h',
      label: '24h 波动大',
      level: Math.abs(change24h) >= 25 ? 'high' : 'medium',
      explanation: `近 24 小时涨跌约 ${change24h.toFixed(1)}%，短线噪声大，信号易失真。`,
    })
    if (Math.abs(change24h) >= 25) penalties -= 6
  }

  if (change7d != null && change7d >= 60) {
    risks.push({
      id: 'extreme-7d-pump',
      label: '7日已大幅拉升',
      level: change7d >= 100 ? 'high' : 'medium',
      explanation: `近 7 日已上涨约 ${change7d.toFixed(1)}%，可能已部分定价，追高研究需更谨慎。`,
    })
    penalties -= change7d >= 100 ? 18 : 12
  }

  if (volMcap != null && volMcap < 0.02) {
    risks.push({
      id: 'low-liquidity',
      label: '流动性偏弱',
      level: volMcap < 0.008 ? 'high' : 'medium',
      explanation: `成交额/市值约 ${(volMcap * 100).toFixed(2)}%，进出成本与滑点风险更高。`,
    })
    penalties -= volMcap < 0.008 ? 14 : 8
  }

  if (mcap != null && mcap < 5e7) {
    risks.push({
      id: 'low-mcap',
      label: '低市值',
      level: mcap < 2e7 ? 'high' : 'medium',
      explanation: `市值约 $${formatCompact(mcap)}，叙事弹性大但操纵与流动性风险更高。`,
    })
    penalties -= mcap < 2e7 ? 10 : 6
  }

  if (vol != null && volMcap != null && volMcap > 0.35) {
    risks.push({
      id: 'hyper-volume',
      label: '异常高换手',
      level: 'medium',
      explanation: `成交额/市值约 ${(volMcap * 100).toFixed(1)}%，可能是事件驱动或炒作高峰，需核对新闻。`,
    })
  }

  const raw =
    momentum7d + momentum24h + volumeAttention + catalystBonus + mcapSweetSpot + penalties
  const score = Math.round(clamp(raw, 0, 100) * 10) / 10

  const evidence: string[] = []
  evidence.push(
    `市值排名 #${coin.market_cap_rank ?? '—'}，价格 $${formatPrice(coin.current_price)}`,
  )
  if (change24h != null || change7d != null || change30d != null) {
    evidence.push(
      `涨跌：24h ${fmtPct(change24h)} · 7d ${fmtPct(change7d)} · 30d ${fmtPct(change30d)}`,
    )
  }
  if (vol != null && mcap != null) {
    evidence.push(
      `24h 成交 $${formatCompact(vol)}，成交/市值 ${(volMcap! * 100).toFixed(2)}%（流动性/关注度代理）`,
    )
  }
  if (opts.isTrending) {
    evidence.push('出现在 CoinGecko 公开趋势榜（search/trending），短期关注度上升')
  }
  if (opts.categoryHints.length) {
    evidence.push(`分类线索：${opts.categoryHints.slice(0, 4).join('、')}`)
  }
  evidence.push(
    `研究分 ${score} = 7d动能${momentum7d.toFixed(1)} + 24h动能${momentum24h.toFixed(1)} + 成交关注${volumeAttention.toFixed(1)} + 催化剂${catalystBonus.toFixed(1)} + 市值区间${mcapSweetSpot.toFixed(1)} + 风险惩罚${penalties.toFixed(1)}`,
  )

  return {
    volMcap,
    change24h,
    change7d,
    change30d,
    score,
    scoreBreakdown: {
      momentum7d,
      momentum24h,
      volumeAttention,
      catalystBonus,
      mcapSweetSpot,
      penalties,
    },
    risks,
    catalysts,
    evidence,
    isTrending: opts.isTrending,
  }
}

export function enrichMarkets(
  markets: MarketCoin[],
  trendingIds: string[],
  categoryMap: Record<string, string[]> = {},
): ScoredCoin[] {
  const trendingSet = new Set(trendingIds)
  return markets.map((coin) => {
    const scored = computeScore(coin, {
      isTrending: trendingSet.has(coin.id),
      categoryHints: categoryMap[coin.id] || [],
    })
    return { ...coin, ...scored }
  })
}

export function formatCompact(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`
  return n.toFixed(2)
}

export function formatPrice(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (n >= 1) return n.toFixed(4)
  if (n >= 0.01) return n.toFixed(5)
  return n.toPrecision(4)
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}
