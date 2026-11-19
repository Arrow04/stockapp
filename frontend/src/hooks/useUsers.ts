'use client'

import { useEffect, useState } from 'react'
import { AppUser, getUsers, USERS_CHANGED_EVENT } from '@/lib/users'

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>(() => getUsers())

  useEffect(() => {
    const refresh = () => setUsers(getUsers())
    refresh()
    window.addEventListener(USERS_CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(USERS_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return users
}
