import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export function PageHeader({ title, accent, subtitle, children }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-display font-bold">{title} {accent && <span className="text-accent">{accent}</span>}</h1>
        {subtitle && <p className="text-muted mt-1">{subtitle}</p>}
      </motion.div>
      {children && <div className="flex flex-wrap gap-3">{children}</div>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="card p-14 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-accent/80 mx-auto mb-5">
          <Icon size={28} />
        </div>
      )}
      <p className="text-lg font-display font-semibold mb-1">{title}</p>
      {text && <p className="text-muted max-w-md mx-auto">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  )
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="card p-5 space-y-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4" style={{ opacity: 1 - i * 0.12 }}>
          <div className="skeleton w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-1/3" />
            <div className="skeleton h-3 w-1/4" />
          </div>
          <div className="skeleton h-8 w-24" />
        </div>
      ))}
    </div>
  )
}

export function usePagination(items, pageSize = 20) {
  const [page, setPage] = React.useState(1)
  const pages = Math.max(1, Math.ceil(items.length / pageSize))
  React.useEffect(() => { if (page > pages) setPage(1) }, [pages]) // eslint-disable-line react-hooks/exhaustive-deps
  const slice = items.slice((page - 1) * pageSize, page * pageSize)
  return { page, pages, setPage, slice, total: items.length, from: items.length ? (page - 1) * pageSize + 1 : 0, to: Math.min(page * pageSize, items.length) }
}

export function Pagination({ page, pages, setPage, from, to, total, label = 'records' }) {
  if (total === 0) return null
  return (
    <nav aria-label="Pagination" className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 pt-4 text-sm text-muted">
      <p>Showing <span className="text-ink font-semibold">{from}–{to}</span> of <span className="text-ink font-semibold">{total}</span> {label}</p>
      <div className="flex items-center gap-2">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page"
          className="p-2 rounded-xl border border-white/10 hover:bg-white/5 disabled:opacity-30"><ChevronLeft size={18} /></button>
        <span className="px-3">Page {page} of {pages}</span>
        <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} aria-label="Next page"
          className="p-2 rounded-xl border border-white/10 hover:bg-white/5 disabled:opacity-30"><ChevronRight size={18} /></button>
      </div>
    </nav>
  )
}

/** Staggered fade-up for lists and grids. */
export const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.05 } } },
  item: { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 22, stiffness: 200 } } },
}

export function Modal({ open, onClose, title, subtitle, wide, children }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6" onKeyDown={e => e.key === 'Escape' && onClose()}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div role="dialog" aria-modal="true" aria-label={title}
            initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className={`relative w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} card !bg-surface p-6 sm:p-10 shadow-2xl overflow-y-auto max-h-[92vh] rounded-b-none sm:rounded-3xl`}>
            <div className="flex items-start justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-display font-bold">{title}</h2>
                {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
              </div>
              <button onClick={onClose} aria-label="Close" className="p-2 rounded-full text-muted hover:text-ink hover:bg-white/5"><X size={22} /></button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
