import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../lib/api'
import Navbar from '../components/Navbar'
import PropertyNav from '../components/PropertyNav'
import { Modal } from '../components/Modal'

// Fix leaflet default icon issue with vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const ZONE_COLORS = {
  FOOD_PLOT: '#2D5016',
  BEDDING: '#8B4513',
  WATER: '#1E90FF',
  TRAVEL_CORRIDOR: '#FF8C00',
  TIMBER: '#556B2F',
  OPEN_FIELD: '#9ACD32',
  STAND_LOCATION: '#DC143C',
  OTHER: '#6B7280',
}

const ZONE_TYPES = ['FOOD_PLOT', 'BEDDING', 'WATER', 'TRAVEL_CORRIDOR', 'TIMBER', 'OPEN_FIELD', 'STAND_LOCATION', 'OTHER']

export default function PropertyMap() {
  const { id } = useParams()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddZone, setShowAddZone] = useState(false)
  const [showAddCamera, setShowAddCamera] = useState(false)
  const [zoneForm, setZoneForm] = useState({ name: '', type: 'FOOD_PLOT', acreage: '', lat: '', lng: '', notes: '' })
  const [cameraForm, setCameraForm] = useState({ name: '', lat: '', lng: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const { data } = await api.get(`/properties/${id}`)
      setProperty(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const getCenter = () => {
    const zonesWithCoords = property?.zones?.filter(z => z.lat && z.lng)
    if (zonesWithCoords?.length) return [parseFloat(zonesWithCoords[0].lat), parseFloat(zonesWithCoords[0].lng)]
    const camsWithCoords = property?.cameras?.filter(c => c.lat && c.lng)
    if (camsWithCoords?.length) return [parseFloat(camsWithCoords[0].lat), parseFloat(camsWithCoords[0].lng)]
    return [40.5, -89.0]
  }

  const addZone = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/properties/${id}/zones`, zoneForm)
      setShowAddZone(false)
      setZoneForm({ name: '', type: 'FOOD_PLOT', acreage: '', lat: '', lng: '', notes: '' })
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add zone')
    } finally {
      setSaving(false)
    }
  }

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

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F5F1EB' }} className="min-h-screen">
        <Navbar />
        <div className="p-8 text-center text-gray-500">Loading map...</div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F5F1EB' }} className="min-h-screen">
      <Navbar />
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1C2B1A' }}>{property?.name}</h1>
            <p className="text-sm text-gray-500">{property?.acreage} acres · {property?.state}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddZone(true)}
              style={{ backgroundColor: '#2D5016' }}
              className="text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              + Add Zone
            </button>
            <button
              onClick={() => setShowAddCamera(true)}
              style={{ backgroundColor: '#C4922A' }}
              className="text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              + Add Camera
            </button>
          </div>
        </div>

        <PropertyNav propertyId={id} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3">
            <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100" style={{ height: '520px' }}>
              <MapContainer center={getCenter()} zoom={14} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="© OpenStreetMap contributors"
                />
                {property?.zones?.filter(z => z.lat && z.lng).map(zone => (
                  <Marker key={zone.id} position={[parseFloat(zone.lat), parseFloat(zone.lng)]}>
                    <Popup>
                      <strong>{zone.name}</strong><br />
                      <span style={{ color: ZONE_COLORS[zone.type] }}>● {zone.type.replace(/_/g, ' ')}</span>
                      {zone.acreage && <><br />{zone.acreage} acres</>}
                      {zone.notes && <><br /><em>{zone.notes}</em></>}
                    </Popup>
                  </Marker>
                ))}
                {property?.cameras?.filter(c => c.lat && c.lng).map(cam => (
                  <Marker key={cam.id} position={[parseFloat(cam.lat), parseFloat(cam.lng)]}>
                    <Popup>
                      <strong>📷 {cam.name}</strong><br />
                      {cam.active ? '🟢 Active' : '🔴 Inactive'}<br />
                      {cam.zone?.name && <>Zone: {cam.zone.name}<br /></>}
                      {cam._count?.sightings != null && <>{cam._count.sightings} sightings<br /></>}
                      {cam.notes && <em>{cam.notes}</em>}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-3 flex items-center justify-between" style={{ color: '#1C2B1A' }}>
                Zones
                <span className="text-xs text-gray-400 font-normal">{property?.zones?.length || 0}</span>
              </h3>
              <div className="space-y-2">
                {property?.zones?.map(z => (
                  <div key={z.id} className="flex items-center gap-2 text-sm">
                    <span style={{ color: ZONE_COLORS[z.type] }}>●</span>
                    <span className="font-medium flex-1 truncate">{z.name}</span>
                    <span className="text-gray-400 text-xs flex-shrink-0">{z.acreage ? `${z.acreage}ac` : ''}</span>
                  </div>
                ))}
                {(!property?.zones || property.zones.length === 0) && (
                  <p className="text-xs text-gray-400 italic">No zones yet. Add one to start mapping.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-3 flex items-center justify-between" style={{ color: '#1C2B1A' }}>
                Cameras
                <span className="text-xs text-gray-400 font-normal">{property?.cameras?.length || 0}</span>
              </h3>
              <div className="space-y-2">
                {property?.cameras?.map(c => (
                  <div key={c.id} className="flex items-center gap-2 text-sm">
                    <span>{c.active ? '🟢' : '🔴'}</span>
                    <span className="font-medium flex-1 truncate">{c.name}</span>
                    {c._count?.sightings != null && (
                      <span className="text-gray-400 text-xs">{c._count.sightings}</span>
                    )}
                  </div>
                ))}
                {(!property?.cameras || property.cameras.length === 0) && (
                  <p className="text-xs text-gray-400 italic">No cameras placed yet.</p>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-3 text-sm" style={{ color: '#1C2B1A' }}>Zone Legend</h3>
              <div className="space-y-1.5">
                {ZONE_TYPES.map(type => (
                  <div key={type} className="flex items-center gap-2 text-xs">
                    <span style={{ color: ZONE_COLORS[type] }}>●</span>
                    <span className="text-gray-600">{type.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Zone Modal */}
      <Modal isOpen={showAddZone} onClose={() => setShowAddZone(false)} title="Add Zone">
        <form onSubmit={addZone} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Zone Name</label>
            <input
              required
              value={zoneForm.name}
              onChange={e => setZoneForm({ ...zoneForm, name: e.target.value })}
              placeholder='e.g. "North Food Plot", "Creek Bottom Bedding"'
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={zoneForm.type}
              onChange={e => setZoneForm({ ...zoneForm, type: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {ZONE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Acreage</label>
            <input
              type="number"
              step="0.1"
              value={zoneForm.acreage}
              onChange={e => setZoneForm({ ...zoneForm, acreage: e.target.value })}
              placeholder="5.5"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={zoneForm.lat}
                onChange={e => setZoneForm({ ...zoneForm, lat: e.target.value })}
                placeholder="41.8781"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={zoneForm.lng}
                onChange={e => setZoneForm({ ...zoneForm, lng: e.target.value })}
                placeholder="-87.6298"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={zoneForm.notes}
              onChange={e => setZoneForm({ ...zoneForm, notes: e.target.value })}
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
            {saving ? 'Adding...' : 'Add Zone'}
          </button>
        </form>
      </Modal>

      {/* Add Camera Modal */}
      <Modal isOpen={showAddCamera} onClose={() => setShowAddCamera(false)} title="Add Camera">
        <form onSubmit={addCamera} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Camera Name</label>
            <input
              required
              value={cameraForm.name}
              onChange={e => setCameraForm({ ...cameraForm, name: e.target.value })}
              placeholder='e.g. "Scrape Cam", "Creek Crossing"'
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
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={cameraForm.notes}
              onChange={e => setCameraForm({ ...cameraForm, notes: e.target.value })}
              rows={2}
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
    </div>
  )
}
