'use client'

import { useMarketData, formatMoney, formatCompact } from '@/hooks/useMarketData'

export default function StatsCards() {
  const { data } = useMarketData()
  const quotes = data?.quotes || []
  const nifty = quotes.find(q => q.symbol === 'NIFTY 50')
  const banknifty = quotes.find(q => q.symbol === 'NIFTY Bank' || q.symbol === 'NSEBANK')
  const gainers = quotes.filter(q => q.change_pct > 0).length
  const losers = quotes.filter(q => q.change_pct < 0).length
  const totalVol = quotes.reduce((s, q) => s + q.volume, 0)

  const cards = [
    { label: 'NIFTY 50', value: nifty ? formatMoney(nifty.ltp, 'INR') : '—', sub: nifty ? `${nifty.change_pct >= 0 ? '+' : ''}${nifty.change_pct.toFixed(2)}% today` : 'Live index', positive: (nifty?.change_pct ?? 0) >= 0, color: 'bg-indigo-500' },
    { label: 'NIFTY Bank', value: banknifty ? formatMoney(banknifty.ltp, 'INR') : '—', sub: banknifty ? `${banknifty.change_pct >= 0 ? '+' : ''}${banknifty.change_pct.toFixed(2)}% today` : 'Live index', positive: (banknifty?.change_pct ?? 0) >= 0, color: 'bg-purple-500' },
    { label: 'Advances / Declines', value: `${gainers} / ${losers}`, sub: 'across tracked stocks', positive: gainers >= losers, color: 'bg-emerald-500' },
    { label: 'Total Volume', value: formatCompact(totalVol), sub: `${quotes.length} symbols`, positive: true, color: 'bg-orange-500' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm text-slate-500 font-medium">{c.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-2 truncate">{c.value}</p>
            </div>
            <div className={`w-11 h-11 ${c.color} rounded-lg flex items-center justify-center shrink-0`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
          </div>
          <p className={`text-sm font-medium mt-3 ${c.positive ? 'text-emerald-600' : 'text-rose-600'}`}>{c.sub}</p>
        </div>
      ))}
    </div>
  )
}