import React, { useEffect, useRef } from 'react'

/**
 * Real-time particle background: a 3D wave field of dots seen in
 * perspective, with soft out-of-focus "bokeh" particles drifting in front.
 * Rendered on a 2D canvas (no video). Pauses when off-screen or when the tab
 * is hidden, and draws a single still frame for reduced-motion users.
 */
export default function ParticleWave({ className = '', intensity = 1 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: true })
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0, height = 0, dpr = 1
    let raf = 0, running = true, visible = true
    let t = 0
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }

    // Brand palette (logo greens)
    const MINT = [147, 226, 186]
    const GREEN = [23, 129, 93]
    const WHITE = [232, 246, 239]

    let grid = { cols: 0, rows: 0 }
    let bokeh = []

    const setup = () => {
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const small = width < 640
      grid = {
        cols: Math.round((small ? 70 : 130) * intensity),
        rows: Math.round((small ? 34 : 48) * intensity),
      }
      const count = Math.round((small ? 26 : 48) * intensity)
      bokeh = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 2 + Math.random() * (small ? 9 : 14),
        vx: (Math.random() - 0.5) * 0.15,
        vy: -0.05 - Math.random() * 0.18,
        a: 0.05 + Math.random() * 0.16,
        hue: Math.random() < 0.7 ? WHITE : MINT,
        phase: Math.random() * Math.PI * 2,
      }))
    }

    // Wave height at grid position (u, v in 0..1)
    const waveY = (u, v, time) =>
      Math.sin(u * 7.5 + time * 0.9) * 0.55 +
      Math.cos(v * 6.2 - time * 0.7) * 0.45 +
      Math.sin((u + v) * 4.3 + time * 0.5) * 0.35 +
      Math.cos(u * 15 - v * 3 + time * 1.3) * 0.08

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      pointer.x += (pointer.tx - pointer.x) * 0.04
      pointer.y += (pointer.ty - pointer.y) * 0.04

      // ---- particle wave field ----
      const { cols, rows } = grid
      const fov = Math.min(width, height) * 0.9 + 320
      const camY = -1.65 + pointer.y * 0.25
      const horizon = height * 0.5
      const spanX = 16
      const nearZ = 2.2, farZ = 15
      const tilt = 0.18

      for (let j = 0; j < rows; j++) {
        const v = j / (rows - 1)
        const z = farZ - (farZ - nearZ) * v // far rows first
        for (let i = 0; i < cols; i++) {
          const u = i / (cols - 1)
          const x = (u - 0.5) * spanX + pointer.x * 0.6
          const y = waveY(u, v, t) * 0.75
          const depth = z
          const scale = fov / depth
          const sx = width / 2 + x * scale
          const sy = horizon + (y - camY) * scale * 0.42 - z * tilt * 20
          if (sx < -10 || sx > width + 10 || sy < -10 || sy > height + 10) continue

          const near = 1 - (depth - nearZ) / (farZ - nearZ) // 0 far .. 1 near
          const crest = Math.max(0, y) / 1.1
          const size = 0.35 + near * 1.6 + crest * 0.8
          // fade the far edge and the sides for depth
          const edge = Math.sin(u * Math.PI)
          const alpha = Math.min(1, (0.08 + near * 0.55 + crest * 0.35) * edge)
          if (alpha < 0.02) continue
          const c = crest > 0.45 ? WHITE : near > 0.6 ? MINT : GREEN
          ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`
          ctx.beginPath()
          ctx.arc(sx, sy, size, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // ---- bokeh particles (depth-of-field) ----
      for (const b of bokeh) {
        if (!reduced) {
          b.x += b.vx + pointer.x * 0.08
          b.y += b.vy
          if (b.y < -30) { b.y = height + 30; b.x = Math.random() * width }
          if (b.x < -30) b.x = width + 30
          if (b.x > width + 30) b.x = -30
        }
        const flicker = 0.75 + Math.sin(t * 1.4 + b.phase) * 0.25
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
        const [r, gg, bb] = b.hue
        g.addColorStop(0, `rgba(${r},${gg},${bb},${b.a * flicker})`)
        g.addColorStop(0.6, `rgba(${r},${gg},${bb},${b.a * 0.5 * flicker})`)
        g.addColorStop(1, `rgba(${r},${gg},${bb},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const loop = () => {
      if (!running || !visible) return
      t += 0.012
      draw()
      raf = requestAnimationFrame(loop)
    }

    const start = () => {
      cancelAnimationFrame(raf)
      if (reduced) { t = 2; draw(); return }
      raf = requestAnimationFrame(loop)
    }

    setup()
    start()

    const onResize = () => { setup(); if (reduced) draw() }
    const onPointer = e => {
      pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2
      pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2
    }
    const onVisibility = () => { running = !document.hidden; if (running) start() }
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
    })
    io.observe(canvas)

    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onPointer, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [intensity])

  return <canvas ref={canvasRef} aria-hidden="true" className={`block w-full h-full ${className}`} />
}
