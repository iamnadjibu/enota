import React, { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, Instagram, Youtube, Twitter, MessageCircle, Mail, MapPin, UserCircle2, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { doc, onSnapshot } from 'firebase/firestore'
import { useBranding } from '../context/BrandingContext'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebase'
import Logo from '@shared/ui/Logo'

const DEFAULT_NAV = [
  { name: 'Home', path: '/' },
  { name: 'Materials', path: '/materials' },
  { name: 'Marks', path: '/marks' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
]

// Only internal paths or https links from the admin-managed navigation.
const safeLink = l => l?.name && typeof l.path === 'string' && (/^\/[\w\-/]*$/.test(l.path) || /^https:\/\//i.test(l.path))
const titleCase = s => s.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase())

const socialLinks = [
  { icon: Instagram, label: 'Instagram', url: 'https://www.instagram.com/iamnad_/' },
  { icon: Youtube, label: 'YouTube', url: 'https://www.youtube.com/@iamnadofficial' },
  { icon: Twitter, label: 'X (Twitter)', url: 'https://x.com/iamnad250' },
  { icon: MessageCircle, label: 'WhatsApp', url: 'https://wa.me/250786487234' },
  { icon: Mail, label: 'Email', url: 'mailto:inkhub250@gmail.com' },
]

const footerLinks = [
  { name: 'NAD Class', url: 'https://nadclasses.netlify.app/' },
  { name: 'NAD Market', url: 'https://nadmarket.netlify.app/' },
  { name: 'KSP Rwanda', url: 'https://www.ksp.rw/' },
  { name: 'NAD Projects', url: 'https://nadprojects.netlify.app/' },
  { name: 'Book NAD', url: 'https://booknadprod.web.app/' },
  { name: 'Books', url: 'https://nadmarket.netlify.app/' },
]

export default function PublicLayout({ children, fullBleed = false }) {
  const { branding } = useBranding()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [nav, setNav] = useState(DEFAULT_NAV)
  const location = useLocation()
  const { currentUser, userData, logout } = useAuth()

  useEffect(() => onSnapshot(doc(db, 'siteConfig', 'navigation'), snap => {
    const links = (snap.exists() && snap.data().links || []).filter(safeLink)
    if (links.length) {
      const withHome = links.some(l => l.path === '/') ? links : [{ name: 'Home', path: '/' }, ...links]
      setNav(withHome.map(l => ({ ...l, name: titleCase(l.name) })))
    }
  }, () => {}), [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setOpen(false); window.scrollTo(0, 0) }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const firstName = userData?.firstName || currentUser?.displayName?.split(' ')[0] || 'Account'

  const linkClass = ({ isActive }) =>
    `relative text-[15px] font-semibold transition-colors ${isActive ? 'text-accent' : 'text-ink/80 hover:text-ink'}`

  return (
    <div className={`min-h-screen flex flex-col ${fullBleed ? '' : 'pt-16 sm:pt-20'}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[300] btn-primary">Skip to content</a>

      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled || open ? 'bg-background/80 backdrop-blur-xl border-b border-white/10' : 'bg-transparent border-b border-transparent'}`}>
        <nav className="max-w-7xl mx-auto h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 lg:px-12" aria-label="Main">
          <Link to="/" className="flex items-center shrink-0" aria-label={`${branding.portalName || 'eNOTA Portal'} home`}>
            <Logo variant="lockup" className="h-7 sm:h-9 w-auto" />
          </Link>

          <ul className="hidden lg:flex items-center gap-8">
            {nav.map(link => (
              <li key={link.path + link.name}>
                {link.path.startsWith('http') ? (
                  <a href={link.path} target="_blank" rel="noopener noreferrer" className="text-[15px] font-semibold text-ink/80 hover:text-ink">{link.name}</a>
                ) : (
                  <NavLink to={link.path} end={link.path === '/'} className={linkClass}>
                    {({ isActive }) => <>
                      {link.name}
                      {isActive && <motion.span layoutId="navUnderline" className="absolute -bottom-2 left-0 right-0 h-0.5 rounded-full bg-accent" />}
                    </>}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>

          <div className="hidden lg:flex items-center gap-3">
            {currentUser ? (
              <>
                <Link to="/account" className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-accent/50 text-sm font-semibold">
                  <UserCircle2 size={18} className="text-accent" aria-hidden="true" /> {firstName}
                </Link>
                <button onClick={logout} className="btn-ghost text-sm" aria-label="Log out"><LogOut size={16} /></button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-[15px] font-semibold text-ink/80 hover:text-ink px-3">Log in</Link>
                <Link to="/register" className="btn-primary py-2.5 text-sm">Create account</Link>
              </>
            )}
          </div>

          <button onClick={() => setOpen(o => !o)} className="lg:hidden p-2 -mr-2 rounded-xl text-ink" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-menu">
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-0 top-16 sm:top-20 bottom-0 z-40 bg-background/95 backdrop-blur-xl lg:hidden overflow-y-auto"
          >
            <ul className="px-6 py-8 space-y-1">
              {nav.map((link, i) => (
                <motion.li key={link.path + link.name} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.04 * i } }}>
                  {link.path.startsWith('http') ? (
                    <a href={link.path} target="_blank" rel="noopener noreferrer" className="block py-3 text-2xl font-display font-bold">{link.name}</a>
                  ) : (
                    <NavLink to={link.path} end={link.path === '/'} className={({ isActive }) => `block py-3 text-2xl font-display font-bold ${isActive ? 'text-accent' : 'text-ink'}`}>{link.name}</NavLink>
                  )}
                </motion.li>
              ))}
            </ul>
            <div className="px-6 pb-10 pt-4 border-t border-white/10 space-y-3">
              {currentUser ? (
                <>
                  <Link to="/account" className="btn-outline w-full py-3.5"><UserCircle2 size={18} /> My account</Link>
                  <button onClick={logout} className="btn-ghost w-full py-3.5"><LogOut size={18} /> Log out</button>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn-primary w-full py-3.5">Create account</Link>
                  <Link to="/login" className="btn-outline w-full py-3.5">Log in</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="main" className="flex-grow">{children}</main>

      <footer className="bg-surface border-t border-white/5 pt-16 pb-10 px-6 lg:px-12 mt-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-5">
            <Logo variant="lockup" className="h-9" />
            <p className="text-sm text-muted leading-relaxed max-w-xs">{branding.footerText}</p>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-sm font-bold text-accent mb-5">Quick links</h2>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-3">
              {footerLinks.map(link => (
                <li key={link.name}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-accent transition-colors">{link.name}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-bold text-accent mb-5">Follow us</h2>
              <ul className="flex flex-wrap gap-3">
                {socialLinks.map(({ icon: Icon, label, url }) => (
                  <li key={label}>
                    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}
                      className="w-11 h-11 rounded-full glass flex items-center justify-center text-muted hover:text-accent hover:bg-white/10 transition-all">
                      <Icon size={19} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted"><MapPin size={16} className="text-accent" aria-hidden="true" /> Kigali, Rwanda</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-14 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-subtle">
          <p>&copy; {new Date().getFullYear()} {branding.portalName || 'eNOTA Portal'}. All rights reserved.</p>
          <p>Made with <span className="text-accent" aria-label="love">♥</span> by <a href="https://iamnadjibu.com" className="hover:text-accent underline underline-offset-2">NAD Production</a></p>
        </div>
      </footer>
    </div>
  )
}
