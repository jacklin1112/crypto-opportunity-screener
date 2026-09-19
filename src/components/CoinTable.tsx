import type { ScoredCoin } from '../types/coin'
import { formatCompact, formatPrice, fmtPct } from '../lib/scoring'
import { RiskChips } from './RiskChips'

type Props = {
  coins: ScoredCoin[]
  selectedId: string | null
  onSelect: (coin: ScoredCoin) => void
}

export function CoinTable({ coins, selectedId, onSelect }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/60">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5 font-medium">#</th>
              <th className="px-3 py-2.5 font-medium">币种</th>
              <th className="px-3 py-2.5 font-medium text-right">价格</th>
              <th className="px-3 py-2.5 font-medium text-right">市值</th>
              <th className="px-3 py-2.5 font-medium text-right">24h</th>
              <th className="px-3 py-2.5 font-medium text-right">7d</th>
              <th className="px-3 py-2.5 font-medium text-right">30d</th>
              <th className="px-3 py-2.5 font-medium text-right">成交额</th>
              <th className="px-3 py-2.5 font-medium text-right">成交/市值</th>
              <th className="px-3 py-2.5 font-medium text-right">研究分</th>
              <th className="px-3 py-2.5 font-medium">催化剂</th>
              <th className="px-3 py-2.5 font-medium">风险</th>
            </tr>
          </thead>
          <tbody>
            {coins.map((c) => {
              const selected = c.id === selectedId
              return (
                <tr
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className={`cursor-pointer border-t border-slate-800/80 transition-colors hover:bg-slate-800/50 ${
                    selected ? 'bg-emerald-950/30' : ''
                  }`}
                >
                  <td className="px-3 py-2.5 tabular-nums text-slate-500">
                    {c.market_cap_rank ?? '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <img src={c.image} alt="" className="h-6 w-6 rounded-full" />
                      <div>
                        <div className="font-medium text-slate-100">{c.name}</div>
                        <div className="text-[11px] uppercase text-slate-500">{c.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-200">
                    ${formatPrice(c.current_price)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">
                    ${formatCompact(c.market_cap)}
                  </td>
                  <PctCell v={c.change24h} />
                  <PctCell v={c.change7d} />
                  <PctCell v={c.change30d} />
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">
                    ${formatCompact(c.total_volume)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">
                    {c.volMcap != null ? `${(c.volMcap * 100).toFixed(2)}%` : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="inline-flex min-w-[2.5rem] justify-end rounded-md bg-emerald-950/60 px-1.5 py-0.5 font-semibold tabular-nums text-emerald-300">
                      {c.score}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {c.catalysts.length ? (
                      <div className="flex max-w-[9rem] flex-wrap gap-1">
                        {c.catalysts.slice(0, 2).map((cat) => (
                          <span
                            key={cat.id}
                            className="truncate rounded-full border border-cyan-800/50 bg-cyan-950/30 px-1.5 py-0.5 text-[10px] text-cyan-200"
                          >
                            {cat.label}
                          </span>
                        ))}
                        {c.catalysts.length > 2 && (
                          <span className="text-[10px] text-slate-500">+{c.catalysts.length - 2}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <RiskChips risks={c.risks} compact />
                  </td>
                </tr>
              )
            })}
            {coins.length === 0 && (
              <tr>
                <td colSpan={12} className="px-3 py-10 text-center text-slate-500">
                  没有符合筛选条件的币种
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PctCell({ v }: { v: number | null }) {
  const tone =
    v == null ? 'text-slate-500' : v > 0 ? 'text-emerald-400' : v < 0 ? 'text-rose-400' : 'text-slate-300'
  return <td className={`px-3 py-2.5 text-right tabular-nums ${tone}`}>{fmtPct(v)}</td>
}
