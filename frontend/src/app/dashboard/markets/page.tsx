'use client'

import { useRequireAuth } from '@/hooks/useAuth'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import MarketBoard from '@/components/MarketBoard'
import Heatmap from '@/components/Heatmap'
import { useMarketData } from '@/hooks/useMarketData'

type Exchange = 'all' | 'NSE' | 'BSE'

export default function MarketsPage() {
  useRequireAuth()
  const router = useRouter()
  const { data, connected } = useMarketData()
  const [userEmail, setUserEmail] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [exchange, setExchange] = useState<Exchange>('all')
  useEffect(() => { setUserEmail(localStorage.getItem('user') || '') }, [])

  const openSymbol = (symbol: string) => {
    sessionStorage.setItem('selectedSymbol', symbol)
    router.push('/dashboard')
  }

  const all = data?.quotes || []
  const quotes = all.filter(q => exchange === 'all'
    ? true
    : exchange === 'BSE' ? (q.symbol.includes('(BSE)')) : (!q.symbol.includes('(BSE)')))

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Topbar user={userEmail} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">All Indian Stocks</h1>
              <p className="text-slate-500 text-sm mt-1">{all.length} NSE &amp; BSE listed companies · real market data via Yahoo Finance (₹ INR)</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                {(['all', 'NSE', 'BSE'] as Exchange[]).map(e => (
                  <button key={e} onClick={() => setExchange(e)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${exchange === e ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
                    {e === 'all' ? 'All' : e}
                  </button>
                ))}
              </div>
              <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${connected ? 'bg-green-50' : 'bg-amber-50'}`}>
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></span>
                <span className={`text-xs font-medium ${connected ? 'text-green-700' : 'text-amber-700'}`}>
                  {connected ? 'Live' : 'Connecting'}
                </span>
              </span>
            </div>
          </div>

          <div className="mb-6"><MarketBoard quotes={quotes} currency="INR" onSelect={openSymbol} /></div>
          <Heatmap quotes={quotes} currency="INR" />
        </main>
      </div>
    </div>
  )
}