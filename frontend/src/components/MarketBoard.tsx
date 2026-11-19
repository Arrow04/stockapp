'use client'

import { useState } from 'react'
import type { Quote } from '@/hooks/useMarketData'
import { formatMoney, formatCompact } from '@/hooks/useMarketData'
import Sparkline from '@/components/Sparkline'

type SortKey = 'symbol' | 'ltp' | 'change_pct' | 'volume'

export default function MarketBoard({ quotes, onSelect }: { quotes: Quote[]; currency?: string; onSelect?: (symbol: string) => void }) {
  const [sort, setSort] = useState<SortKey>('change_pct')
  const [desc, setDesc] = useState(true)

  const isBse = (q: Quote) => q.symbol.includes('(BSE)')
  const isIndex = (q: Quote) => q.symbol === 'NIFTY 50' || q.symbol === 'NIFTY Bank' || q.symbol === 'NSEI' || q.symbol === 'NSEBANK'
  const groups = [
    { title: 'NIFTY Indices', sub: 'Market benchmarks', list: quotes.filter(isIndex) },
    { title: 'NSE · National Stock Exchange', sub: 'Listed companies · ₹ INR', list: quotes.filter(q => !isBse(q) && !isIndex(q)) },
    { title: 'BSE · Bombay Stock Exchange', sub: 'Listed companies · ₹ INR', list: quotes.filter(isBse) },
  ]

  const sortBy = (key: SortKey) => {
    if (sort === key) setDesc(d => !d)
    else { setSort(key); setDesc(true) }
  }
  const sorted = (arr: Quote[]) => [...arr].sort((a, b) => {
    const av = a[sort], bv = b[sort]
    const cmp = typeof av === 'string' ? String(av).localeCompare(String(bv)) : (av as number) - (bv as number)
    return desc ? -cmp : cmp
  })
  const Arrow = ({ k }: { k: SortKey }) => sort === k ? <span className="text-indigo-600">{desc ? '▼' : '▲'}</span> : <span className="opacity-0">▼</span>

  return (
    <div className="space-y-6">
      {groups.map(group => (
        group.list.length > 0 && (
          <div key={group.title} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{group.title} <span className="text-sm font-normal text-slate-400">({group.list.length})</span></h2>
                <p className="text-xs text-slate-400 mt-0.5">{group.sub}</p>
              </div>
              <div className="flex gap-1 text-xs">
                {([['symbol', 'Name'], ['ltp', 'Price'], ['change_pct', '24h %'], ['volume', 'Volume']] as [SortKey, string][]).map(([k, label]) => (
                  <button key={k} onClick={() => sortBy(k)} className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${sort === k ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                    {label} <Arrow k={k} />
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 p-4">
              {sorted(group.list).map(q => {
                const up = q.change_pct >= 0
                return (
                  <button key={q.symbol} onClick={() => onSelect?.(q.symbol)} className="text-left p-3 sm:p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all bg-white group">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 truncate">{q.symbol}</p>
                        <p className="text-xs text-slate-400 truncate">{q.name}</p>
                      </div>
                      <Sparkline symbol={q.symbol} positive={up} width={52} height={24} />
                    </div>
                    <p className="text-lg font-bold text-slate-900 mt-3 tabular-nums">{formatMoney(q.ltp, 'INR')}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded ${up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {up ? '▲' : '▼'} {Math.abs(q.change_pct).toFixed(2)}%
                      </span>
                      <span className="text-[11px] text-slate-400">V {formatCompact(q.volume)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      ))}
    </div>
  )
}