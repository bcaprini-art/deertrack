import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../lib/api'
import Navbar from '../components/Navbar'
import PropertyNav from '../components/PropertyNav'
import { Modal } from '../components/Modal'

export default function Cameras() {
  const { id } = useParams()
  const [cameras, setCameras] = useState([])
  const [bucks, setBucks] = useState([])
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddCamera, setShowAddCamera] = useState(false)
  const [logSightingCamera, setLogSightingCamera] = useState(null)
  const [saving, setSaving] = useState(false)

  const [cameraForm, setCameraForm] = useState({ name: '', lat: '', lng: '', notes: '' })
  const [sightingForm, setSightingForm] = useState({
    date: new Date().toISOString().slice(0, 16),
    type: 'BUCK',
    count: 1,
    antlerClass: '',
    bodyCondition: '',
    buckId: '',
    notes: '',
    photoUrl: '',
  })

  const load = async () => {
    try {
      const [camRes, buckRes, zoneRes] = await Promise.all([
        api.get(`/properties/${id}/cameras`),
        api.get(`/properties/${id}/bucks`),
        api.get(`/properties/${id}/zones`),
      ])
      setCameras(camRes.data)
      setBucks(buckRes.data)
      setZones(zoneRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const addCamera = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/properties/${id}/cameras`, cameraForm)
      setShowAddCamera(false)
      setCameraForm({ name: '', lat: '', lng: '', notes: '' })
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add camera')
    } finally {
      setSaving(false)
    }
  }

  const logSighting = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/properties/${id}/sightings`, {
        ...sightingForm,
        cameraId: logSightingCamera.id,
        zoneId: logSightingCamera.zoneId || undefined,
      })
      setLogSightingCamera(null)
      setSightingForm({
        date: new Date().toISOString().slice(0, 16),
        type: 'BUCK',
        count: 1,
        antlerClass: '',
        bodyCondition: '',
        buckId: '',
        notes: '',
        photoUrl: '',
      })
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to log sighting')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (camera) => {
    try {
      await api.patch(`/properties/${id}/cameras/${camera.id}`, { active: !camera.active })
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update camera')
    }
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F5F1EB' }} className="min-h-screen">
        <Navbar />
        <div className="p-8 text-center text-gray-500">Loading cameras...</div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F5F1EB' }} className="min-h-screen">
      <Navbar />
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold" style={{ color: '#1C2B1A' }}>Trail Cameras</h1>
          <button
            onClick={() => setShowAddCamera(true)}
            style={{ backgroundColor: '#C4922A' }}
            className="text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Camera
          </button>
        </div>
        <PropertyNav propertyId={id} />

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold" style={{ color: '#2D5016' }}>{cameras.length}</div>
            <div className="text-xs text-gray-500">Total Cameras</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold" style={{ color: '#2D5016' }}>{cameras.filter(c => c.active).length}</div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold" style={{ color: '#2D5016' }}>
              {cameras.reduce((sum, c) => sum + (c._count?.sightings || 0), 0)}
            </div>
            <div className="text-xs text-gray-500">Total Sightings</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameras.map(cam => (
            <div key={cam.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📷</span>
                  <div>
                    <div className="font-semibold" style={{ color: '#1C2B1A' }}>{cam.name}</div>
                    <div className="text-xs text-gray-400">{cam.zone?.name || 'No zone assigned'}</div>
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(cam)}
                  className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                    cam.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {cam.active ? '🟢 Active' : '🔴 Inactive'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center bg-gray-50 rounded-lg py-3">
                  <div className="text-lg font-bold" style={{ color: '#2D5016' }}>{cam._count?.sightings ?? 0}</div>
                  <div className="text-xs text-gray-500">Total Sightings</div>
                </div>
                <div className="text-center bg-gray-50 rounded-lg py-3">
                  <div className="text-sm font-medium" style={{ color: '#2D5016' }}>
                    {cam.sightings?.[0]
                      ? new Date(cam.sightings[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : 'Never'}
                  </div>
                  <div className="text-xs text-gray-500">Last Sighting</div>
                </div>
              </div>

              {cam.lat && cam.lng && (
                <div className="text-xs text-gray-400 mb-3">
                  📍 {parseFloat(cam.lat).toFixed(4)}, {parseFloat(cam.lng).toFixed(4)}
                </div>
              )}

              {cam.notes && <p className="text-xs text-gray-500 italic mb-3">{cam.notes}</p>}

              <button
                onClick={() => setLogSightingCamera(cam)}
                style={{ backgroundColor: '#2D5016' }}
                className="w-full text-white py-2 rounded-lg text-sm font-medium hover:opacity-90"
              >
                Log Sighting
              </button>
            </div>
          ))}

          {cameras.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-500">
              <div className="text-5xl mb-3">📷</div>
              <p className="font-medium mb-1">No cameras added yet</p>
              <p className="text-sm">Add your trail cameras to start logging sightings by location.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Camera Modal */}
      <Modal isOpen={showAddCamera} onClose={() => setShowAddCamera(false)} title="Add Camera">
        <form onSubmit={addCamera} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Camera Name</label>
            <input
              required
              value={cameraForm.name}
              onChange={e => setCameraForm({ ...cameraForm, name: e.target.value })}
              placeholder='e.g. "Scrape Cam", "Big Oak Stand"'
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={cameraForm.lat}
                onChange={e => setCameraForm({ ...cameraForm, lat: e.target.value })}
                placeholder="41.8781"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={cameraForm.lng}
                onChange={e => setCameraForm({ ...cameraForm, lng: e.target.value })}
                placeholder="-87.6298"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Zone</label>
            <select
              value={cameraForm.zoneId || ''}
              onChange={e => setCameraForm({ ...cameraForm, zoneId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">-- No Zone --</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={cameraForm.notes}
              onChange={e => setCameraForm({ ...cameraForm, notes: e.target.value })}
              rows={2}
              placeholder="Camera setup notes, facing direction, etc."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{ backgroundColor: '#C4922A' }}
            className="w-full text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add Camera'}
          </button>
        </form>
      </Modal>

      {/* Log Sighting Modal */}
      <Modal
        isOpen={!!logSightingCamera}
        onClose={() => setLogSightingCamera(null)}
        title={`Log Sighting — ${logSightingCamera?.name}`}
      >
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
                onChange={e => setSightingForm({ ...sightingForm, count: parseInt(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
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
            <label className="block text-sm font-medium mb-1">Photo URL</label>
            <input
              type="url"
              value={sightingForm.photoUrl}
              onChange={e => setSightingForm({ ...sightingForm, photoUrl: e.target.value })}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
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
            disabled={saving}
            style={{ backgroundColor: '#2D5016' }}
            className="w-full text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? 'Logging...' : 'Log Sighting'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
