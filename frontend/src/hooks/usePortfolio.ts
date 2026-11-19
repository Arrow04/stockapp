'use client'

import { useEffect, useState } from 'react'
import { Holding, getHoldings, PORTFOLIO_CHANGED } from '@/lib/portfolio'

export function usePortfolio(user: string) {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let active = true
    const refresh = async () => {
      try {
        const data = await getHoldings()
        if (active) setHoldings(data)
      } catch {
        if (active) setHoldings([])
      } finally {
        if (active) setLoading(false)
      }
    }
    refresh()
    window.addEventListener(PORTFOLIO_CHANGED, refresh)
    return () => {
      active = false
      window.removeEventListener(PORTFOLIO_CHANGED, refresh)
    }
  }, [user])

  return { holdings, loading }
}