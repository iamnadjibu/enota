import { Routes, Route } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminLogin from './pages/admin/Login'
import AdminRegister from './pages/admin/Register'
import AdminManager from './pages/admin/AdminManager'
import MarksManager from './pages/admin/MarksManager'
import ContentManager from './pages/admin/ContentManager'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/register" element={<AdminRegister />} />
        <Route path="/" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="admins" element={<AdminManager />} />
          <Route path="marks" element={<MarksManager />} />
          <Route path="content" element={<ContentManager />} />
        </Route>
        <Route path="*" element={<AdminLogin />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
