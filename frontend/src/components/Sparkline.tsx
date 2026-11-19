'use client'

import { useKlines } from '@/hooks/useMarketData'

export default function Sparkline({ symbol, positive, width = 96, height = 32 }: { symbol: string; positive: boolean; width?: number; height?: number }) {
  const { candles } = useKlines(symbol, '5m', 20)
  const values = candles.map(c => c.close)
  if (values.length < 2) return <div style={{ width, height }} className="bg-slate-100 rounded animate-pulse" />

  const min = Math.min(...values), max = Math.max(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - 2 - ((v - min) / range) * (height - 4)}`).join(' ')
  const color = positive ? '#10b981' : '#f43f5e'

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}