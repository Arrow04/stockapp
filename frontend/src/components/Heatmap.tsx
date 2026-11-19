'use client'

import type { Quote } from '@/hooks/useMarketData'
import { formatMoney, formatCompact } from '@/hooks/useMarketData'

function heatColor(pct: number) {
  const a = Math.min(Math.abs(pct) / 5, 1)
  return pct >= 0 ? `rgba(16,185,129,${0.18 + a * 0.6})` : `rgba(244,63,94,${0.18 + a * 0.6})`
}

export default function Heatmap({ quotes, currency }: { quotes: Quote[]; currency?: string }) {
  // Weight tile size by volume so bigger assets occupy more area.
  const maxVol = Math.max(...quotes.map(q => q.volume), 1)
  const tiles = quotes.map(q => ({ ...q, weight: 0.5 + (q.volume / maxVol) * 1.5 }))

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">Market Heatmap</h3>
        <p className="text-xs text-slate-400 mt-0.5">Tile size by volume · color by 24h change</p>
      </div>
      <div className="p-4 flex flex-wrap gap-2">
        {tiles.map(q => (
          <div
            key={q.symbol}
            className="rounded-xl p-3 min-w-[120px] flex-1 transition-transform hover:scale-[1.03] cursor-pointer"
            style={{ background: heatColor(q.change_pct), flexGrow: q.weight }}
          >
            <p className="text-sm font-bold text-slate-900">{q.symbol}</p>
            <p className="text-xs text-slate-700 mt-1 tabular-nums">{formatMoney(q.ltp, currency)}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs font-semibold text-slate-800 tabular-nums">{q.change_pct >= 0 ? '+' : ''}{q.change_pct.toFixed(2)}%</span>
              <span className="text-[10px] text-slate-600">V {formatCompact(q.volume)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>Red = down · Green = up</span>
        <span>{quotes.length} assets</span>
      </div>
    </div>
  )
}