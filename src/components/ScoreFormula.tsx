import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export function ScoreFormula() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-3 text-sm text-slate-300">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left font-medium text-slate-100"
        onClick={() => setOpen((v) => !v)}
      >
        <span>研究价值分公式（透明）</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-400">
          <p>
            <code className="rounded bg-slate-800 px-1 text-emerald-300">score</code> =
            clamp(0–100, 7d动能0–28 + 24h动能0–18 + 成交关注0–20 + 催化剂0–18 + 市值区间0–16 +
            风险惩罚)
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>7d / 24h 动能：用 tanh 软压缩涨跌幅，温和上涨得分更高，极端拉升会被惩罚项压低</li>
            <li>成交关注：min(成交额÷市值 × 400, 20)，作为流动性/注意力代理</li>
            <li>催化剂：CoinGecko 趋势榜 +12，分类线索最多 +6</li>
            <li>市值甜区：约 $80M–$8B 给满档，微盘/超大盘较低</li>
            <li>惩罚：7日暴涨、低流动性、低市值、极端 24h 波动</li>
          </ul>
          <p className="text-slate-500">
            目标是「值得继续研究」的排序，不是预测涨跌。类似 ZEC 式大行情需要叙事与供需验证，本表只给线索。
          </p>
        </div>
      )}
    </div>
  )
}
