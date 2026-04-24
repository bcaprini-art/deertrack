import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../lib/api'
import Navbar from '../components/Navbar'
import PropertyNav from '../components/PropertyNav'
import { Modal } from '../components/Modal'

const IMPROVEMENT_COLORS = {
  FOOD_PLOT_PLANT: '#2D5016',
  FOOD_PLOT_MAINTAIN: '#4a7c2a',
  WATER_SOURCE: '#1E90FF',
  TIMBER_WORK: '#8B4513',
  BRUSH_CLEARING: '#6B7280',
  BEDDING_CREATE: '#A0522D',
  TRAIL_WORK: '#D2691E',
  FERTILIZE: '#228B22',
  LIME: '#C8860A',
  HERBICIDE: '#DC143C',
  OTHER: '#9370DB',
}

const IMPROVEMENT_TYPES = [
  'FOOD_PLOT_PLANT', 'FOOD_PLOT_MAINTAIN', 'WATER_SOURCE', 'TIMBER_WORK',
  'BRUSH_CLEARING', 'BEDDING_CREATE', 'TRAIL_WORK', 'FERTILIZE', 'LIME', 'HERBICIDE', 'OTHER',
]

export default function Land() {
  const { id } = useParams()
  const [tab, setTab] = useState('improvements')
  const [improvements, setImprovements] = useState([])
  const [soilTests, setSoilTests] = useState([])
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [showAddImp, setShowAddImp] = useState(false)
  const [showAddSoil, setShowAddSoil] = useState(false)
  const [saving, setSaving] = useState(false)

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

  const [soilForm, setSoilForm] = useState({
    zoneId: '',
    date: new Date().toISOString().slice(0, 10),
    ph: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    notes: '',
  })

  const load = async () => {
    try {
      const [impRes, soilRes, zoneRes] = await Promise.all([
        api.get(`/properties/${id}/improvements`),
        api.get(`/properties/${id}/soil-tests`),
        api.get(`/properties/${id}/zones`),
      ])
      setImprovements(impRes.data)
      setSoilTests(soilRes.data)
      setZones(zoneRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const addImprovement = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/properties/${id}/improvements`, impForm)
      setShowAddImp(false)
      setImpForm({ type: 'FOOD_PLOT_PLANT', description: '', date: new Date().toISOString().slice(0, 10), zoneId: '', acreage: '', species: '', cost: '', notes: '' })
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add improvement')
    } finally {
      setSaving(false)
    }
  }

  const addSoilTest = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/properties/${id}/soil-tests`, soilForm)
      setShowAddSoil(false)
      setSoilForm({ zoneId: '', date: new Date().toISOString().slice(0, 10), ph: '', nitrogen: '', phosphorus: '', potassium: '', notes: '' })
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add soil test')
    } finally {
      setSaving(false)
    }
  }

  const filteredImp = filter ? improvements.filter(i => i.type === filter) : improvements

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F5F1EB' }} className="min-h-screen">
        <Navbar />
        <div className="p-8 text-center text-gray-500">Loading land data...</div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F5F1EB' }} className="min-h-screen">
      <Navbar />
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold" style={{ color: '#1C2B1A' }}>Land Management</h1>
          <button
            onClick={() => tab === 'improvements' ? setShowAddImp(true) : setShowAddSoil(true)}
            style={{ backgroundColor: '#C4922A' }}
            className="text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add {tab === 'improvements' ? 'Improvement' : 'Soil Test'}
          </button>
        </div>
        <PropertyNav propertyId={id} />

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'improvements', label: '🌱 Improvements', count: improvements.length },
            { key: 'soilTests', label: '🧪 Soil Tests', count: soilTests.length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                tab === t.key ? 'text-white' : 'text-gray-500 bg-white hover:bg-gray-50'
              }`}
              style={tab === t.key ? { backgroundColor: '#2D5016' } : {}}
            >
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-green-800 text-green-100' : 'bg-gray-100 text-gray-500'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Improvements tab */}
        {tab === 'improvements' && (
          <div>
            <div className="mb-4 flex gap-3 items-center">
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="">All Types</option>
                {IMPROVEMENT_TYPES.map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
              {filter && (
                <button onClick={() => setFilter('')} className="text-sm text-gray-500 hover:text-gray-700">
                  Clear filter ×
                </button>
              )}
              <span className="text-sm text-gray-400">{filteredImp.length} records</span>
            </div>

            <div className="space-y-3">
              {filteredImp.map(imp => (
                <div key={imp.id} className="bg-white rounded-xl p-4 shadow-sm flex gap-4">
                  <div
                    className="flex-shrink-0 w-1.5 rounded-full"
                    style={{ backgroundColor: IMPROVEMENT_COLORS[imp.type] || '#6B7280', minHeight: '60px' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full text-white mr-2 inline-block mb-1"
                          style={{ backgroundColor: IMPROVEMENT_COLORS[imp.type] || '#6B7280' }}
                        >
                          {imp.type.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium" style={{ color: '#1C2B1A' }}>{imp.description}</span>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(imp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      {imp.zone && <span>📍 {imp.zone.name}</span>}
                      {imp.acreage && <span>📐 {imp.acreage} ac</span>}
                      {imp.species && <span>🌱 {imp.species}</span>}
                      {imp.cost && <span>💰 ${parseFloat(imp.cost).toFixed(2)}</span>}
                    </div>
                    {imp.notes && <p className="text-xs text-gray-400 mt-1 italic">{imp.notes}</p>}
                  </div>
                </div>
              ))}
              {filteredImp.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <div className="text-5xl mb-3">🌱</div>
                  <p className="font-medium mb-1">No improvements logged yet</p>
                  <p className="text-sm">Track food plots, timber work, water sources, and more.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Soil Tests tab */}
        {tab === 'soilTests' && (
          <div>
            {soilTests.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#1C2B1A' }} className="text-white">
                      <th className="text-left px-4 py-3 font-medium">Date</th>
                      <th className="text-left px-4 py-3 font-medium">Zone</th>
                      <th className="text-center px-4 py-3 font-medium">pH</th>
                      <th className="text-center px-4 py-3 font-medium">N</th>
                      <th className="text-center px-4 py-3 font-medium">P</th>
                      <th className="text-center px-4 py-3 font-medium">K</th>
                      <th className="text-left px-4 py-3 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soilTests.map((test, i) => (
                      <tr key={test.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-gray-700">
                          {new Date(test.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{test.zone?.name || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          {test.ph != null ? (
                            <span
                              className="font-semibold"
                              style={{ color: test.ph >= 6 && test.ph <= 7 ? '#2D5016' : test.ph < 5.5 || test.ph > 7.5 ? '#DC143C' : '#C4922A' }}
                            >
                              {test.ph}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{test.nitrogen ?? '—'}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{test.phosphorus ?? '—'}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{test.potassium ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-400 italic text-xs">{test.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <div className="text-5xl mb-3">🧪</div>
                <p className="font-medium mb-1">No soil tests recorded yet</p>
                <p className="text-sm">Track soil pH, N/P/K levels by zone to optimize food plots.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Improvement Modal */}
      <Modal isOpen={showAddImp} onClose={() => setShowAddImp(false)} title="Add Land Improvement">
        <form onSubmit={addImprovement} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={impForm.type}
              onChange={e => setImpForm({ ...impForm, type: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {IMPROVEMENT_TYPES.map(t => (
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
              placeholder="Brief description of the work done"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Acreage</label>
              <input
                type="number"
                step="0.1"
                value={impForm.acreage}
                onChange={e => setImpForm({ ...impForm, acreage: e.target.value })}
                placeholder="3.5"
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
                placeholder="250.00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Species / Product</label>
            <input
              value={impForm.species}
              onChange={e => setImpForm({ ...impForm, species: e.target.value })}
              placeholder="e.g. Brassica blend, BioLogic, White oak"
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
            disabled={saving}
            style={{ backgroundColor: '#2D5016' }}
            className="w-full text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add Improvement'}
          </button>
        </form>
      </Modal>

      {/* Add Soil Test Modal */}
      <Modal isOpen={showAddSoil} onClose={() => setShowAddSoil(false)} title="Add Soil Test">
        <form onSubmit={addSoilTest} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Test Date</label>
              <input
                type="date"
                required
                value={soilForm.date}
                onChange={e => setSoilForm({ ...soilForm, date: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Zone</label>
              <select
                value={soilForm.zoneId}
                onChange={e => setSoilForm({ ...soilForm, zoneId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">-- No Zone --</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">pH</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="14"
              value={soilForm.ph}
              onChange={e => setSoilForm({ ...soilForm, ph: e.target.value })}
              placeholder="6.5"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Ideal for deer forage: 6.0–7.0</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nitrogen (N)</label>
              <input
                type="number"
                step="any"
                value={soilForm.nitrogen}
                onChange={e => setSoilForm({ ...soilForm, nitrogen: e.target.value })}
                placeholder="ppm"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phosphorus (P)</label>
              <input
                type="number"
                step="any"
                value={soilForm.phosphorus}
                onChange={e => setSoilForm({ ...soilForm, phosphorus: e.target.value })}
                placeholder="ppm"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Potassium (K)</label>
              <input
                type="number"
                step="any"
                value={soilForm.potassium}
                onChange={e => setSoilForm({ ...soilForm, potassium: e.target.value })}
                placeholder="ppm"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes / Recommendations</label>
            <textarea
              value={soilForm.notes}
              onChange={e => setSoilForm({ ...soilForm, notes: e.target.value })}
              rows={2}
              placeholder="Lab recommendations, amendments applied, etc."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{ backgroundColor: '#2D5016' }}
            className="w-full text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add Soil Test'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
