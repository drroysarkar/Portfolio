'use client'

import { useEffect, useRef } from 'react'

/* Interactive constellation behind the hero: drifting colour blooms plus a field of
   nodes that link up and lean toward the pointer. Colours follow the live theme. */
export function HeroField() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const rm = matchMedia('(prefers-reduced-motion: reduce)').matches
    let W = 0, H = 0, dpr = 1, raf = 0, visible = true
    let mx = -9999, my = -9999
    const css = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()
    let cMark = '#c8ff3d', cViolet = '#9a8bff', cFg = '#f1f0ea', cCyan = '#37d7ff'
    const readTheme = () => { cMark = css('--mark') || cMark; cViolet = css('--violet') || cViolet; cFg = css('--fg') || cFg; cCyan = css('--cyan') || cCyan }
    readTheme()
    const mo = new MutationObserver(readTheme)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })

    type P = { x: number; y: number; vx: number; vy: number; r: number }
    let pts: P[] = []
    const resize = () => {
      const r = c.getBoundingClientRect()
      dpr = Math.min(2, devicePixelRatio || 1)
      W = r.width; H = r.height
      c.width = W * dpr; c.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.round(Math.min(110, (W * H) / 15000))
      pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: 1 + Math.random() * 1.6 }))
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(c)

    const onMove = (e: PointerEvent) => { const r = c.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top }
    const onLeave = () => { mx = my = -9999 }
    addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    const io = new IntersectionObserver(es => { visible = es[0].isIntersecting }); io.observe(c)

    const hex2rgba = (hex: string, a: number) => {
      const h = hex.replace('#', '')
      const v = h.length === 3 ? h.split('').map(x => x + x).join('') : h
      return `rgba(${parseInt(v.slice(0, 2), 16)},${parseInt(v.slice(2, 4), 16)},${parseInt(v.slice(4, 6), 16)},${a})`
    }

    let t = 0
    const frame = () => {
      raf = requestAnimationFrame(frame)
      if (!visible) return
      t += 0.004
      ctx.clearRect(0, 0, W, H)
      /* blooms */
      const blooms: [number, number, number, string, number][] = [
        [W * (.78 + Math.sin(t) * .06), H * (.28 + Math.cos(t * 1.3) * .08), Math.max(W, H) * .5, cMark, .20],
        [W * (.2 + Math.cos(t * .8) * .07), H * (.8 + Math.sin(t) * .06), Math.max(W, H) * .45, cViolet, .22],
        [W * (.55 + Math.sin(t * .6) * .1), H * (.55 + Math.cos(t * .9) * .1), Math.max(W, H) * .32, cCyan, .10],
      ]
      for (const [x, y, r, col, a] of blooms) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r)
        g.addColorStop(0, hex2rgba(col, a)); g.addColorStop(1, hex2rgba(col, 0))
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      }
      /* nodes */
      for (const p of pts) {
        if (!rm) {
          const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy
          if (d2 < 22000) { const f = (1 - d2 / 22000) * .6; p.vx += (dx / Math.sqrt(d2 + 1)) * f * .06; p.vy += (dy / Math.sqrt(d2 + 1)) * f * .06 }
          p.x += p.vx; p.y += p.vy; p.vx *= .985; p.vy *= .985
          p.vx += (Math.random() - .5) * .01; p.vy += (Math.random() - .5) * .01
          if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10
          if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10
        }
      }
      ctx.lineWidth = 1
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i]
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy
          if (d2 < 15000) { ctx.strokeStyle = hex2rgba(cFg, (1 - d2 / 15000) * .13); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke() }
        }
        const dm = Math.hypot(a.x - mx, a.y - my)
        if (dm < 190) { ctx.strokeStyle = hex2rgba(cMark, (1 - dm / 190) * .7); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mx, my); ctx.stroke() }
        ctx.fillStyle = dm < 120 ? cMark : hex2rgba(cFg, .5)
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill()
      }
    }
    frame()
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect(); removeEventListener('pointermove', onMove); document.removeEventListener('pointerleave', onLeave) }
  }, [])

  return <canvas ref={ref} className="hero-fx" aria-hidden="true" />
}
