import { Routes, Route } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminLogin from './pages/admin/Login'
import AdminRegister from './pages/admin/Register'
import AdminManager from './pages/admin/AdminManager'
import MarksManager from './pages/admin/MarksManager'
import ContentManager from './pages/admin/ContentManager'
import { AuthProvider } from './context/AuthContext'
import { BrandingProvider } from './context/BrandingContext'
import ProtectedRoute from './components/ProtectedRoute'
import TraineeManager from './pages/admin/TraineeManager'
import MaterialsManager from './pages/admin/MaterialsManager'
import UniversityManager from './pages/admin/UniversityManager'

function App() {
  return (
    <AuthProvider>
      <BrandingProvider>
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
            <Route path="trainees" element={<TraineeManager />} />
            <Route path="admins" element={<AdminManager />} />
            <Route path="marks" element={<MarksManager />} />
            <Route path="materials" element={<MaterialsManager />} />
            <Route path="university" element={<UniversityManager />} />
            <Route path="content" element={<ContentManager />} />
          </Route>

          <Route path="*" element={<AdminLogin />} />
        </Routes>
      </BrandingProvider>
    </AuthProvider>
  )
}

export default App
