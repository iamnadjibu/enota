import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Play, Award, Users, BookOpen, Film, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import PublicLayout from '../../layouts/PublicLayout'
import { useBranding } from '../../context/BrandingContext'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

export default function Home() {
  const { branding } = useBranding()
  const [showDemoModal, setShowDemoModal] = useState(false)

  const stats = [
    { label: 'Trainees', value: '500+', icon: <Users size={20} className="text-secondary" /> },
    { label: 'Courses', value: '12+', icon: <Film size={20} className="text-secondary" /> },
    { label: 'Success Rate', value: '98%', icon: <Award size={20} className="text-secondary" /> },
    { label: 'Partners', value: '5+', icon: <BookOpen size={20} className="text-secondary" /> },
  ]

  return (
    <PublicLayout>
      <div className="relative">
        {/* Cinematic Backdrop Overlay */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[150px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 blur-[180px] rounded-full"></div>
        </div>

        {/* Hero Section */}
        <section className="px-6 lg:px-12 py-20 lg:py-32 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 text-[10px] sm:text-xs font-medium tracking-widest text-accent uppercase"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            Empowering the Future of Media
          </motion.div>

          <motion.h1 
            {...fadeInUp}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight leading-tight mb-8"
          >
            Elevating <br />
            <span className="text-gradient">Multimedia Skills</span>
          </motion.h1>

          <motion.p 
            {...fadeInUp}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-white/60 max-w-2xl mb-12 leading-relaxed"
          >
            Optimize your education journey with {branding.portalName}. Track your progress, access materials, and achieve excellence.
          </motion.p>

          <motion.div 
            {...fadeInUp}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto"
          >
            <Link to="/marks" className="btn-primary flex items-center justify-center gap-2 px-8 py-4 text-lg w-full sm:w-auto">
              Get Started <ArrowRight size={20} />
            </Link>
            <button 
              onClick={() => setShowDemoModal(true)}
              className="flex items-center gap-3 text-white/80 hover:text-white transition-colors group"
            >
              <span className="w-12 h-12 rounded-full glass flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Play size={20} className="fill-white" />
              </span>
              Watch Overview
            </button>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-16 mt-20 lg:mt-32 w-full max-w-5xl">
            {stats.map((stat, idx) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl glass flex items-center justify-center mb-1">
                  {stat.icon}
                </div>
                <span className="text-2xl sm:text-3xl font-display font-bold">{stat.value}</span>
                <span className="text-white/40 text-[10px] uppercase tracking-widest">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="px-6 lg:px-12 py-24 bg-surface/30">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-3xl md:text-5xl font-display font-bold leading-tight mb-8"
                >
                  Seamless Progress <br />
                  <span className="text-accent">Tracking for Trainees</span>
                </motion.h2>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 text-accent">
                      <Award size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">Real-time Performance</h4>
                      <p className="text-white/60 leading-relaxed text-sm">Access your course marks and overall grade instantly. Track which areas you excel in and where to improve.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 text-accent">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">Resource Management</h4>
                      <p className="text-white/60 leading-relaxed text-sm">Centralized hub for all filmmaking and media learning materials, curated for your specific faculty.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Graphic Placeholder */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                onClick={() => setShowDemoModal(true)}
                className="relative aspect-video rounded-3xl overflow-hidden glass border-2 border-white/5 group shadow-2xl cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-accent/20 border border-accent/40 backdrop-blur-xl flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                    <Play size={40} className="fill-accent ml-2" />
                  </div>
                </div>
                <div className="absolute bottom-6 left-6 right-6 p-6 glass rounded-2xl border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-accent text-[10px] uppercase tracking-widest font-bold mb-1">Live Demo</p>
                    <p className="text-sm font-medium">How to use eNOTA Marks Portal</p>
                  </div>
                  <ArrowRight size={20} className="text-white/60 group-hover:translate-x-2 transition-transform" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {showDemoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-10"
            onClick={() => setShowDemoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 glass"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowDemoModal(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-red-500/80 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
              >
                <X size={20} />
              </button>
              <iframe 
                src="https://drive.google.com/file/d/1HfpuHCE5AouDavfyJ12IgHmD_kK3DgRc/preview" 
                className="w-full h-full border-0"
                allow="autoplay"
                allowFullScreen
              ></iframe>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PublicLayout>
  )
}

