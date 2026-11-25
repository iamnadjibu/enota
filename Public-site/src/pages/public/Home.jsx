import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useInView, animate } from 'framer-motion'
import {
  ArrowRight, Play, Award, Users, BookOpen, Layers, X, FileCheck2, Search, QrCode, FolderTree, ChevronDown,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import PublicLayout from '../../layouts/PublicLayout'
import ParticleWave from '../../components/ParticleWave'
import Logo from '@shared/ui/Logo'

function CountUp({ value, suffix = '', duration = 1.8 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!inView || value == null) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { setDisplay(value); return }
    const controls = animate(0, value, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: v => setDisplay(Math.round(v)) })
    return () => controls.stop()
  }, [inView, value, duration])
  return <span ref={ref} aria-label={`${value}${suffix}`}>{display.toLocaleString()}{suffix}</span>
}

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
}

const FEATURES = [
  { icon: Search, title: 'Check marks instantly', text: 'Trainees, parents and partners can look up results with a registration number — no account needed.' },
  { icon: FileCheck2, title: 'Official transcripts', text: 'Download a clean PDF transcript covering every faculty a trainee has studied, with a cumulative grade.' },
  { icon: QrCode, title: 'Verifiable anywhere', text: 'Each transcript carries a QR code that links back to the live record, so employers can confirm it in seconds.' },
  { icon: FolderTree, title: 'Materials by department', text: 'Course handouts, videos and exercises organised by faculty and department, only for enrolled trainees.' },
]

