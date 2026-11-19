import type { Holding } from '@/models'
export type { Holding } from '@/models'

const API = 'http://localhost:8000/api/portfolio'
export const PORTFOLIO_CHANGED = 'stockapp:portfolio-changed'

function token() {
  return typeof window !== 'undefined' ? localStorage.getItem('stockapp_token') : null
}

async function req(path: string = '', method: string = 'GET', body?: any) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token() || ''}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Portfolio request failed')
  return data
}

/** Holdings are persisted server-side in PostgreSQL. */
export async function getHoldings(): Promise<Holding[]> {
  return req()
}

export async function addHolding(data: Omit<Holding, 'id'>): Promise<Holding[]> {
  const next = await req('', 'POST', data)
  window.dispatchEvent(new Event(PORTFOLIO_CHANGED))
  return next
}

export async function updateHolding(id: string, data: Partial<Omit<Holding, 'id'>>): Promise<Holding[]> {
  // Fetch current to merge symbol (backend update takes full body).
  const all = await getHoldings()
  const current = all.find(h => h.id === id)
  const next = await req(`/${id}`, 'PUT', { symbol: current?.symbol || data.symbol || '', qty: data.qty ?? current?.qty ?? 0, avgPrice: data.avgPrice ?? current?.avgPrice ?? 0 })
  window.dispatchEvent(new Event(PORTFOLIO_CHANGED))
  return next
}

export async function deleteHolding(id: string): Promise<Holding[]> {
  const next = await req(`/${id}`, 'DELETE')
  window.dispatchEvent(new Event(PORTFOLIO_CHANGED))
  return next
}
