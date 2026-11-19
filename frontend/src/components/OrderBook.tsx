'use client'

import { useDepth, formatMoney, formatCompact } from '@/hooks/useMarketData'

export default function OrderBook({ symbol, currency }: { symbol: string; currency?: string }) {
  const { bids, asks } = useDepth(symbol, 9)

  const maxQty = Math.max(
    ...bids.map(b => b[1]),
    ...asks.map(a => a[1]),
    1
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Order Book</h3>
          <p className="text-xs text-slate-400 mt-0.5">{symbol} · live depth</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          LIVE
        </span>
      </div>

      <div className="grid grid-cols-2 text-[11px] font-semibold text-slate-400 uppercase px-4 py-2 border-b border-slate-100">
        <span>Price ({currency === 'USDT' ? 'USDT' : 'INR'})</span>
        <span className="text-right">Amount</span>
      </div>

      {/* Asks (highest at top, best ask at bottom) */}
      <div className="px-2 py-1">
        {asks.slice().reverse().map(([price, qty], i) => (
          <div key={i} className="relative flex items-center justify-between px-2 py-1 text-xs tabular-nums">
            <div className="absolute inset-y-0 right-0 bg-rose-50 rounded" style={{ width: `${(qty / maxQty) * 100}%` }}></div>
            <span className="relative text-rose-600 font-medium">{formatMoney(price, currency)}</span>
            <span className="relative text-slate-700">{formatCompact(qty)}</span>
          </div>
        ))}
      </div>

      {/* Spread divider */}
      <div className="mx-3 my-1 py-1.5 bg-slate-50 rounded-lg text-center">
        <span className="text-xs font-semibold text-slate-600 tabular-nums">
          {bids.length && asks.length ? formatMoney(asks[0][0] - bids[0][0], currency) : '—'} <span className="text-slate-400 font-normal">spread</span>
        </span>
      </div>

      {/* Bids */}
      <div className="px-2 py-1">
        {bids.map(([price, qty], i) => (
          <div key={i} className="relative flex items-center justify-between px-2 py-1 text-xs tabular-nums">
            <div className="absolute inset-y-0 right-0 bg-emerald-50 rounded" style={{ width: `${(qty / maxQty) * 100}%` }}></div>
            <span className="relative text-emerald-600 font-medium">{formatMoney(price, currency)}</span>
            <span className="relative text-slate-700">{formatCompact(qty)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}