export default function Home() {
  const [showDemo, setShowDemo] = useState(false)
  const [stats, setStats] = useState(null)

  useEffect(() => onSnapshot(doc(db, 'stats', 'public'), s => setStats(s.exists() ? s.data() : null), () => {}), [])

  const statItems = stats ? [
    { label: 'Trainees', value: stats.trainees, icon: Users },
    { label: 'Courses', value: stats.courses, icon: BookOpen },
    { label: 'Faculties & departments', value: stats.faculties, icon: Layers },
    { label: 'Pass rate', value: stats.passRate, suffix: '%', icon: Award },
  ].filter(s => typeof s.value === 'number' && s.value > 0) : []

  return (
    <PublicLayout fullBleed>
      {/* ---------- Hero ---------- */}
      <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-16">
        <div className="absolute inset-0" aria-hidden="true">
          <ParticleWave />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(6,17,14,0.35)_55%,#06110E_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl">
          <div aria-hidden="true" className="absolute -inset-x-10 -inset-y-16 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(6,17,14,0.82)_0%,rgba(6,17,14,0.55)_45%,transparent_72%)]" />
          <motion.div initial={{ opacity: 0, scale: 0.6, filter: 'blur(12px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} className="relative mb-8">
            <div className="absolute inset-0 blur-3xl bg-accent/25 rounded-full scale-150" aria-hidden="true" />
            <Logo variant="mark" className="relative h-16 sm:h-20 drop-shadow-[0_0_30px_rgba(147,226,186,0.35)]" label="" />
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/5 px-4 py-1.5 mb-7 text-sm font-medium text-accent">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Empowering the future of media
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-[2.6rem] leading-[1.05] sm:text-6xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight mb-7">
            Elevating <br className="hidden sm:block" />
            <span className="text-gradient">multimedia skills</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
            className="text-lg sm:text-xl text-muted max-w-2xl mb-10 leading-relaxed">
            Check marks, download verified transcripts and reach your course materials — all in one place for NAD Production trainees.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link to="/marks" className="btn-primary px-8 py-4 text-lg w-full sm:w-auto shadow-glow">
              Check marks <ArrowRight size={20} />
            </Link>
            <Link to="/register" className="btn-outline px-8 py-4 text-lg w-full sm:w-auto">Create account</Link>
            <button onClick={() => setShowDemo(true)} className="flex items-center gap-3 text-ink/85 hover:text-ink group py-2">
              <span className="w-12 h-12 rounded-full glass flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Play size={18} className="fill-current ml-0.5" aria-hidden="true" />
              </span>
              Watch overview
            </button>
          </motion.div>
        </div>

        <motion.a href="#stats" aria-label="Scroll down" initial={{ opacity: 0 }} animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ delay: 1.4, y: { repeat: Infinity, duration: 2 } }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-subtle hover:text-accent z-10">
          <ChevronDown size={28} />
        </motion.a>
      </section>

      {/* ---------- Live statistics ---------- */}
      <section id="stats" className="px-6 lg:px-12 -mt-6 relative z-10">
        {statItems.length > 0 && (
          <motion.div {...reveal} className="max-w-6xl mx-auto card grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {statItems.map(({ label, value, suffix, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-2 p-6 sm:p-8 text-center">
                <Icon size={22} className="text-accent" aria-hidden="true" />
                <span className="text-3xl sm:text-4xl font-display font-bold"><CountUp value={value} suffix={suffix} /></span>
                <span className="text-sm text-muted">{label}</span>
              </div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ---------- Features ---------- */}
      <section className="px-6 lg:px-12 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto">
          <motion.div {...reveal} className="max-w-2xl mb-14">
            <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight mb-5">
              Everything a trainee needs, <span className="text-accent">in one portal</span>
            </h2>
            <p className="text-lg text-muted">Built by NAD Production for Filmmaking, Video Production, Photography, Colour Grading, AI Filmmaking and more.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <motion.article key={f.title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.08 }}
                whileHover={{ y: -6 }} className="card p-7 group hover:border-accent/30 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-primary/40 border border-accent/20 flex items-center justify-center text-accent mb-6 group-hover:shadow-glow transition-shadow">
                  <f.icon size={22} aria-hidden="true" />
                </div>
                <h3 className="text-lg font-display font-bold mb-2">{f.title}</h3>
                <p className="text-muted leading-relaxed">{f.text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- How it works + demo ---------- */}
      <section className="px-6 lg:px-12 py-24 bg-surface/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div {...reveal}>
            <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight mb-10">
              Three steps to <span className="text-accent">your results</span>
            </h2>
            <ol className="space-y-8">
              {[
                ['Enter your registration number', 'Open the Marks page and type the number on your enrolment card, e.g. KSP0101998.'],
                ['See every course and grade', 'Results from all your faculties and departments appear together with your cumulative grade.'],
                ['Download your transcript', 'Get an official PDF you can share with parents, employers or partner institutions.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-5">
                  <span className="w-11 h-11 shrink-0 rounded-2xl bg-accent text-background font-display font-bold text-lg flex items-center justify-center">{i + 1}</span>
                  <div>
                    <h3 className="font-display font-bold text-lg mb-1">{t}</h3>
                    <p className="text-muted leading-relaxed">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link to="/marks" className="btn-primary mt-10 px-8 py-4">Check my marks <ArrowRight size={18} /></Link>
          </motion.div>

          <motion.button {...reveal} onClick={() => setShowDemo(true)} aria-label="Play the eNOTA overview video"
            className="relative aspect-video w-full rounded-3xl overflow-hidden border border-white/10 group shadow-2xl text-left">
            <div className="absolute inset-0"><ParticleWave intensity={0.6} /></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/60 via-background/40 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="w-20 h-20 rounded-full bg-accent/20 border border-accent/40 backdrop-blur-xl flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <Play size={34} className="fill-current ml-1.5" aria-hidden="true" />
              </span>
            </div>
            <div className="absolute bottom-5 left-5 right-5 p-5 glass rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-accent text-sm font-semibold">Video walkthrough</p>
                <p className="font-medium">How to use the eNOTA marks portal</p>
              </div>
              <ArrowRight size={20} className="text-muted group-hover:translate-x-1.5 transition-transform" aria-hidden="true" />
            </div>
          </motion.button>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="px-6 lg:px-12 pt-24">
        <motion.div {...reveal} className="max-w-5xl mx-auto card p-10 sm:p-14 text-center relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary-light/25 blur-[90px]" aria-hidden="true" />
          <h2 className="relative text-3xl sm:text-4xl font-display font-bold mb-4">Ready to see your progress?</h2>
          <p className="relative text-muted text-lg mb-8 max-w-xl mx-auto">Create a free trainee account to open your faculty's learning materials.</p>
          <div className="relative flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="btn-primary px-8 py-4">Create account</Link>
            <Link to="/login" className="btn-outline px-8 py-4">I already have one</Link>
          </div>
        </motion.div>
      </section>

      {/* ---------- Video modal ---------- */}
      <AnimatePresence>
        {showDemo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-10"
            onClick={() => setShowDemo(false)} onKeyDown={e => e.key === 'Escape' && setShowDemo(false)} role="dialog" aria-modal="true" aria-label="eNOTA overview video">
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              onClick={e => e.stopPropagation()}>
              <button autoFocus onClick={() => setShowDemo(false)} aria-label="Close video"
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/60 hover:bg-red-500/80 text-white rounded-full flex items-center justify-center">
                <X size={20} />
              </button>
              <iframe title="eNOTA overview video" src="https://drive.google.com/file/d/1HfpuHCE5AouDavfyJ12IgHmD_kK3DgRc/preview"
                className="w-full h-full border-0" allow="autoplay; fullscreen" allowFullScreen />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PublicLayout>
  )
}
