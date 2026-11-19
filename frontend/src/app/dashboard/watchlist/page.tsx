'use client'

import { useRequireAuth } from '@/hooks/useAuth'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import { useMarketData, formatMoney } from '@/hooks/useMarketData'

const STORAGE_KEY = 'stockapp_watchlist_v2'

export default function WatchlistPage() {
  useRequireAuth()
  const { data, connected } = useMarketData()
  const [userEmail, setUserEmail] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [symbols, setSymbols] = useState<string[] | null>(null)
  const [adding, setAdding] = useState(false)
  const [pick, setPick] = useState('')

  useEffect(() => { setUserEmail(localStorage.getItem('user') || '') }, [])

  const allSymbols = (data?.quotes || []).map(q => q.symbol)

  useEffect(() => {
    if (!allSymbols.length) return
    const stored = localStorage.getItem(STORAGE_KEY)
    setSymbols(stored ? JSON.parse(stored).filter((s: string) => allSymbols.includes(s)) : allSymbols)
  }, [allSymbols.length])

  useEffect(() => {
    if (symbols) localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols))
  }, [symbols])

  const currency = data?.currency
  const quotes = (data?.quotes || []).filter(q => (symbols || allSymbols).includes(q.symbol))
  const remaining = allSymbols.filter(s => !(symbols || []).includes(s))

  const add = () => {
    if (pick && !(symbols || []).includes(pick)) setSymbols([...(symbols || []), pick])
    setPick('')
    setAdding(false)
  }
  const remove = (symbol: string) => setSymbols((symbols || []).filter(s => s !== symbol))

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Topbar user={userEmail} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Watchlist</h1>
              <p className="text-slate-500 text-sm mt-1">Track live prices of your favorite instruments.</p>
            </div>
            <button onClick={() => setAdding(true)} disabled={remaining.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Symbol
            </button>
          </div>

          {adding && (
            <div className="mb-5 flex flex-wrap items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <select value={pick} onChange={e => setPick(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select a symbol...</option>
                {remaining.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={add} disabled={!pick} className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">Add</button>
              <button onClick={() => setAdding(false)} className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm">Cancel</button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {quotes.map(q => {
              const up = q.change_pct >= 0
              return (
                <div key={q.symbol} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 relative group">
                  <button onClick={() => remove(q.symbol)} title="Remove"
                    className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <p className="text-sm font-semibold text-slate-900">{q.symbol}</p>
                  <p className="text-xs text-slate-500 mb-3 truncate">{q.name}</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatMoney(q.ltp, currency)}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {up ? '▲' : '▼'} {Math.abs(q.change_pct).toFixed(2)}%
                    </span>
                    <span className="text-xs text-slate-400">Vol {(q.volume / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              )
            })}
          </div>

          {quotes.length === 0 && (
            <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-slate-200">
              <p className="text-slate-500">Connecting to live feed...</p>
            </div>
          )}

          <p className="mt-5 text-xs text-slate-400">
            {connected ? '● Live updates active' : '○ Connecting to live feed'} · {quotes.length} symbols tracked · {currency === 'USDT' ? 'USDT (US)' : 'INR (India)'}
          </p>
        </main>
      </div>
    </div>
  )
}