import { X } from 'lucide-react'
import type { ScoredCoin } from '../types/coin'
import { formatCompact, formatPrice, fmtPct } from '../lib/scoring'
import { RiskChips } from './RiskChips'

type Props = {
  coin: ScoredCoin | null
  onClose: () => void
}

export function DetailPanel({ coin, onClose }: Props) {
  if (!coin) return null
  const b = coin.scoreBreakdown

  return (
    <aside className="flex h-full flex-col rounded-xl border border-slate-700/80 bg-slate-900/90 shadow-xl shadow-black/40">
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <img src={coin.image} alt="" className="h-10 w-10 rounded-full" />
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-lg font-semibold text-white">{coin.name}</h3>
              <span className="text-sm uppercase text-slate-400">{coin.symbol}</span>
            </div>
            <p className="text-xs text-slate-500">排名 #{coin.market_cap_rank ?? '—'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="关闭"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Stat label="价格" value={`$${formatPrice(coin.current_price)}`} />
          <Stat label="市值" value={`$${formatCompact(coin.market_cap)}`} />
          <Stat label="24h 成交" value={`$${formatCompact(coin.total_volume)}`} />
          <Stat
            label="成交/市值"
            value={coin.volMcap != null ? `${(coin.volMcap * 100).toFixed(2)}%` : '—'}
          />
          <Stat label="24h" value={fmtPct(coin.change24h)} tone={pctTone(coin.change24h)} />
          <Stat label="7d" value={fmtPct(coin.change7d)} tone={pctTone(coin.change7d)} />
          <Stat label="30d" value={fmtPct(coin.change30d)} tone={pctTone(coin.change30d)} />
          <Stat label="研究分" value={String(coin.score)} tone="text-emerald-300" />
        </div>

        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            证据要点
          </h4>
          <ul className="space-y-2">
            {coin.evidence.map((e, i) => (
              <li
                key={i}
                className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs leading-relaxed text-slate-300"
              >
                {e}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            公开催化剂线索
          </h4>
          {coin.catalysts.length ? (
            <div className="flex flex-wrap gap-2">
              {coin.catalysts.map((c) => (
                <span
                  key={c.id}
                  className="rounded-full border border-cyan-700/40 bg-cyan-950/40 px-2.5 py-1 text-xs text-cyan-200"
                  title={c.source}
                >
                  {c.label}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">暂无趋势榜/分类线索（可继续人工查新闻与链上）。</p>
          )}
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            风险标签
          </h4>
          <RiskChips risks={coin.risks} />
          {coin.risks.length > 0 && (
            <ul className="mt-2 space-y-1.5 text-xs text-slate-400">
              {coin.risks.map((r) => (
                <li key={r.id}>
                  <span className="text-slate-300">{r.label}：</span>
                  {r.explanation}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            分数拆解
          </h4>
          <div className="grid grid-cols-2 gap-1 text-xs text-slate-400">
            <span>7d 动能</span>
            <span className="text-right text-slate-200">{b.momentum7d.toFixed(1)}</span>
            <span>24h 动能</span>
            <span className="text-right text-slate-200">{b.momentum24h.toFixed(1)}</span>
            <span>成交关注</span>
            <span className="text-right text-slate-200">{b.volumeAttention.toFixed(1)}</span>
            <span>催化剂</span>
            <span className="text-right text-slate-200">{b.catalystBonus.toFixed(1)}</span>
            <span>市值区间</span>
            <span className="text-right text-slate-200">{b.mcapSweetSpot.toFixed(1)}</span>
            <span>风险惩罚</span>
            <span className="text-right text-rose-300">{b.penalties.toFixed(1)}</span>
          </div>
        </section>
      </div>
    </aside>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: string
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-0.5 font-medium tabular-nums ${tone || 'text-slate-100'}`}>{value}</div>
    </div>
  )
}

function pctTone(n: number | null): string | undefined {
  if (n == null) return undefined
  if (n > 0) return 'text-emerald-400'
  if (n < 0) return 'text-rose-400'
  return undefined
}
