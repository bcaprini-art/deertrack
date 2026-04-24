import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../lib/api'
import Navbar from '../components/Navbar'
import PropertyNav from '../components/PropertyNav'
import { Modal } from '../components/Modal'

export default function Herd() {
  const { id } = useParams()
  const [bucks, setBucks] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedBuck, setSelectedBuck] = useState(null)
  const [showAddBuck, setShowAddBuck] = useState(false)
  const [buckForm, setBuckForm] = useState({
    name: '',
    firstSeenYear: new Date().getFullYear(),
    estimatedAge: '',
    notes: '',
    photoUrl: '',
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [bucksRes, statsRes] = await Promise.all([
        api.get(`/properties/${id}/bucks`),
        api.get(`/properties/${id}/stats`),
      ])
      setBucks(bucksRes.data)
      setStats(statsRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const addBuck = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/properties/${id}/bucks`, buckForm)
      setShowAddBuck(false)
      setBuckForm({ name: '', firstSeenYear: new Date().getFullYear(), estimatedAge: '', notes: '', photoUrl: '' })
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add buck')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F5F1EB' }} className="min-h-screen">
        <Navbar />
        <div className="p-8 text-center text-gray-500">Loading herd data...</div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F5F1EB' }} className="min-h-screen">
      <Navbar />
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold" style={{ color: '#1C2B1A' }}>Herd Management</h1>
          <button
            onClick={() => setShowAddBuck(true)}
            style={{ backgroundColor: '#C4922A' }}
            className="text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Buck
          </button>
        </div>
        <PropertyNav propertyId={id} />

        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Bucks Tracked', value: stats.totalBucks ?? 0, icon: '🦌' },
              { label: 'Buck Sightings', value: stats.buckSightings ?? 0, icon: '👁️' },
              { label: 'Doe Sightings', value: stats.doeSightings ?? 0, icon: '🫎' },
              { label: 'Fawn Sightings', value: stats.fawnSightings ?? 0, icon: '🐣' },
              { label: 'Buck:Doe Ratio', value: stats.buckDoeRatio != null ? `1:${stats.buckDoeRatio}` : 'N/A', icon: '⚖️' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-xl font-bold" style={{ color: '#2D5016' }}>{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Buck roster */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bucks.map(buck => (
            <div
              key={buck.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedBuck(selectedBuck?.id === buck.id ? null : buck)}
            >
              {/* Card header */}
              <div style={{ backgroundColor: '#1C2B1A' }} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {buck.photoUrl ? (
                    <img src={buck.photoUrl} alt={buck.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="text-3xl">🦌</div>
                  )}
                  <div>
                    <div className="text-white font-semibold">{buck.name}</div>
                    <div className="text-gray-400 text-xs">First seen {buck.firstSeenYear}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {buck.harvested && (
                    <span style={{ backgroundColor: '#C4922A' }} className="text-white text-xs px-2 py-0.5 rounded-full">
                      Harvested
                    </span>
                  )}
                  <span className="text-gray-500 text-xs">{selectedBuck?.id === buck.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Card body */}
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div>
                    <div className="text-lg font-bold" style={{ color: '#2D5016' }}>
                      {buck.estimatedAge || '?'}
                    </div>
                    <div className="text-xs text-gray-500">Est. Age</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: '#2D5016' }}>
                      {buck._count?.sightings ?? 0}
                    </div>
                    <div className="text-xs text-gray-500">Sightings</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: '#2D5016' }}>
                      {buck.sightings?.[0]
                        ? new Date(buck.sightings[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">Last Seen</div>
                  </div>
                </div>
                {buck.notes && <p className="text-xs text-gray-500 italic">{buck.notes}</p>}
              </div>

              {/* Expanded sighting timeline */}
              {selectedBuck?.id === buck.id && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                  <div className="text-xs font-semibold text-gray-600 mb-2">Recent Sightings</div>
                  {buck.sightings?.length > 0 ? (
                    buck.sightings.slice(0, 5).map(s => (
                      <div key={s.id} className="text-xs text-gray-600 py-1.5 border-b border-gray-50 last:border-0 flex justify-between items-center">
                        <span>{new Date(s.date).toLocaleDateString()}</span>
                        <div className="flex gap-2">
                          {s.antlerClass && <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded">{s.antlerClass}</span>}
                          {s.bodyCondition && <span className="bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded">{s.bodyCondition}</span>}
                          {s.camera?.name && <span className="text-gray-400">📷 {s.camera.name}</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No sightings logged for this buck.</p>
                  )}
                </div>
              )}
            </div>
          ))}

          {bucks.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-500">
              <div className="text-5xl mb-3">🦌</div>
              <p className="font-medium mb-1">No bucks tracked yet</p>
              <p className="text-sm">Add your first buck to start monitoring your herd.</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showAddBuck} onClose={() => setShowAddBuck(false)} title="Add Buck">
        <form onSubmit={addBuck} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name / Nickname</label>
            <input
              required
              value={buckForm.name}
              onChange={e => setBuckForm({ ...buckForm, name: e.target.value })}
              placeholder='e.g. "Tall 8", "Drop Tine", "Split Brow"'
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">First Seen Year</label>
              <input
                type="number"
                required
                min="1990"
                max={new Date().getFullYear()}
                value={buckForm.firstSeenYear}
                onChange={e => setBuckForm({ ...buckForm, firstSeenYear: parseInt(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estimated Age</label>
              <input
                type="number"
                min="0"
                max="20"
                value={buckForm.estimatedAge}
                onChange={e => setBuckForm({ ...buckForm, estimatedAge: e.target.value })}
                placeholder="e.g. 3"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Photo URL (optional)</label>
            <input
              type="url"
              value={buckForm.photoUrl}
              onChange={e => setBuckForm({ ...buckForm, photoUrl: e.target.value })}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={buckForm.notes}
              onChange={e => setBuckForm({ ...buckForm, notes: e.target.value })}
              placeholder="Distinctive features, patterns, locations..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{ backgroundColor: '#2D5016' }}
            className="w-full text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add Buck'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
