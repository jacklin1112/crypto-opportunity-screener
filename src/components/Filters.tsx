import type { FilterState, SortKey } from '../types/coin'

type Props = {
  filters: FilterState
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  onFilters: (f: FilterState) => void
  onSortKey: (k: SortKey) => void
  onSortDir: (d: 'asc' | 'desc') => void
  total: number
  shown: number
}

export function Filters({
  filters,
  sortKey,
  sortDir,
  onFilters,
  onSortKey,
  onSortDir,
  total,
  shown,
}: Props) {
  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onFilters({ ...filters, [key]: value })

  return (
    <div className="space-y-3 rounded-xl border border-slate-700/80 bg-slate-900/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-100">筛选与排序</h2>
        <span className="text-xs text-slate-500">
          显示 {shown} / {total}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-xs text-slate-400">
          搜索名称 / 代码
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500/60"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="BTC / bitcoin…"
          />
        </label>

        <label className="block text-xs text-slate-400">
          最低研究分：{filters.minScore}
          <input
            type="range"
            min={0}
            max={80}
            step={1}
            className="mt-2 w-full accent-emerald-500"
            value={filters.minScore}
            onChange={(e) => set('minScore', Number(e.target.value))}
          />
        </label>

        <label className="block text-xs text-slate-400">
          最低成交/市值：{(filters.minVolMcap * 100).toFixed(1)}%
          <input
            type="range"
            min={0}
            max={0.1}
            step={0.005}
            className="mt-2 w-full accent-emerald-500"
            value={filters.minVolMcap}
            onChange={(e) => set('minVolMcap', Number(e.target.value))}
          />
        </label>

        <label className="block text-xs text-slate-400">
          排序字段
          <div className="mt-1 flex gap-2">
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              value={sortKey}
              onChange={(e) => onSortKey(e.target.value as SortKey)}
            >
              <option value="score">研究分</option>
              <option value="change7d">7日涨跌</option>
              <option value="change24h">24h涨跌</option>
              <option value="change30d">30日涨跌</option>
              <option value="volMcap">成交/市值</option>
              <option value="volume">成交额</option>
              <option value="market_cap">市值</option>
              <option value="rank">市值排名</option>
            </select>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:border-emerald-500/50"
              onClick={() => onSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
              title="切换升降序"
            >
              {sortDir === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </label>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-300">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="accent-emerald-500"
            checked={filters.onlyTrending}
            onChange={(e) => set('onlyTrending', e.target.checked)}
          />
          仅趋势榜
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="accent-emerald-500"
            checked={filters.onlyWithCatalyst}
            onChange={(e) => set('onlyWithCatalyst', e.target.checked)}
          />
          有公开催化剂线索
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="accent-emerald-500"
            checked={filters.hideExtremePump}
            onChange={(e) => set('hideExtremePump', e.target.checked)}
          />
          隐藏 7日暴涨(≥60%)
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          风险筹码上限
          <select
            className="rounded border border-slate-700 bg-slate-950 px-2 py-1"
            value={filters.maxRiskCount ?? ''}
            onChange={(e) =>
              set('maxRiskCount', e.target.value === '' ? null : Number(e.target.value))
            }
          >
            <option value="">不限</option>
            <option value="0">0</option>
            <option value="1">≤1</option>
            <option value="2">≤2</option>
            <option value="3">≤3</option>
          </select>
        </label>
      </div>
    </div>
  )
}
