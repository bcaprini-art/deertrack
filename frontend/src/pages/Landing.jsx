import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Landing() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F1EB' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ backgroundColor: '#1C2B1A' }} className="px-6 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="text-6xl mb-6">🦌</div>
          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            Know your land.<br />Know your herd.
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            The private management platform built for serious deer hunters. Track your property, monitor your herd, and make smarter decisions every season.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/register" style={{ backgroundColor: '#C4922A' }} className="text-white px-8 py-3 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity">
              Get Started Free
            </Link>
            <Link to="/login" className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-white hover:text-dark transition-colors">
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: '#1C2B1A' }}>
            Everything you need to manage your property
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🗺️', title: 'Property Mapping', desc: 'Visualize your land with interactive maps, zone management, and camera placement.' },
              { icon: '🦌', title: 'Herd Tracking', desc: 'Track individual bucks, log sightings, and monitor herd health over time.' },
              { icon: '📷', title: 'Camera Management', desc: 'Organize your trail cameras, log sightings by location, and identify patterns.' },
              { icon: '🌱', title: 'Land Improvement', desc: 'Log food plots, timber work, water sources, and track soil health over seasons.' },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-2" style={{ color: '#1C2B1A' }}>{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className="py-12 px-6" style={{ backgroundColor: '#2D5016' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { number: '500+', label: 'Properties Managed' },
            { number: '50,000+', label: 'Sightings Logged' },
            { number: '10,000+', label: 'Acres Tracked' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-4xl font-bold text-white mb-1">{s.number}</div>
              <div className="text-green-300 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Demo credentials */}
      <div className="py-20 px-6">
        <div className="max-w-md mx-auto bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
          <h3 className="font-semibold mb-3" style={{ color: '#1C2B1A' }}>Try the Demo</h3>
          <p className="text-sm text-gray-500 mb-3">Use these credentials to explore the demo account:</p>
          <div className="bg-gray-50 rounded-lg p-3 text-sm font-mono space-y-1">
            <div>📧 hunter@deertrack.app</div>
            <div>🔑 Hunt1234!</div>
          </div>
          <Link to="/login" style={{ backgroundColor: '#2D5016' }} className="mt-4 inline-block text-white px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90">
            Login with Demo Account
          </Link>
        </div>
      </div>

      <footer style={{ backgroundColor: '#1C2B1A' }} className="py-8 text-center text-gray-400 text-sm">
        © 2024 DeerTrack — Built for serious land managers
      </footer>
    </div>
  )
}
