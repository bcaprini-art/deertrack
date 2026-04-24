import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { setToken } from '../lib/auth'
import Navbar from '../components/Navbar'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setToken(data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F1EB' }}>
      <Navbar />
      <div className="flex justify-center items-center py-20 px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🦌</div>
            <h1 className="text-2xl font-bold" style={{ color: '#1C2B1A' }}>Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your DeerTrack account</p>
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1C2B1A' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-600"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1C2B1A' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-600"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#2D5016' }}
              className="w-full text-white py-2.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#C4922A' }} className="font-medium">Sign up</Link>
          </p>
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 mb-2">Demo account:</p>
            <button
              type="button"
              onClick={() => { setEmail('hunter@deertrack.app'); setPassword('Hunt1234!') }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Fill demo credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
