import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { setToken } from '../lib/auth'
import Navbar from '../components/Navbar'

export default function Register() {
  const [name, setName] = useState('')
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
      const { data } = await api.post('/auth/register', { name, email, password })
      setToken(data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
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
            <h1 className="text-2xl font-bold" style={{ color: '#1C2B1A' }}>Create your account</h1>
            <p className="text-gray-500 text-sm mt-1">Start managing your land and herd</p>
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1C2B1A' }}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-600"
                placeholder="John Doe"
              />
            </div>
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
                minLength={8}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-600"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#2D5016' }}
              className="w-full text-white py-2.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#C4922A' }} className="font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
