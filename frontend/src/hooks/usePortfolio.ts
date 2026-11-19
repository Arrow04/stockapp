'use client'

import { useEffect, useState } from 'react'
import { Holding, getHoldings, PORTFOLIO_CHANGED } from '@/lib/portfolio'

export function usePortfolio(user: string) {
  const [holdings, setHoldings] = useState<Holding[]>([])

  useEffect(() => {
    if (!user) return
    const refresh = () => setHoldings(getHoldings(user))
    refresh()
    window.addEventListener(PORTFOLIO_CHANGED, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(PORTFOLIO_CHANGED, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [user])

  return holdings
}