import React, { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Search, BookOpen } from 'lucide-react'
import PublicLayout from '../../layouts/PublicLayout'
import ParticleWave from '../../components/ParticleWave'

export default function NotFound() {
  const { pathname } = useLocation()
  useEffect(() => { document.title = 'Page not found — eNOTA Portal' ; return () => { document.title = 'eNOTA Portal — NAD Production' } }, [])

  return (
    <PublicLayout>
      <section className="relative min-h-[70vh] flex items-center justify-center px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-50" aria-hidden="true"><ParticleWave intensity={0.6} /></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" aria-hidden="true" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative text-center max-w-xl">
          <p className="text-8xl sm:text-9xl font-display font-extrabold text-gradient leading-none mb-4">404</p>
          <h1 className="text-3xl font-display font-bold mb-3">This page doesn't exist</h1>
          <p className="text-muted mb-8">We couldn't find <span className="font-mono text-ink break-all">{pathname}</span>. It may have moved, or the link may be mistyped.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="btn-primary px-6 py-3"><Home size={18} /> Home</Link>
            <Link to="/marks" className="btn-outline px-6 py-3"><Search size={18} /> Check marks</Link>
            <Link to="/materials" className="btn-ghost px-6 py-3"><BookOpen size={18} /> Materials</Link>
          </div>
        </motion.div>
      </section>
    </PublicLayout>
  )
}
