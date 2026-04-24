import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import api from '../lib/api'
import Navbar from '../components/Navbar'
import PropertyNav from '../components/PropertyNav'

const COLORS = ['#2D5016', '#C4922A', '#1C2B1A', '#4a7c2a', '#8B4513', '#1E90FF']

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold" style={{ color: '#1C2B1A' }}>{title}</h2>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  )
}

function ChartCard({ children, title, subtitle }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      {title && <SectionHeader title={title} subtitle={subtitle} />}
      {children}
    </div>
  )
}

export default function Reports() {
  const { id } = useParams()
  const [stats, setStats] = useState(null)
  const [sightings, setSightings] = useState([])
  const [harvests, setHarvests] = useState([])
  const [improvements, setImprovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('season') // season | year | all

  useEffect(() => {
    Promise.all([
      api.get(`/properties/${id}/stats`),
      api.get(`/properties/${id}/sightings?limit=500`),
      api.get(`/properties/${id}/harvests`),
      api.get(`/properties/${id}/improvements`),
    ])
      .then(([statsRes, sightingsRes, harvestsRes, impRes]) => {
        setStats(statsRes.data)
        setSightings(sightingsRes.data)
        setHarvests(harvestsRes.data)
        setImprovements(impRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  // Build sightings-by-month data
  const sightingsByMonth = React.useMemo(() => {
    const months = {}
    sightings.forEach(s => {
      const d = new Date(s.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      if (!months[key]) months[key] = { month: label, BUCK: 0, DOE: 0, FAWN: 0, UNKNOWN: 0, total: 0 }
      months[key][s.type] = (months[key][s.type] || 0) + (s.count || 1)
      months[key].total += (s.count || 1)
    })
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v)
  }, [sightings])

  // Sightings by type (pie)
  const sightingsByType = React.useMemo(() => {
    const counts = {}
    sightings.forEach(s => {
      counts[s.type] = (counts[s.type] || 0) + (s.count || 1)
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [sightings])

  // Sightings by time of day
  const sightingsByHour = React.useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, count: 0 }))
    sightings.forEach(s => {
      const h = new Date(s.date).getHours()
      hours[h].count += (s.count || 1)
    })
    return hours.filter(h => h.count > 0)
  }, [sightings])

  // Improvements by type
  const impByType = React.useMemo(() => {
    const counts = {}
    improvements.forEach(i => {
      const label = i.type.replace(/_/g, ' ')
      counts[label] = (counts[label] || 0) + 1
    })
    return Object.entries(counts).map(([name, count]) => ({ name, count }))
  }, [improvements])

  // Harvest trend by year
  const harvestByYear = React.useMemo(() => {
    const years = {}
    harvests.forEach(h => {
      const y = new Date(h.date).getFullYear()
      if (!years[y]) years[y] = { year: y, BUCK: 0, DOE: 0, FAWN: 0 }
      years[y][h.type] = (years[y][h.type] || 0) + 1
    })
    return Object.values(years).sort((a, b) => a.year - b.year)
  }, [harvests])

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F5F1EB' }} className="min-h-screen">
        <Navbar />
        <div className="p-8 text-center text-gray-500">Generating reports...</div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F5F1EB' }} className="min-h-screen">
      <Navbar />
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold" style={{ color: '#1C2B1A' }}>Reports & Analytics</h1>
        </div>
        <PropertyNav propertyId={id} />

        {/* Summary stat cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Sightings', value: stats.totalSightings ?? 0, icon: '👁️' },
              { label: 'Bucks Tracked', value: stats.totalBucks ?? 0, icon: '🦌' },
              { label: 'Total Harvests', value: stats.totalHarvests ?? 0, icon: '🏹' },
              { label: 'Herd Health', value: stats.herdHealthScore != null ? `${stats.herdHealthScore}/100` : 'N/A', icon: '🩺' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">{s.label}</span>
                  <span>{s.icon}</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: '#2D5016' }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sightings by month */}
          <ChartCard title="Sightings by Month" subtitle="Buck, doe, and fawn sightings over time">
            {sightingsByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sightingsByMonth} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="BUCK" fill="#2D5016" name="Bucks" stackId="a" />
                  <Bar dataKey="DOE" fill="#C4922A" name="Does" stackId="a" />
                  <Bar dataKey="FAWN" fill="#8B4513" name="Fawns" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-400 text-sm">No sighting data yet</div>
            )}
          </ChartCard>

          {/* Sightings by type — Pie */}
          <ChartCard title="Sightings by Type" subtitle="Overall deer type breakdown">
            {sightingsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sightingsByType}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {sightingsByType.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-400 text-sm">No sighting data yet</div>
            )}
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sightings by hour */}
          <ChartCard title="Activity by Time of Day" subtitle="When are deer most active on your property?">
            {sightingsByHour.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sightingsByHour} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2D5016" name="Sightings" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-400 text-sm">No sighting data yet</div>
            )}
          </ChartCard>

          {/* Harvest trend */}
          <ChartCard title="Harvest History" subtitle="Harvests by year and type">
            {harvestByYear.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={harvestByYear} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="BUCK" fill="#C4922A" name="Bucks" />
                  <Bar dataKey="DOE" fill="#2D5016" name="Does" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-400 text-sm">No harvest data yet</div>
            )}
          </ChartCard>
        </div>

        {/* Land improvements breakdown */}
        {impByType.length > 0 && (
          <div className="mb-6">
            <ChartCard title="Land Improvements by Type" subtitle="Distribution of habitat work logged">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={impByType} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4a7c2a" name="Count" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* Herd ratio summary table */}
        {stats && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <SectionHeader title="Season Summary" subtitle="Key metrics for your property" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Buck Sightings', value: stats.buckSightings ?? 0 },
                { label: 'Doe Sightings', value: stats.doeSightings ?? 0 },
                { label: 'Fawn Sightings', value: stats.fawnSightings ?? 0 },
                { label: 'Buck:Doe Ratio', value: stats.buckDoeRatio != null ? `1:${stats.buckDoeRatio}` : 'N/A' },
                { label: 'Active Cameras', value: stats.activeCameras ?? 0 },
                { label: 'Total Cameras', value: stats.totalCameras ?? 0 },
                { label: 'Total Zones', value: stats.totalZones ?? 0 },
                { label: 'Improvements Logged', value: improvements.length },
              ].map(item => (
                <div key={item.label} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold" style={{ color: '#2D5016' }}>{item.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
