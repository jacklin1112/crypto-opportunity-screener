export type MarketCoin = {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number | null
  market_cap: number | null
  market_cap_rank: number | null
  total_volume: number | null
  price_change_percentage_24h_in_currency?: number | null
  price_change_percentage_7d_in_currency?: number | null
  price_change_percentage_30d_in_currency?: number | null
  price_change_percentage_24h?: number | null
  ath_change_percentage?: number | null
}

export type RiskChip = {
  id: string
  label: string
  level: 'low' | 'medium' | 'high'
  explanation: string
}

export type CatalystHint = {
  id: string
  label: string
  source: string
}

export type ScoredCoin = MarketCoin & {
  volMcap: number | null
  change24h: number | null
  change7d: number | null
  change30d: number | null
  score: number
  scoreBreakdown: {
    momentum7d: number
    momentum24h: number
    volumeAttention: number
    catalystBonus: number
    mcapSweetSpot: number
    penalties: number
  }
  risks: RiskChip[]
  catalysts: CatalystHint[]
  evidence: string[]
  isTrending: boolean
}

export type ScreenerResponse = {
  fetchedAt: string
  count: number
  markets: MarketCoin[]
  trendingIds: string[]
  trending: Array<{ item?: { id?: string; name?: string; symbol?: string; score?: number } }>
  cache: { size: number; ttlMs: number }
}

export type SortKey =
  | 'score'
  | 'market_cap'
  | 'volume'
  | 'volMcap'
  | 'change24h'
  | 'change7d'
  | 'change30d'
  | 'rank'

export type FilterState = {
  minScore: number
  onlyTrending: boolean
  onlyWithCatalyst: boolean
  maxRiskCount: number | null
  hideExtremePump: boolean
  minVolMcap: number
  search: string
}
