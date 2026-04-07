import React, { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  Search,
  UserCircle,
  BookOpen,
  School
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useBranding } from '../context/BrandingContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminLayout() {
  const { branding } = useBranding()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const location = useLocation()
  const { logout, userData, isMaster } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Trainees', path: '/trainees', icon: <Users size={20} />, masterOnly: true },
    { name: 'Marks Manager', path: '/marks', icon: <GraduationCap size={20} /> },
    { name: 'Materials Manager', path: '/materials', icon: <BookOpen size={20} /> },
    { name: 'Admin Manager', path: '/admins', icon: <Users size={20} />, masterOnly: true },
    { name: 'University Setup', path: '/university', icon: <School size={20} />, masterOnly: true },
    { name: 'Site Content', path: '/content', icon: <Settings size={20} />, masterOnly: true },
  ]


  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? '280px' : '0px', opacity: isSidebarOpen ? 1 : 0 }}
        className="fixed lg:relative z-50 h-screen bg-surface border-r border-white/5 flex flex-col overflow-hidden"
      >
        <div className="p-6 h-20 flex items-center gap-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-full bg-primary border border-accent overflow-hidden shrink-0">
            <img src={branding.logoUrl} alt={branding.portalName} className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-display font-bold whitespace-nowrap truncate max-w-[180px]">{branding.portalName}</span>
        </div>

        <nav className="flex-grow p-4 space-y-2 mt-4">
          {navItems.map((item) => (
            (!item.masterOnly || isMaster) && (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${location.pathname === item.path ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col min-h-screen overflow-x-hidden">
        {/* Header */}
        <header className="h-20 glass sticky top-0 z-40 px-6 flex items-center justify-between gap-6">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/70"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex-grow max-w-xl relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input 
              type="text" 
              placeholder="Search data..." 
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/5 rounded-full text-white/70 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-background"></span>
            </button>
            <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none mb-1">{userData?.firstName} {userData?.lastName}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">{isMaster ? 'Master Admin' : 'Faculty Admin'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-accent group-hover:border-accent transition-colors">
                <UserCircle size={24} />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-grow p-6 lg:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="max-w-7xl mx-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        ></div>
      )}
    </div>
  )
}
