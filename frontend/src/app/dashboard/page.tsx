'use client'

import { useRequireAuth } from '@/hooks/useAuth'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import StatsCards from '@/components/StatsCards'
import CandlestickChart from '@/components/CandlestickChart'
import IndiaStockInfo from '@/components/IndiaStockInfo'
import Watchlist from '@/components/Watchlist'
import Heatmap from '@/components/Heatmap'
import ActivityTable from '@/components/ActivityTable'
import { useMarketData, currencyFor, formatMoney } from '@/hooks/useMarketData'

export default function Dashboard() {
  useRequireAuth()
  const router = useRouter()
  const { data, connected } = useMarketData()
  const [user, setUser] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [symbol, setSymbol] = useState('NIFTY 50')

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { router.push('/'); return }
    setUser(stored)
    const selected = sessionStorage.getItem('selectedSymbol')
    if (selected) { setSymbol(selected); sessionStorage.removeItem('selectedSymbol') }
  }, [router])

  const quotes = data?.quotes || []
  const active = quotes.find(q => q.symbol === symbol) || quotes[0]
  const currency = currencyFor(active, 'INR')

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Topbar user={user} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Terminal header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Indian Stock Market</h1>
              <p className="text-slate-500 text-sm mt-1">NSE &amp; BSE · live prices, charts, and analytics in one terminal.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={active?.symbol || symbol}
                onChange={e => setSymbol(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-xs"
              >
                {quotes.map(q => <option key={q.symbol} value={q.symbol}>{q.symbol} · {q.name}</option>)}
              </select>
              <span className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                {connected ? 'LIVE · NSE/BSE' : 'CONNECTING'}
              </span>
            </div>
          </div>

          <StatsCards />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            <div className="xl:col-span-2 space-y-6">
              <CandlestickChart symbol={active?.symbol || symbol} currency={currency} livePrice={active?.ltp} />
              <Heatmap quotes={quotes} currency={currency} />
            </div>
            <div className="space-y-6">
              <IndiaStockInfo quote={active} currency={currency} />
              <Watchlist />
            </div>
          </div>

          <ActivityTable quotes={quotes.slice(0, 8)} currency={currency} />
        </main>
      </div>
    </div>
  )
}