import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ExamProvider } from './context/ExamContext'
import Login from './pages/Login'
import Dashboard from './pages/siswa/Dashboard'
import Exam from './pages/siswa/Exam'
import Result from './pages/siswa/Result'
import Questions from './pages/admin/Questions'
import Reports from './pages/admin/Reports'

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, profile, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (requiredRole && profile?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on role
    return profile?.role === 'admin' 
      ? <Navigate to="/admin/questions" replace />
      : <Navigate to="/siswa/dashboard" replace />
  }
  
  return children
}

// Role-based routing component
const RoleBasedRoute = ({ path, element, requiredRole }) => {
  return (
    <Route 
      path={path} 
      element={
        <ProtectedRoute requiredRole={requiredRole}>
          {element}
        </ProtectedRoute>
      } 
    />
  )
}

function App() {
  return (
    <AuthProvider>
      <ExamProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Student routes */}
            <Route path="/siswa/*" element={
              <ProtectedRoute>
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="exam" element={<Exam />} />
                  <Route path="result" element={<Result />} />
                  <Route path="*" element={<Navigate to="/siswa/dashboard" replace />} />
                </Routes>
              </ProtectedRoute>
            } />
            
            {/* Admin routes */}
            <Route path="/admin/*" element={
              <ProtectedRoute requiredRole="admin">
                <Routes>
                  <Route path="questions" element={<Questions />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="*" element={<Navigate to="/admin/questions" replace />} />
                </Routes>
              </ProtectedRoute>
            } />
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </ExamProvider>
    </AuthProvider>
  )
}

export default App
