'use client'

import { useMarketData, formatMoney } from '@/hooks/useMarketData'

export default function Watchlist() {
  const { data, connected } = useMarketData()
  const currency = 'INR'
  const quotes = (data?.quotes || []).slice(0, 8)

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-900">Watchlist</h3>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} title={connected ? 'Live' : 'Connecting'}></span>
        </div>
        <button className="text-indigo-600 hover:text-indigo-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>
      <div className="space-y-1">
        {quotes.length === 0 && (
          <div className="text-sm text-slate-400 py-8 text-center">Connecting to feed...</div>
        )}
        {quotes.map((stock) => (
          <div key={stock.symbol} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                {stock.symbol.slice(0, 2).replace('/', '')}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{stock.symbol}</p>
                <p className="text-xs text-slate-500">{stock.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900 tabular-nums">{formatMoney(stock.ltp, currency)}</p>
              <p className={`text-xs font-medium tabular-nums ${stock.change_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stock.change_pct >= 0 ? '+' : ''}{stock.change_pct.toFixed(2)}%
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button className="text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg px-2 py-1 transition-colors">
          View all stocks
        </button>
        <span className="text-xs text-slate-400">
          {data?.provider === 'india' ? 'NSE/BSE Live' : data?.provider?.toUpperCase() || '—'}
        </span>
      </div>
    </div>
  )
}