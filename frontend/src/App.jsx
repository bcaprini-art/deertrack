import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isLoggedIn } from './lib/auth'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import PropertyMap from './pages/PropertyMap'
import Herd from './pages/Herd'
import Cameras from './pages/Cameras'
import Land from './pages/Land'
import Harvests from './pages/Harvests'
import Reports from './pages/Reports'

function ProtectedRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/property/:id/map" element={<ProtectedRoute><PropertyMap /></ProtectedRoute>} />
        <Route path="/property/:id/herd" element={<ProtectedRoute><Herd /></ProtectedRoute>} />
        <Route path="/property/:id/cameras" element={<ProtectedRoute><Cameras /></ProtectedRoute>} />
        <Route path="/property/:id/land" element={<ProtectedRoute><Land /></ProtectedRoute>} />
        <Route path="/property/:id/harvests" element={<ProtectedRoute><Harvests /></ProtectedRoute>} />
        <Route path="/property/:id/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
