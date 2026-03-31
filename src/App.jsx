import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Home from './pages/Home'
import Leagues from './pages/Leagues'
import Profile from './pages/Profile'
import MyRoutine from './pages/MyRoutine'
import Progress from './pages/Progress'
import BottomNav from './components/BottomNav'
import Loader from './components/Loader'
import { usePWA } from './hooks/usePWA'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user, loading } = useAuth()
  usePWA()

  if (loading) return <Loader />

  return (
    <div className="min-h-screen bg-surface max-w-md mx-auto relative">
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/my-routine" element={<ProtectedRoute><MyRoutine /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
        <Route path="/leagues" element={<ProtectedRoute><Leagues /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {user && <BottomNav />}
    </div>
  )
}
