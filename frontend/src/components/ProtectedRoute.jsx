import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-blue-400 text-sm tracking-widest uppercase animate-pulse">
          Authenticating…
        </div>
      </div>
    )
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
