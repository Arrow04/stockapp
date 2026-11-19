'use client'

import { useMarketData, formatMoney, currencyFor } from '@/hooks/useMarketData'
import type { Quote } from '@/hooks/useMarketData'

export default function ActivityTable({ quotes: qProp, currency: cProp }: { quotes?: Quote[]; currency?: string } = {}) {
  const { data } = useMarketData()
  const quotes = qProp || data?.quotes || []
  const currency = cProp || 'INR'

  // Derive a small "recent activity" view from the live feed symbols.
  const rows = quotes.slice(0, 5).map((q, i) => ({
    time: ['09:15 AM', '09:32 AM', '10:04 AM', '11:20 AM', '12:45 PM'][i] || '—',
    symbol: q.symbol,
    type: i % 3 === 2 ? 'SELL' : 'BUY',
    qty: i % 3 === 2 ? '—' : (q.ltp > 10000 ? '0.05' : q.ltp > 1000 ? '2' : '25'),
    price: formatMoney(q.ltp, currency),
    status: i === 3 ? 'Pending' : 'Completed',
  }))

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 sm:p-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
          <p className="text-sm text-slate-500 mt-1">Live tracked instruments</p>
        </div>
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 px-3 py-1.5 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
          View all
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-y border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Time</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Symbol</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Side</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Qty</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Price</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((order, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-slate-500">{order.time}</td>
                <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">{order.symbol}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${order.type === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {order.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-700">{order.qty}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-700 tabular-nums">{order.price}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${order.status === 'Completed' ? 'text-green-600' : 'text-amber-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'Completed' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}