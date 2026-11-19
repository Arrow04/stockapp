'use client'

import type { Quote } from '@/hooks/useMarketData'
import { formatMoney } from '@/hooks/useMarketData'

export default function IndiaStockInfo({ quote, currency }: { quote?: Quote; currency?: string }) {
  if (!quote) return null
  const up = quote.change_pct >= 0
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">{quote.symbol}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{quote.name} · {quote.market}</p>
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-sm text-slate-500">Last price</span>
          <span className="text-base font-bold text-slate-900 tabular-nums">{formatMoney(quote.ltp, currency)}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-sm text-slate-500">Day change</span>
          <span className={`text-sm font-bold tabular-nums ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
            {up ? '+' : ''}{quote.change_pct.toFixed(2)}% ({formatMoney(quote.change, currency)})
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-sm text-slate-500">Open / Prev close</span>
          <span className="text-sm font-semibold text-slate-800 tabular-nums">{formatMoney(quote.open, currency)} / {formatMoney(quote.close, currency)}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-sm text-slate-500">Day range</span>
          <span className="text-sm font-semibold text-slate-800 tabular-nums">{formatMoney(quote.low, currency)} – {formatMoney(quote.high, currency)}</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-slate-500">Volume</span>
          <span className="text-sm font-semibold text-slate-800 tabular-nums">{quote.volume.toLocaleString('en-IN')}</span>
        </div>
        <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-indigo-50 text-indigo-700 text-xs">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Live via Yahoo Finance. Prices refresh every 30s during market hours.
        </div>
      </div>
    </div>
  )
}