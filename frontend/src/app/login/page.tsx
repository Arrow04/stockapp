'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (res.ok) {
        window.location.href = '/'
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-8'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md p-8'>
        <h2 className='text-3xl font-bold text-gray-900 mb-6 text-center'>
          SaaS Dashboard
        </h2>
        {error && (
          <div className='mb-4 p-3 rounded-lg bg-red-100 text-red-800 text-sm text-center'>
            {error}
          </div>
        )}
        <form className='space-y-6' onSubmit={handleLogin}>
          <div>
            <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
              Email address
            </label>
            <input
              id='email'
              type='email'
              autoComplete='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className='w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors placeholder-gray-400'
            />
          </div>
          <div>
            <label htmlFor='password' className='block text-sm font-medium text-gray-700 mb-2'>
              Password
            </label>
            <input
              id='password'
              type='password'
              autoComplete='current-password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className='w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors placeholder-gray-400'
            />
          </div>
          {error && (
            <p className='text-sm text-red-600 mb-4'>
              {error}
            </p>
          )}
          <button
            type='submit'
            disabled={loading}
            className='w-full py-3 rounded-lg text-lg font-medium text-white bg-primary-600 hover:bg-primary-500 focus:ring-4 focus:ring-primary-300 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p className='text-sm text-gray-500'>
            <Link href='/dashboard' className='font-medium text-primary-600 hover:text-primary-500'>
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
