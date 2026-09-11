/**
 * AdminRoute — protects all /admin/* routes.
 * Requires: authenticated + role == "admin".
 * The backend also enforces this; this is a UX guard only.
 */
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-purple-400 text-sm tracking-widest uppercase animate-pulse">
          Verifying access…
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
