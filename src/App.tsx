import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Activity } from 'lucide-react'
import { fetchScreener } from './lib/api'
import { enrichMarkets } from './lib/scoring'
import type { FilterState, ScoredCoin, SortKey } from './types/coin'
import { Disclaimer } from './components/Disclaimer'
import { ScoreFormula } from './components/ScoreFormula'
import { Filters } from './components/Filters'
import { CoinTable } from './components/CoinTable'
import { DetailPanel } from './components/DetailPanel'

const defaultFilters: FilterState = {
  minScore: 0,
  onlyTrending: false,
  onlyWithCatalyst: false,
  maxRiskCount: null,
  hideExtremePump: false,
  minVolMcap: 0,
  search: '',
}

/** Lightweight static category hints for common research narratives (no extra API calls). */
const STATIC_CATEGORY_HINTS: Record<string, string[]> = {
  zcash: ['privacy', 'ZEC-like narrative'],
  monero: ['privacy'],
  'bitcoin-cash': ['payments'],
  solana: ['L1', 'high-throughput'],
  ethereum: ['L1', 'smart-contracts'],
  chainlink: ['oracle'],
  aave: ['defi', 'lending'],
  uniswap: ['defi', 'dex'],
  'render-token': ['ai', 'depin'],
  'fetch-ai': ['ai'],
  'the-graph': ['indexing'],
  filecoin: ['storage', 'depin'],
  arbitrum: ['L2'],
  optimism: ['L2'],
  sui: ['L1', 'move'],
  aptos: ['L1', 'move'],
  near: ['L1', 'ai-adjacent'],
  injective: ['defi', 'L1'],
  hyperliquid: ['perps', 'defi'],
}

function sortCoins(list: ScoredCoin[], key: SortKey, dir: 'asc' | 'desc'): ScoredCoin[] {
  const mul = dir === 'asc' ? 1 : -1
  return [...list].sort((a, b) => {
    const va = valueOf(a, key)
    const vb = valueOf(b, key)
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    if (va === vb) return (a.market_cap_rank ?? 0) - (b.market_cap_rank ?? 0)
    return va < vb ? -1 * mul : 1 * mul
  })
}

function valueOf(c: ScoredCoin, key: SortKey): number | null {
  switch (key) {
    case 'score':
      return c.score
    case 'market_cap':
      return c.market_cap
    case 'volume':
      return c.total_volume
    case 'volMcap':
      return c.volMcap
    case 'change24h':
      return c.change24h
    case 'change7d':
      return c.change7d
    case 'change30d':
      return c.change30d
    case 'rank':
      return c.market_cap_rank
    default:
      return c.score
  }
}

export default function App() {
  const [coins, setCoins] = useState<ScoredCoin[]>([])
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selected, setSelected] = useState<ScoredCoin | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchScreener()
      const enriched = enrichMarkets(data.markets, data.trendingIds, STATIC_CATEGORY_HINTS)
      setCoins(enriched)
      setFetchedAt(data.fetchedAt)
      setSelected((prev) => {
        if (!prev) return null
        return enriched.find((c) => c.id === prev.id) ?? null
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    let list = coins.filter((c) => {
      if (c.score < filters.minScore) return false
      if (filters.onlyTrending && !c.isTrending) return false
      if (filters.onlyWithCatalyst && c.catalysts.length === 0) return false
      if (filters.maxRiskCount != null && c.risks.length > filters.maxRiskCount) return false
      if (filters.hideExtremePump && c.change7d != null && c.change7d >= 60) return false
      if (filters.minVolMcap > 0 && (c.volMcap == null || c.volMcap < filters.minVolMcap))
        return false
      if (q) {
        const hay = `${c.name} ${c.symbol} ${c.id}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    list = sortCoins(list, sortKey, sortDir)
    return list
  }, [coins, filters, sortKey, sortDir])

  const trendingCount = coins.filter((c) => c.isTrending).length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Disclaimer />

      <header className="border-b border-slate-800/80 bg-slate-950/80 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="text-emerald-400" size={22} />
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                加密机会筛选器
              </h1>
              <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase text-slate-400">
                MVP
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              从市值 Top ~150 中找「值得深挖」的公开线索 · 数据来源 CoinGecko 免费 API
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {fetchedAt && (
              <span title={fetchedAt}>
                更新于{' '}
                {new Date(fetchedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}{' '}
                (CST)
              </span>
            )}
            <span className="hidden sm:inline">
              {coins.length} 币 · 趋势命中 {trendingCount}
            </span>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:border-emerald-500/50 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              刷新
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-4 sm:px-6">
        <ScoreFormula />
        <Filters
          filters={filters}
          sortKey={sortKey}
          sortDir={sortDir}
          onFilters={setFilters}
          onSortKey={setSortKey}
          onSortDir={setSortDir}
          total={coins.length}
          shown={filtered.length}
        />

        {error && (
          <div className="rounded-xl border border-rose-700/50 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
            {error}
            <button type="button" className="ml-3 underline" onClick={() => void load()}>
              重试
            </button>
          </div>
        )}

        {loading && coins.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-16 text-center text-slate-500">
            正在从 CoinGecko 加载市值榜与趋势数据…
          </div>
        ) : (
          <div className={`grid gap-4 ${selected ? 'lg:grid-cols-[1fr_360px]' : ''}`}>
            <CoinTable
              coins={filtered}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
            />
            {selected && (
              <div className="lg:sticky lg:top-4 lg:self-start">
                <DetailPanel coin={selected} onClose={() => setSelected(null)} />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 px-4 py-6 text-center text-[11px] text-slate-600">
        Private research aid · Not financial advice · CoinGecko free public API · 本地缓存约 60s
      </footer>
    </div>
  )
}
