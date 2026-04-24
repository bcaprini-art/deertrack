import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { removeToken, isLoggedIn } from '../lib/auth'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const match = location.pathname.match(/\/property\/([^/]+)/)
  const propertyId = match ? match[1] : null

  const logout = () => {
    removeToken()
    navigate('/')
  }

  const loggedIn = isLoggedIn()

  return (
    <nav style={{ backgroundColor: '#1C2B1A' }} className="px-6 py-4 flex items-center justify-between">
      <Link to={loggedIn ? '/dashboard' : '/'} className="text-white font-bold text-xl flex items-center gap-2">
        🦌 DeerTrack
      </Link>
      <div className="flex items-center gap-4">
        {loggedIn && propertyId && (
          <>
            <NavLink to={`/property/${propertyId}/map`} current={location.pathname}>🗺️ Map</NavLink>
            <NavLink to={`/property/${propertyId}/herd`} current={location.pathname}>🦌 Herd</NavLink>
            <NavLink to={`/property/${propertyId}/cameras`} current={location.pathname}>📷 Cameras</NavLink>
            <NavLink to={`/property/${propertyId}/land`} current={location.pathname}>🌱 Land</NavLink>
            <NavLink to={`/property/${propertyId}/harvests`} current={location.pathname}>🏹 Harvests</NavLink>
            <NavLink to={`/property/${propertyId}/reports`} current={location.pathname}>📊 Reports</NavLink>
          </>
        )}
        {loggedIn && (
          <>
            <Link to="/dashboard" className="text-gray-300 hover:text-white text-sm">Dashboard</Link>
            <button onClick={logout} style={{ backgroundColor: '#C4922A' }} className="text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-90">Logout</button>
          </>
        )}
        {!loggedIn && (
          <>
            <Link to="/login" className="text-gray-300 hover:text-white text-sm">Login</Link>
            <Link to="/register" style={{ backgroundColor: '#C4922A' }} className="text-white px-3 py-1.5 rounded-lg text-sm font-medium">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  )
}

function NavLink({ to, current, children }) {
  const active = current === to
  return (
    <Link to={to} className={`text-sm font-medium transition-colors ${active ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
      {children}
    </Link>
  )
}
