import { Routes, Route } from 'react-router-dom'
import Home from './pages/public/Home'
import About from './pages/public/About'
import Contact from './pages/public/Contact'
import Marks from './pages/public/Marks'
import Materials from './pages/public/Materials'
import Register from './pages/public/Register'
import Login from './pages/public/Login'
import Account from './pages/public/Account'
import NotFound from './pages/public/NotFound'
import { AuthProvider } from './context/AuthContext'
import { BrandingProvider } from './context/BrandingContext'
import { ToastProvider } from '@shared/ui/feedback'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrandingProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/marks" element={<Marks />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/account" element={<Account />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrandingProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
