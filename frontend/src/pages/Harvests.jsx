import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../lib/api'
import Navbar from '../components/Navbar'
import PropertyNav from '../components/PropertyNav'
import { Modal } from '../components/Modal'

const TYPE_EMOJI = { BUCK: '🦌', DOE: '🫎', FAWN: '🐣' }

export default function Harvests() {
  const { id } = useParams()
  const [harvests, setHarvests] = useState([])
  const [bucks, setBucks] = useState([])
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState('')

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'BUCK',
    buckId: '',
    age: '',
    weight: '',
    antlerScore: '',
    zoneId: '',
    notes: '',
    photoUrl: '',
  })

  const load = async () => {
    try {
      const [harvestRes, buckRes, zoneRes] = await Promise.all([
        api.get(`/properties/${id}/harvests`),
        api.get(`/properties/${id}/bucks`),
        api.get(`/properties/${id}/zones`),
      ])
      setHarvests(harvestRes.data)
      setBucks(buckRes.data)
      setZones(zoneRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const addHarvest = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/properties/${id}/harvests`, form)
      setShowAdd(false)
      setForm({
        date: new Date().toISOString().slice(0, 10),
        type: 'BUCK',
        buckId: '',
        age: '',
        weight: '',
        antlerScore: '',
        zoneId: '',
        notes: '',
        photoUrl: '',
      })
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to log harvest')
    } finally {
      setSaving(false)
    }
  }

  const filtered = filterType ? harvests.filter(h => h.type === filterType) : harvests

  // Summary stats
  const bucks_harvested = harvests.filter(h => h.type === 'BUCK').length
  const does_harvested = harvests.filter(h => h.type === 'DOE').length
  const avg_weight = harvests.filter(h => h.weight).length > 0
    ? (harvests.filter(h => h.weight).reduce((s, h) => s + parseFloat(h.weight), 0) / harvests.filter(h => h.weight).length).toFixed(1)
    : null
  const avg_score = harvests.filter(h => h.antlerScore).length > 0
    ? (harvests.filter(h => h.antlerScore).reduce((s, h) => s + parseFloat(h.antlerScore), 0) / harvests.filter(h => h.antlerScore).length).toFixed(2)
    : null

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F5F1EB' }} className="min-h-screen">
        <Navbar />
        <div className="p-8 text-center text-gray-500">Loading harvests...</div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F5F1EB' }} className="min-h-screen">
      <Navbar />
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold" style={{ color: '#1C2B1A' }}>Harvests</h1>
          <button
            onClick={() => setShowAdd(true)}
            style={{ backgroundColor: '#C4922A' }}
            className="text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Log Harvest
          </button>
        </div>
        <PropertyNav propertyId={id} />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold" style={{ color: '#C4922A' }}>{harvests.length}</div>
            <div className="text-xs text-gray-500">Total Harvests</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold" style={{ color: '#2D5016' }}>{bucks_harvested}</div>
            <div className="text-xs text-gray-500">Bucks 🦌</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold" style={{ color: '#2D5016' }}>{does_harvested}</div>
            <div className="text-xs text-gray-500">Does 🫎</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold" style={{ color: '#2D5016' }}>{avg_weight ? `${avg_weight}` : '—'}</div>
            <div className="text-xs text-gray-500">Avg Weight (lbs)</div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-4 flex gap-3 items-center">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">All Types</option>
            <option value="BUCK">Bucks</option>
            <option value="DOE">Does</option>
            <option value="FAWN">Fawns</option>
          </select>
          {filterType && (
            <button onClick={() => setFilterType('')} className="text-sm text-gray-500 hover:text-gray-700">
              Clear ×
            </button>
          )}
        </div>

        {/* Harvest cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(harvest => (
            <div key={harvest.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {harvest.photoUrl && (
                <img src={harvest.photoUrl} alt="Harvest" className="w-full h-40 object-cover" />
              )}
              <div style={{ backgroundColor: '#1C2B1A' }} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{TYPE_EMOJI[harvest.type] || '🦌'}</span>
                  <div>
                    <div className="text-white font-semibold">
                      {harvest.buck?.name || harvest.type}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {new Date(harvest.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <span
                  className="text-white text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: harvest.type === 'BUCK' ? '#C4922A' : '#2D5016' }}
                >
                  {harvest.type}
                </span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div>
                    <div className="text-lg font-bold" style={{ color: '#2D5016' }}>
                      {harvest.age ? `${harvest.age}yr` : '—'}
                    </div>
                    <div className="text-xs text-gray-500">Age</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: '#2D5016' }}>
                      {harvest.weight ? `${harvest.weight}` : '—'}
                    </div>
                    <div className="text-xs text-gray-500">Wt (lbs)</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: '#2D5016' }}>
                      {harvest.antlerScore ? `${harvest.antlerScore}"` : '—'}
                    </div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                </div>
                {harvest.zone && (
                  <div className="text-xs text-gray-500 mb-2">📍 {harvest.zone.name}</div>
                )}
                {harvest.notes && <p className="text-xs text-gray-400 italic">{harvest.notes}</p>}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-500">
              <div className="text-5xl mb-3">🏹</div>
              <p className="font-medium mb-1">No harvests logged yet</p>
              <p className="text-sm">Track your season's harvests to build long-term records.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Harvest Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Log Harvest">
        <form onSubmit={addHarvest} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="BUCK">Buck 🦌</option>
                <option value="DOE">Doe 🫎</option>
                <option value="FAWN">Fawn 🐣</option>
              </select>
            </div>
          </div>
          {form.type === 'BUCK' && (
            <div>
              <label className="block text-sm font-medium mb-1">Link to Tracked Buck</label>
              <select
                value={form.buckId}
                onChange={e => setForm({ ...form, buckId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— Untracked Buck —</option>
                {bucks.filter(b => !b.harvested).map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Age (yrs)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={form.age}
                onChange={e => setForm({ ...form, age: e.target.value })}
                placeholder="3.5"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Weight (lbs)</label>
              <input
                type="number"
                step="0.5"
                value={form.weight}
                onChange={e => setForm({ ...form, weight: e.target.value })}
                placeholder="180"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Antler Score</label>
              <input
                type="number"
                step="0.125"
                value={form.antlerScore}
                onChange={e => setForm({ ...form, antlerScore: e.target.value })}
                placeholder="140.5"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Zone / Location</label>
            <select
              value={form.zoneId}
              onChange={e => setForm({ ...form, zoneId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">— No Zone —</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Photo URL</label>
            <input
              type="url"
              value={form.photoUrl}
              onChange={e => setForm({ ...form, photoUrl: e.target.value })}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Season highlights, hunt details..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{ backgroundColor: '#C4922A' }}
            className="w-full text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? 'Logging...' : 'Log Harvest'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
