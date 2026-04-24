import React from 'react'

export function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color: color || '#2D5016' }}>{value}</div>
    </div>
  )
}
