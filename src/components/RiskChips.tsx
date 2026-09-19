import type { RiskChip } from '../types/coin'

const levelClass: Record<RiskChip['level'], string> = {
  low: 'border-slate-600 bg-slate-800 text-slate-300',
  medium: 'border-amber-600/50 bg-amber-950/50 text-amber-200',
  high: 'border-rose-600/50 bg-rose-950/50 text-rose-200',
}

export function RiskChips({ risks, compact }: { risks: RiskChip[]; compact?: boolean }) {
  if (!risks.length) {
    return <span className="text-xs text-slate-600">低风险标签</span>
  }
  return (
    <div className={`flex flex-wrap gap-1 ${compact ? '' : ''}`}>
      {risks.map((r) => (
        <span
          key={r.id}
          title={r.explanation}
          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${levelClass[r.level]}`}
        >
          {r.label}
        </span>
      ))}
    </div>
  )
}
