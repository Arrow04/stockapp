'use client'

import { useTrades, formatMoney } from '@/hooks/useMarketData'

export default function TradesTape({ symbol, currency }: { symbol: string; currency?: string }) {
  const trades = useTrades(symbol, 12)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Recent Trades</h3>
          <p className="text-xs text-slate-400 mt-0.5">Time &amp; sales · {symbol}</p>
        </div>
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
      </div>

      <div className="grid grid-cols-3 text-[11px] font-semibold text-slate-400 uppercase px-5 py-2 border-b border-slate-100">
        <span>Price</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Time</span>
      </div>

      <div className="divide-y divide-slate-50 max-h-[340px] overflow-y-auto">
        {trades.length === 0 && (
          <p className="text-center text-slate-400 text-xs py-8">Waiting for trades…</p>
        )}
        {trades.map((t, i) => (
          <div key={`${t.time}-${i}`} className="grid grid-cols-3 px-5 py-1.5 text-xs tabular-nums hover:bg-slate-50">
            <span className={`font-medium ${t.isBuyerMaker ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatMoney(t.price, currency)}
            </span>
            <span className="text-right text-slate-700">{t.qty.toFixed(4)}</span>
            <span className="text-right text-slate-400">
              {new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}