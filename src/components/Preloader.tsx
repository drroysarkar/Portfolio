'use client'

import { useEffect, useState } from 'react'
import { useUI } from '@/lib/store'

/* Quiet, fast intro: the name rises, a thin line fills, the curtain lifts.
   Runs off a module-level interval so it always completes, even when rAF is throttled. */
const DUR = 2200

type Boot = { n: number; done: boolean }
let boot: Boot = { n: 0, done: false }
let timer: ReturnType<typeof setInterval> | null = null
let fired = false
const subs = new Set<(b: Boot) => void>()

function start() {
  if (timer) return
  const t0 = performance.now()
  timer = setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / DUR)
    const n = Math.round((1 - Math.pow(1 - k, 2.4)) * 100)
    if (n !== boot.n) { boot = { ...boot, n }; subs.forEach(f => f(boot)) }
    if (k >= 1 && timer) {
      clearInterval(timer); timer = null
      setTimeout(() => {
        boot = { ...boot, done: true }; subs.forEach(f => f(boot))
        if (!fired) { fired = true; document.body.style.overflow = ''; useUI.getState().setReady(true) }
      }, 260)
    }
  }, 34)
}

export function Preloader() {
  const [b, setB] = useState(boot)
  const [gone, setGone] = useState(boot.done && fired)

  useEffect(() => {
    start()
    const f = (nb: Boot) => setB({ ...nb })
    subs.add(f)
    return () => { subs.delete(f) }
  }, [])

  useEffect(() => {
    if (b.done) { document.body.style.overflow = ''; const t = setTimeout(() => setGone(true), 1100); return () => clearTimeout(t) }
    if (!fired) document.body.style.overflow = 'hidden'
  }, [b.done])

  if (gone) return null
  return (
    <div id="loader" className={b.done ? 'done' : ''} aria-hidden={b.done} role="status">
      <div className="ld-inner">
        <div className="ld-top mono"><span>Portfolio · 2026</span><span>Lucknow, IN</span></div>
        <div className="ld-name" aria-label="Divyanshu Kumar">
          <span><b>Divyanshu</b></span>
          <span><b>Kumar</b></span>
        </div>
        <div className="ld-bar"><i style={{ width: b.n + '%' }} /></div>
        <div className="ld-foot mono"><span>Loading the atlas, the museum and 20 projects</span><span className="ld-num">{b.n}</span></div>
      </div>
    </div>
  )
}
