import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
import AdminLogin from './pages/admin/Login'
import AdminRegister from './pages/admin/Register'
const AdminManager = lazy(() => import('./pages/admin/AdminManager'))
const MarksManager = lazy(() => import('./pages/admin/MarksManager'))
const MarksImport = lazy(() => import('./pages/admin/MarksImport'))
const ContentManager = lazy(() => import('./pages/admin/ContentManager'))
const TraineeManager = lazy(() => import('./pages/admin/TraineeManager'))
const MaterialsManager = lazy(() => import('./pages/admin/MaterialsManager'))
const UniversityManager = lazy(() => import('./pages/admin/UniversityManager'))
const NavigationManager = lazy(() => import('./pages/admin/NavigationManager'))
import { AuthProvider } from './context/AuthContext'
import { BrandingProvider } from './context/BrandingContext'
import ProtectedRoute from './components/ProtectedRoute'
import { ToastProvider, ConfirmProvider } from '@shared/ui/feedback'

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <BrandingProvider>
            <Routes>
              <Route path="/login" element={<AdminLogin />} />
              <Route path="/register" element={<AdminRegister />} />
              <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="trainees" element={<TraineeManager />} />
                <Route path="admins" element={<AdminManager />} />
                <Route path="marks" element={<MarksManager />} />
                <Route path="marks/import" element={<MarksImport />} />
                <Route path="materials" element={<MaterialsManager />} />
                <Route path="university" element={<UniversityManager />} />
                <Route path="navigation" element={<NavigationManager />} />
                <Route path="content" element={<ContentManager />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </BrandingProvider>
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  )
}

export default App
