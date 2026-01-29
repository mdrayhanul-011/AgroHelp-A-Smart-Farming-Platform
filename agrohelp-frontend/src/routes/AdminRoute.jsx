import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { user, token } = useAuth()
  const loc = useLocation()

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  }
  if (user.designation !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }
  return children
}
