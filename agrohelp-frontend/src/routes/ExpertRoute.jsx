// routes/ExpertRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ExpertRoute({ children }) {
    const { user } = useAuth()
    if (!user) return <Navigate to="/login" replace />
    const role = (user?.designation || '').toLowerCase()
    return (role === 'expert' || role === 'admin') ? children : <Navigate to="/" replace />
}
