import React, { Suspense, useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate, useOutlet } from 'react-router-dom'
import {
  LayoutDashboard, Users, GraduationCap, Settings, LogOut, Menu, X, BookOpen, School,
  Globe, ShieldCheck, Sparkles, ExternalLink, Crown,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useToast } from '@shared/ui/feedback'
import Logo from '@shared/ui/Logo'
import { roleLabel } from '../lib/accounts'

const NAV = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Trainees', path: '/trainees', icon: Users },
  { name: 'Marks', path: '/marks', icon: GraduationCap, end: true },
  { name: 'Import marks (AI)', path: '/marks/import', icon: Sparkles },
  { name: 'Materials', path: '/materials', icon: BookOpen },
  { name: 'Admins', path: '/admins', icon: ShieldCheck, superOnly: true },
  { name: 'Faculties & departments', path: '/university', icon: School, superOnly: true },
  { name: 'Navigation', path: '/navigation', icon: Globe, superOnly: true },
  { name: 'Site content', path: '/content', icon: Settings, superOnly: true },
]

const isDesktop = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches

export default function AdminLayout() {
  const [open, setOpen] = useState(isDesktop())
  const location = useLocation()
  const outlet = useOutlet()
  const { logout, userData, isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  // Close the drawer after navigating on phones.
  useEffect(() => { if (!isDesktop()) setOpen(false) }, [location.pathname])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      toast.fail(err, 'Could not sign out.')
    }
  }

  const items = NAV.filter(i => !i.superOnly || isSuperAdmin)

  return (
    <div className="min-h-screen bg-background flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[300] btn-primary">Skip to content</a>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : -300 }}
        transition={{ type: 'spring', damping: 30, stiffness: 260 }}
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-surface border-r border-white/5 flex flex-col ${open ? '' : 'pointer-events-none lg:pointer-events-none'}`}
        aria-label="Admin navigation"
      >
        <div className="px-6 h-20 flex items-center justify-between border-b border-white/5">
          <Logo variant="lockup" className="h-8" label="eNOTA Admin" />
          <button onClick={() => setOpen(false)} className="lg:hidden p-2 rounded-lg text-muted hover:text-ink" aria-label="Close menu"><X size={20} /></button>
        </div>

        <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
          {items.map((item, i) => (
            <motion.div key={item.path} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
              <NavLink
                to={item.path}
                end={item.end}
                className={({ isActive }) => `relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${isActive ? 'text-white' : 'text-muted hover:bg-white/5 hover:text-ink'}`}
              >
                {({ isActive }) => <>
                  {isActive && <motion.span layoutId="navActive" className="absolute inset-0 rounded-xl bg-primary shadow-lg shadow-primary/30" transition={{ type: 'spring', damping: 28, stiffness: 320 }} />}
                  <item.icon size={20} className="relative" aria-hidden="true" />
                  <span className="relative">{item.name}</span>
                </>}
              </NavLink>
            </motion.div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-1">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted hover:bg-white/5 hover:text-ink">
            <ExternalLink size={20} aria-hidden="true" /> <span className="font-medium">View public site</span>
          </a>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-300 hover:bg-red-500/10">
            <LogOut size={20} aria-hidden="true" /> <span className="font-medium">Sign out</span>
          </button>
        </div>
      </motion.aside>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" aria-hidden="true" />
        )}
      </AnimatePresence>

      {/* Main */}
      <div className={`flex-grow flex flex-col min-h-screen min-w-0 transition-[padding] duration-300 ${open ? 'lg:pl-[280px]' : ''}`}>
        <header className="h-16 sm:h-20 glass !border-x-0 !border-t-0 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
          <button onClick={() => setOpen(o => !o)} className="p-2 hover:bg-white/5 rounded-lg text-muted hover:text-ink"
            aria-label={open ? 'Hide menu' : 'Show menu'} aria-expanded={open}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          {!open && <Logo variant="lockup" className="h-7 lg:hidden" label="eNOTA Admin" />}
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-right hidden sm:block min-w-0">
              <p className="text-sm font-semibold truncate">{userData?.firstName} {userData?.lastName}</p>
              <p className="text-xs text-accent flex items-center justify-end gap-1">
                {isSuperAdmin && <Crown size={12} aria-hidden="true" />}{isSuperAdmin ? 'Super Admin' : roleLabel(userData?.role)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/50 border border-accent/30 flex items-center justify-center text-accent font-display font-bold text-sm">
              {(userData?.firstName?.[0] || '') + (userData?.lastName?.[0] || '') || '?'}
            </div>
          </div>
        </header>

        <main id="main" className="flex-grow p-4 sm:p-6 lg:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-7xl mx-auto"
            >
              <Suspense fallback={<div className="space-y-4" aria-busy="true"><div className="skeleton h-10 w-72" /><div className="skeleton h-64 w-full" /></div>}>
                {outlet && React.cloneElement(outlet, { key: location.pathname })}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
