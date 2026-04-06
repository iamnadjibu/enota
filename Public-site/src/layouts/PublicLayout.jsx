import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Instagram, Youtube, Twitter, MessageCircle, Mail, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PublicLayout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  const navLinks = [
    { name: 'MATERIALS', path: '/materials' },
    { name: 'MARKS', path: '/marks' },
    { name: 'ABOUT US', path: '/about' },
    { name: 'CONTACT US', path: '/contact' },
  ]

  const socialLinks = [
    { icon: <Instagram size={20} />, url: 'https://www.instagram.com/iamnad_/' },
    { icon: <Youtube size={20} />, url: 'https://www.youtube.com/@iamnadofficial' },
    { icon: <Twitter size={20} />, url: 'https://x.com/iamnad250' },
    { icon: <MessageCircle size={20} />, url: 'https://wa.me/250786487234' },
    { icon: <Mail size={20} />, url: 'mailto:inkhub250@gmail.com' },
  ]

  const footerLinks = [
    { name: 'NAD CLASS', url: 'https://nadclasses.netlify.app/' },
    { name: 'NAD MARKET', url: 'https://nadmarket.netlify.app/' },
    { name: 'KSP RWANDA', url: 'https://www.ksp.rw/' },
    { name: 'NAD PROJECTS', url: 'https://nadprojects.netlify.app/' },
    { name: 'BOOK NAD', url: 'https://booknadprod.web.app/' },
    { name: 'BOOKS', url: 'https://nadmarket.netlify.app/' },
  ]

  return (
    <div className="min-h-screen flex flex-col pt-20">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass h-20 flex items-center px-6 lg:px-12 justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-full border-2 border-accent overflow-hidden shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform bg-primary">
            <img src="/apple-touch-icon.png" alt="eNOTA Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-2xl font-display font-bold tracking-tighter text-white">eNOTA <span className="text-secondary">PORTAL</span></span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-sm font-medium hover:text-accent transition-colors ${location.pathname === link.path ? 'text-accent border-b-2 border-accent pb-1' : 'text-white/80'}`}
            >
              {link.name}
            </Link>
          ))}
          <Link to="/register" className="btn-primary py-2 text-sm">JOIN SYSTEM</Link>
        </div>

        {/* Mobile menu toggle */}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden text-white/80 hover:text-white transition-colors">
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
            className="fixed inset-0 z-40 bg-background flex flex-col items-center justify-center gap-8 lg:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className="text-3xl font-display font-bold hover:text-accent transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <Link to="/register" onClick={() => setIsMenuOpen(false)} className="btn-primary mt-4">JOIN SYSTEM</Link>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow">{children}</main>

      {/* Footer */}
      <footer className="bg-surface border-t border-white/5 py-16 px-6 lg:px-12 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border border-accent overflow-hidden bg-primary">
                <img src="/apple-touch-icon.png" alt="eNOTA Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-display font-bold tracking-tighter text-white">eNOTA <span className="text-accent">PORTAL</span></span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs">
              Designed by NAD PRODUCTION to facilitate Trainees in Filmmaking, Video Production, COLOR GRADING, AI FILMMAKING, VIBE CODING, and Others. Primarily from NAD CLASS and KSP RWANDA.
            </p>
          </div>

          {/* Quick Links Group */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-2">
            <div>
              <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest text-accent">Quick Links</h4>
              <ul className="space-y-4">
                {footerLinks.slice(0, 3).map((link) => (
                  <li key={link.name}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-white/60 hover:text-accent transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest text-accent opacity-0 invisible md:visible">_</h4>
              <ul className="space-y-4">
                {footerLinks.slice(3).map((link) => (
                  <li key={link.name}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-white/60 hover:text-accent transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Socials & Contact */}
          <div className="space-y-8">
            <div>
              <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest text-accent">Socials</h4>
              <div className="flex flex-wrap gap-4">
                {socialLinks.map((link, idx) => (
                  <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/60 hover:text-accent transition-all hover:bg-white/10">
                    {link.icon}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/60">
              <MapPin size={16} className="text-accent" />
              <span>Kigali, Rwanda</span>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} eNOTA Portal. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <span className="text-accent text-lg">♥</span> by <a href="https://iamnadjibu.com" className="hover:text-accent underline">NAD PRODUCTION</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
