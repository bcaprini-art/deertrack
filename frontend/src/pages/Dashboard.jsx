import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import Navbar from '../components/Navbar'
import { StatCard } from '../components/StatCard'
import { Modal } from '../components/Modal'

const DEER_EMOJI = { BUCK: '🦌', DOE: '🫎', FAWN: '🐣', UNKNOWN: '❓' }

function HealthCircle({ score }) {
  const color = score > 70 ? '#2D5016' : score >= 40 ? '#C4922A' : '#DC2626'
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
        style={{ backgroundColor: color }}
      >
        {score}
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color }}>{score}</div>
        <div className="text-xs text-gray-400">/ 100</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [stats, setStats] = useState(null)
  const [sightings, setSightings] = useState([])
  const [cameras, setCameras] = useState([])
  const [zones, setZones] = useState([])
  const [bucks, setBucks] = useState([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)

  // Modals
  const [showCreateProp, setShowCreateProp] = useState(false)
  const [showLogSighting, setShowLogSighting] = useState(false)
  const [showLogImprovement, setShowLogImprovement] = useState(false)
  const [showLogHarvest, setShowLogHarvest] = useState(false)

  // Forms
  const [propForm, setPropForm] = useState({ name: '', acreage: '', state: '', county: '', notes: '' })
  const [propSaving, setPropSaving] = useState(false)

  const [sightingForm, setSightingForm] = useState({
    date: new Date().toISOString().slice(0, 16),
    type: 'BUCK',
    count: 1,
    cameraId: '',
    zoneId: '',
    antlerClass: '',
    bodyCondition: '',
    buckId: '',
    notes: '',
    photoUrl: '',
  })

  const [impForm, setImpForm] = useState({
    type: 'FOOD_PLOT_PLANT',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    zoneId: '',
    acreage: '',
    species: '',
    cost: '',
    notes: '',
  })

  const [harvestForm, setHarvestForm] = useState({
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

  // Load properties
  useEffect(() => {
    api.get('/properties')
      .then(({ data }) => {
        setProperties(data)
        if (data.length > 0) setSelectedId(data[0].id)
        else setShowCreateProp(true)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Load property data when selected changes
  useEffect(() => {
    if (!selectedId) return
    setStatsLoading(true)
    Promise.all([
      api.get(`/properties/${selectedId}/stats`),
      api.get(`/properties/${selectedId}/sightings?limit=10`),
      api.get(`/properties/${selectedId}/cameras`),
      api.get(`/properties/${selectedId}/zones`),
      api.get(`/properties/${selectedId}/bucks`),
    ])
      .then(([statsRes, sightingsRes, camRes, zoneRes, buckRes]) => {
        setStats(statsRes.data)
        setSightings(sightingsRes.data)
        setCameras(camRes.data)
        setZones(zoneRes.data)
        setBucks(buckRes.data)
      })
      .catch(console.error)
      .finally(() => setStatsLoading(false))
  }, [selectedId])

  const createProperty = async (e) => {
    e.preventDefault()
    setPropSaving(true)
    try {
      const { data } = await api.post('/properties', propForm)
      setProperties(prev => [...prev, data])
      setSelectedId(data.id)
      setShowCreateProp(false)
      setPropForm({ name: '', acreage: '', state: '', county: '', notes: '' })
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create property')
    } finally {
      setPropSaving(false)
    }
  }

  const logSighting = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/properties/${selectedId}/sightings`, sightingForm)
      setShowLogSighting(false)
      // Reload stats + sightings
      const [statsRes, sightingsRes] = await Promise.all([
        api.get(`/properties/${selectedId}/stats`),
        api.get(`/properties/${selectedId}/sightings?limit=10`),
      ])
      setStats(statsRes.data)
      setSightings(sightingsRes.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to log sighting')
    }
  }

  const logImprovement = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/properties/${selectedId}/improvements`, impForm)
      setShowLogImprovement(false)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to log improvement')
    }
  }

  const logHarvest = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/properties/${selectedId}/harvests`, harvestForm)
      setShowLogHarvest(false)
      const statsRes = await api.get(`/properties/${selectedId}/stats`)
      setStats(statsRes.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to log harvest')
    }
  }

  const selectedProp = properties.find(p => p.id === selectedId)

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F5F1EB' }}>
        <Navbar />
        <div className="p-8 text-center text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F1EB' }}>
      <Navbar />
      <div className="px-6 py-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1C2B1A' }}>Dashboard</h1>
            {selectedProp && (
              <p className="text-sm text-gray-500 mt-0.5">
                {selectedProp.acreage ? `${selectedProp.acreage} acres` : ''}{selectedProp.state ? ` · ${selectedProp.state}` : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {properties.length > 1 && (
              <select
                value={selectedId || ''}
                onChange={e => setSelectedId(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                style={{ color: '#1C2B1A' }}
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
            {properties.length === 1 && (
              <span className="font-semibold text-lg" style={{ color: '#1C2B1A' }}>{selectedProp?.name}</span>
            )}
            <button
              onClick={() => setShowCreateProp(true)}
              className="text-sm text-gray-500 border border-gray-200 px-3 py-2 rounded-lg hover:bg-white bg-white"
            >
              + New Property
            </button>
            {selectedId && (
              <Link
                to={`/property/${selectedId}/map`}
                style={{ backgroundColor: '#2D5016' }}
                className="text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
              >
                Open Property →
              </Link>
            )}
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏕️</div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#1C2B1A' }}>No properties yet</h2>
            <p className="text-gray-500 mb-6">Create your first property to get started tracking your land and herd.</p>
            <button
              onClick={() => setShowCreateProp(true)}
              style={{ backgroundColor: '#C4922A' }}
              className="text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90"
            >
              Create Your First Property
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            {statsLoading ? (
              <div className="text-center py-8 text-gray-400">Loading stats...</div>
            ) : stats && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                  <StatCard
                    label="Sightings This Season"
                    value={stats.totalSightings ?? 0}
                    icon="👁️"
                  />
                  <StatCard
                    label="Buck:Doe Ratio"
                    value={stats.buckDoeRatio != null ? `1:${stats.buckDoeRatio}` : 'N/A'}
                    icon="⚖️"
                  />
                  {/* Herd Health Score */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Herd Health</span>
                      <span className="text-xl">🩺</span>
                    </div>
                    {stats.herdHealthScore != null ? (
                      <HealthCircle score={stats.herdHealthScore} />
                    ) : (
                      <div className="text-2xl font-bold text-gray-300">N/A</div>
                    )}
                  </div>
                  <StatCard
                    label="Active Cameras"
                    value={stats.activeCameras ?? 0}
                    icon="📷"
                  />
                  <StatCard
                    label="Harvests This Season"
                    value={stats.totalHarvests ?? 0}
                    icon="🏹"
                    color="#C4922A"
                  />
                </div>

                {/* Quick actions */}
                <div className="flex gap-3 mb-8 flex-wrap">
                  <button
                    onClick={() => setShowLogSighting(true)}
                    style={{ backgroundColor: '#2D5016' }}
                    className="text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2"
                  >
                    👁️ Log Sighting
                  </button>
                  <button
                    onClick={() => setShowLogImprovement(true)}
                    style={{ backgroundColor: '#1C2B1A' }}
                    className="text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2"
                  >
                    🌱 Log Improvement
                  </button>
                  <button
                    onClick={() => setShowLogHarvest(true)}
                    style={{ backgroundColor: '#C4922A' }}
                    className="text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2"
                  >
                    🏹 Log Harvest
                  </button>
                  <Link
                    to={`/property/${selectedId}/herd`}
                    className="border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
                  >
                    🦌 View Herd
                  </Link>
                </div>
              </>
            )}

            {/* Recent sightings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold" style={{ color: '#1C2B1A' }}>Recent Sightings</h2>
                {selectedId && (
                  <Link to={`/property/${selectedId}/cameras`} style={{ color: '#C4922A' }} className="text-sm font-medium">
                    View all →
                  </Link>
                )}
              </div>
              {sightings.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-3xl mb-2">🌲</div>
                  <p className="text-sm">No sightings logged yet. Start tracking your herd!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sightings.map(s => (
                    <div key={s.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <span className="text-2xl flex-shrink-0">{DEER_EMOJI[s.type] || '🦌'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm" style={{ color: '#1C2B1A' }}>
                            {s.count > 1 ? `${s.count}x ` : ''}{s.type}
                          </span>
                          {s.antlerClass && (
                            <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">{s.antlerClass}</span>
                          )}
                          {s.bodyCondition && (
                            <span className="text-xs bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded">{s.bodyCondition}</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {s.camera?.name && <span>📷 {s.camera.name}</span>}
                          {s.zone?.name && <span className="ml-2">📍 {s.zone.name}</span>}
                          {s.buck?.name && <span className="ml-2">🦌 {s.buck.name}</span>}
                          {s.notes && <span className="ml-2 italic">{s.notes}</span>}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Property Modal */}
      <Modal isOpen={showCreateProp} onClose={() => properties.length > 0 && setShowCreateProp(false)} title="Create New Property">
        <form onSubmit={createProperty} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Property Name</label>
            <input
              required
              value={propForm.name}
              onChange={e => setPropForm({ ...propForm, name: e.target.value })}
              placeholder='e.g. "Home Farm", "Smith Creek Bottom"'
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Acreage</label>
              <input
                type="number"
                step="0.1"
                value={propForm.acreage}
                onChange={e => setPropForm({ ...propForm, acreage: e.target.value })}
                placeholder="200"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <input
                value={propForm.state}
                onChange={e => setPropForm({ ...propForm, state: e.target.value })}
                placeholder="Iowa"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">County</label>
            <input
              value={propForm.county}
              onChange={e => setPropForm({ ...propForm, county: e.target.value })}
              placeholder="Johnson County"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={propForm.notes}
              onChange={e => setPropForm({ ...propForm, notes: e.target.value })}
              rows={3}
              placeholder="Describe your property..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={propSaving}
            style={{ backgroundColor: '#2D5016' }}
            className="w-full text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
          >
            {propSaving ? 'Creating...' : 'Create Property'}
          </button>
        </form>
      </Modal>

      {/* Log Sighting Modal */}
      <Modal isOpen={showLogSighting} onClose={() => setShowLogSighting(false)} title="Log Sighting">
        <form onSubmit={logSighting} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date & Time</label>
            <input
              type="datetime-local"
              required
              value={sightingForm.date}
              onChange={e => setSightingForm({ ...sightingForm, date: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Deer Type</label>
              <select
                value={sightingForm.type}
                onChange={e => setSightingForm({ ...sightingForm, type: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                {['BUCK', 'DOE', 'FAWN', 'UNKNOWN'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Count</label>
              <input
                type="number"
                min="1"
                value={sightingForm.count}
                onChange={e => setSightingForm({ ...sightingForm, count: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Camera</label>
            <select
              value={sightingForm.cameraId}
              onChange={e => setSightingForm({ ...sightingForm, cameraId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">-- No Camera --</option>
              {cameras.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Zone</label>
            <select
              value={sightingForm.zoneId}
              onChange={e => setSightingForm({ ...sightingForm, zoneId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">-- No Zone --</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          {sightingForm.type === 'BUCK' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Antler Class</label>
                <select
                  value={sightingForm.antlerClass}
                  onChange={e => setSightingForm({ ...sightingForm, antlerClass: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">-- Select --</option>
                  {['SPIKE', 'FORK', 'BASKET', 'MEDIUM', 'SHOOTER', 'MATURE', 'GIANT'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Link to Known Buck</label>
                <select
                  value={sightingForm.buckId}
                  onChange={e => setSightingForm({ ...sightingForm, buckId: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">-- Unknown Buck --</option>
                  {bucks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Body Condition</label>
            <select
              value={sightingForm.bodyCondition}
              onChange={e => setSightingForm({ ...sightingForm, bodyCondition: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">-- Select --</option>
              {['POOR', 'FAIR', 'GOOD', 'EXCELLENT'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={sightingForm.notes}
              onChange={e => setSightingForm({ ...sightingForm, notes: e.target.value })}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            style={{ backgroundColor: '#2D5016' }}
            className="w-full text-white py-2.5 rounded-lg font-medium"
          >
            Log Sighting
          </button>
        </form>
      </Modal>

      {/* Log Improvement Modal */}
      <Modal isOpen={showLogImprovement} onClose={() => setShowLogImprovement(false)} title="Log Land Improvement">
        <form onSubmit={logImprovement} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={impForm.type}
              onChange={e => setImpForm({ ...impForm, type: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {['FOOD_PLOT_PLANT', 'FOOD_PLOT_MAINTAIN', 'WATER_SOURCE', 'TIMBER_WORK', 'BRUSH_CLEARING', 'BEDDING_CREATE', 'TRAIL_WORK', 'FERTILIZE', 'LIME', 'HERBICIDE', 'OTHER'].map(t => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              required
              value={impForm.description}
              onChange={e => setImpForm({ ...impForm, description: e.target.value })}
              placeholder="Brief description of what was done"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              required
              value={impForm.date}
              onChange={e => setImpForm({ ...impForm, date: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Zone</label>
            <select
              value={impForm.zoneId}
              onChange={e => setImpForm({ ...impForm, zoneId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">-- No Zone --</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Acreage</label>
              <input
                type="number"
                step="0.1"
                value={impForm.acreage}
                onChange={e => setImpForm({ ...impForm, acreage: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={impForm.cost}
                onChange={e => setImpForm({ ...impForm, cost: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Species / Product</label>
            <input
              value={impForm.species}
              onChange={e => setImpForm({ ...impForm, species: e.target.value })}
              placeholder="e.g. Brassica blend, White oak, Mossy Oak BioLogic"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={impForm.notes}
              onChange={e => setImpForm({ ...impForm, notes: e.target.value })}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            style={{ backgroundColor: '#1C2B1A' }}
            className="w-full text-white py-2.5 rounded-lg font-medium"
          >
            Log Improvement
          </button>
        </form>
      </Modal>

      {/* Log Harvest Modal */}
      <Modal isOpen={showLogHarvest} onClose={() => setShowLogHarvest(false)} title="Log Harvest">
        <form onSubmit={logHarvest} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                required
                value={harvestForm.date}
                onChange={e => setHarvestForm({ ...harvestForm, date: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={harvestForm.type}
                onChange={e => setHarvestForm({ ...harvestForm, type: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                {['BUCK', 'DOE', 'FAWN'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {harvestForm.type === 'BUCK' && (
            <div>
              <label className="block text-sm font-medium mb-1">Link to Tracked Buck</label>
              <select
                value={harvestForm.buckId}
                onChange={e => setHarvestForm({ ...harvestForm, buckId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">-- Untracked Buck --</option>
                {bucks.filter(b => !b.harvested).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Age (yrs)</label>
              <input
                type="number"
                step="0.5"
                value={harvestForm.age}
                onChange={e => setHarvestForm({ ...harvestForm, age: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Weight (lbs)</label>
              <input
                type="number"
                step="0.1"
                value={harvestForm.weight}
                onChange={e => setHarvestForm({ ...harvestForm, weight: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Antler Score</label>
              <input
                type="number"
                step="0.125"
                value={harvestForm.antlerScore}
                onChange={e => setHarvestForm({ ...harvestForm, antlerScore: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Zone</label>
            <select
              value={harvestForm.zoneId}
              onChange={e => setHarvestForm({ ...harvestForm, zoneId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">-- No Zone --</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Photo URL</label>
            <input
              type="url"
              value={harvestForm.photoUrl}
              onChange={e => setHarvestForm({ ...harvestForm, photoUrl: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={harvestForm.notes}
              onChange={e => setHarvestForm({ ...harvestForm, notes: e.target.value })}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            style={{ backgroundColor: '#C4922A' }}
            className="w-full text-white py-2.5 rounded-lg font-medium"
          >
            Log Harvest
          </button>
        </form>
      </Modal>
    </div>
  )
}
