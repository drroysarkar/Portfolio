'use client'

/* Circular view-transition wipe used when flipping day/night. */
type VTDoc = Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } }

export function circleWipe(apply: () => void, origin?: { x: number; y: number }) {
  const doc = document as VTDoc
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!doc.startViewTransition || rm || !origin) { apply(); return }
  const r = Math.hypot(Math.max(origin.x, window.innerWidth - origin.x), Math.max(origin.y, window.innerHeight - origin.y))
  const vt = doc.startViewTransition(() => apply())
  vt.ready
    .then(() => {
      doc.documentElement.animate(
        { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${r}px at ${origin.x}px ${origin.y}px)`] },
        { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' }
      )
    })
    .catch(() => {})
}
