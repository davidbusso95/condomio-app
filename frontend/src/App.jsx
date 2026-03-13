import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import OwnerPayments from './pages/OwnerPayments'
import './App.css'

function ProtectedRoute({ children, requiredRole }) {
  const { user, token, loading } = useAuth()

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  if (!token) {
    return <Navigate to="/" />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/pagos'} />
  }

  return children
}

function AppRoutes() {
  const { user, token, loading } = useAuth()

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  if (token && user) {
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin" />
    }
    return <Navigate to="/pagos" />
  }

  return <Login />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AppRoutes />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pagos" 
            element={
              <ProtectedRoute>
                <OwnerPayments />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
