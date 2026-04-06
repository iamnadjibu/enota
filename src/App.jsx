import { Routes, Route } from 'react-router-dom'
import Home from './pages/public/Home'
import About from './pages/public/About'
import Contact from './pages/public/Contact'
import Marks from './pages/public/Marks'
import Materials from './pages/public/Materials'
import Register from './pages/public/Register'
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
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/marks" element={<Marks />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/register" element={<AdminRegister />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="admins" element={<AdminManager />} />
          <Route path="marks" element={<MarksManager />} />
          <Route path="content" element={<ContentManager />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
