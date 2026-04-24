import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function PropertyNav({ propertyId }) {
  const location = useLocation()
  const tabs = [
    { to: `/property/${propertyId}/map`, label: '🗺️ Map' },
    { to: `/property/${propertyId}/herd`, label: '🦌 Herd' },
    { to: `/property/${propertyId}/cameras`, label: '📷 Cameras' },
    { to: `/property/${propertyId}/land`, label: '🌱 Land' },
    { to: `/property/${propertyId}/harvests`, label: '🏹 Harvests' },
    { to: `/property/${propertyId}/reports`, label: '📊 Reports' },
  ]
  return (
    <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
      {tabs.map(tab => (
        <Link
          key={tab.to}
          to={tab.to}
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            location.pathname === tab.to
              ? 'border-accent text-accent'
              : 'border-transparent text-gray-500 hover:text-dark'
          }`}
          style={location.pathname === tab.to ? { borderColor: '#C4922A', color: '#C4922A' } : {}}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
