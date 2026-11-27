'use client'

import { useEffect } from 'react'

/* Trailing ring + dot on fine pointers. The ring swells over anything clickable. */
export function Cursor() {
  useEffect(() => {
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ring = document.getElementById('ring')
    const dot = document.getElementById('dot')
    if (!ring || !dot) return
    let x = -100, y = -100, cx = x, cy = y, big = false, shown = false
    const onMove = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY
      if (!shown) { shown = true; ring.style.opacity = '1'; dot.style.opacity = '1' }
      const t = e.target as Element | null
      big = !!(t && t.closest && t.closest('a,button,input,[role=button],canvas,[data-hover]'))
      dot.style.transform = `translate(${x - 2.5}px,${y - 2.5}px)`
    }
    const onLeave = () => { shown = false; ring.style.opacity = '0'; dot.style.opacity = '0' }
    let raf = 0
    const loop = () => {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2
      ring.style.transform = `translate(${cx - 19}px,${cy - 19}px) scale(${big ? 1.6 : 1})`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', onMove); document.removeEventListener('pointerleave', onLeave) }
  }, [])
  return null
}
