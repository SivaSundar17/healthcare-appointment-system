import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Components
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PatientDashboard from './pages/PatientDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import DoctorDirectory from './pages/DoctorDirectory'
import BookAppointment from './pages/BookAppointment'
import Appointments from './pages/Appointments'
import ProfilePage from './pages/ProfilePage'
import ProfileCompletionPage from './pages/ProfileCompletionPage'
import DoctorAvailabilityPage from './pages/DoctorAvailabilityPage'
import AuthProvider from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/doctors" element={<DoctorDirectory />} />
              
              {/* Protected Routes */}
              <Route path="/patient/dashboard" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              } />
              <Route path="/doctor/dashboard" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/book-appointment/:doctorId" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <BookAppointment />
                </ProtectedRoute>
              } />
              <Route path="/appointments" element={
                <ProtectedRoute>
                  <Appointments />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/complete-profile" element={
                <ProtectedRoute>
                  <ProfileCompletionPage />
                </ProtectedRoute>
              } />
              <Route path="/doctor/availability" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorAvailabilityPage />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          <Toaster position="top-center" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
