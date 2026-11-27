'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CATS, PROJECTS, techById, projById, type Project } from '@/lib/data'
import { CAT_COLOR, HALL_NO } from '@/lib/colors'
import { useUI } from '@/lib/store'
import { Art } from '@/components/Art'

/* ============================================================
   THE MUSEUM — a walk-through gallery built in pure CSS 3D.
   Walk (wheel / drag / W S / arrows), look (move the mouse),
   click a frame for the catalogue dossier. A plan view is the
   accessible, touch-friendly alternative.
   ============================================================ */

const GAP = 400          // distance between frames along the corridor
const HALL_PAD = 360     // extra run-up for each hall's archway
const START = 260

type Item = { kind: 'frame'; p: Project; z: number; side: -1 | 1; n: number } | { kind: 'arch'; cat: string; z: number; count: number }

function layout(list: Project[]) {
  const items: Item[] = []
  let z = START, k = 0
  for (const cat of CATS) {
    const g = list.filter(p => p.c === cat)
    if (!g.length) continue
    z += HALL_PAD
    items.push({ kind: 'arch', cat, z, count: g.length })
    z += 160
    g.forEach(p => {
      items.push({ kind: 'frame', p, z, side: k % 2 ? 1 : -1, n: PROJECTS.indexOf(p) + 1 })
      if (k % 2) z += GAP
      else z += GAP * 0.5
      k++
    })
    if (k % 2) { z += GAP * 0.5; k++ }
  }
  return { items, length: z + 700 }
}

function Frame({ it, on, onOpen }: { it: Extract<Item, { kind: 'frame' }>; on: boolean; onOpen: () => void }) {
  const p = it.p, tone = CAT_COLOR[p.c]
  return (
    <div className={'mx-piece ' + (it.side < 0 ? 'l' : 'r') + (on ? ' on' : '')} style={{ '--z': -it.z + 'px', '--tone': tone } as React.CSSProperties}>
      <div className="mx-cone" aria-hidden="true" />
      <button type="button" className="mx-frame" onClick={onOpen} aria-label={`Open exhibit ${p.t}`}>
        <span className="mx-matte"><Art id={p.id} cat={p.c} /></span>
      </button>
      <div className="mx-label">
        <span className="no">№ {String(it.n).padStart(2, '0')}</span>
        <b>{p.t}</b>
        <i>{p.tech.slice(0, 3).map(t => techById.get(t)?.name).join(', ')}</i>
      </div>
    </div>
  )
}

function Dossier({ p, onClose, onNav }: { p: Project; onClose: () => void; onNav: (id: string) => void }) {
  const tone = CAT_COLOR[p.c] ?? '#ffb36b'
  const ui = useUI.getState
  return (
    <aside className="mx-dossier" role="dialog" aria-label={`Exhibit dossier: ${p.t}`} style={{ '--tone': tone } as React.CSSProperties}>
      <div className="mx-dos-art"><Art id={p.id} cat={p.c} /></div>
      <div className="mx-dos-body">
        <button className="mx-x" type="button" onClick={onClose} aria-label="Close dossier">✕</button>
        <p className="mx-kick">{HALL_NO[p.c]} · {p.c}</p>
        <h3>{p.t}</h3>
        <div className="mx-pills">
          {p.s === 'dev' ? <span className="pill k">In development</span> : <span className="pill">Details being confirmed</span>}
        </div>
        <p className="mx-lead">{p.d}</p>
        {p.ident && <div className="note"><p><b>Being confirmed.</b> {p.ident}</p></div>}
        {p.feat && <section><h4>What it does</h4><ul>{p.feat.map((f, i) => <li key={i}>{f}</li>)}</ul></section>}
        {p.limit && <section><h4>Honest limits</h4><ul>{p.limit.map((f, i) => <li key={i}>{f}</li>)}</ul></section>}
        <section>
          <h4>Medium</h4>
          <div className="chips" style={{ marginTop: 0 }}>
            {p.tech.map(t => (
              <button key={t} className="chip" type="button" onClick={() => { ui().setMuseum(false); ui().setGraph(true); setTimeout(() => ui().focusNode('t:' + t), 90) }}>{techById.get(t)?.name ?? t}</button>
            ))}
          </div>
        </section>
        {p.conf && <p className="muted" style={{ fontSize: '.9rem' }}>{p.conf}</p>}
        {p.rel && p.rel.length > 0 && (
          <section>
            <h4>Related exhibits</h4>
            <div className="chips" style={{ marginTop: 0 }}>
              {p.rel.map(r => <button key={r} className="chip" type="button" onClick={() => onNav(r)}>{projById.get(r)?.t ?? r} →</button>)}
            </div>
          </section>
        )}
        {p.full && <button className="btn pri" type="button" onClick={() => { ui().setMuseum(false); ui().setLab(true) }}>Open the Cell Lab →</button>}
      </div>
    </aside>
  )
}

export function Museum() {
  const open = useUI(s => s.museumOpen)
  const at = useUI(s => s.museumAt)
  const setMuseum = useUI(s => s.setMuseum)
  const enterWorld = useUI(s => s.enterWorld)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<string | null>(null)
  const [plan, setPlan] = useState(false)
  const [near, setNear] = useState<string | null>(null)
  const [hall, setHall] = useState<string | null>(null)

  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    return PROJECTS.filter(p => !query || (p.t + ' ' + p.c + ' ' + p.d + ' ' + p.tech.map(t => techById.get(t)?.name ?? '').join(' ')).toLowerCase().includes(query))
  }, [q])
  const L = useMemo(() => layout(list), [list])

  const worldRef = useRef<HTMLDivElement>(null)
  const st = useRef({ target: 0, cur: 0, yaw: 0, pitch: 0, ty: 0, tp: 0, drag: false, lastY: 0, raf: 0 })
  const Lref = useRef(L); Lref.current = L

  const goTo = useCallback((z: number) => { st.current.target = Math.max(0, Math.min(Lref.current.length - 900, z)) }, [])
  const goFrame = useCallback((id: string) => {
    const it = Lref.current.items.find(i => i.kind === 'frame' && i.p.id === id)
    if (it) { goTo(it.z - 80); setSel(null) }
  }, [goTo])

  /* open / close lifecycle */
  useEffect(() => {
    if (!open) return
    setSel(null); setQ(''); setPlan(false)
    st.current.target = st.current.cur = 0
    const t = setTimeout(() => { if (at) { const it = layout(PROJECTS).items.find(i => i.kind === 'frame' && i.p.id === at); if (it) { st.current.target = it.z - 80 } } }, 400)
    return () => clearTimeout(t)
  }, [open, at])

  /* camera loop + input */
  useEffect(() => {
    if (!open || plan) return
    const s = st.current
    const rm = matchMedia('(prefers-reduced-motion: reduce)').matches
    const tick = () => {
      s.raf = requestAnimationFrame(tick)
      s.cur += (s.target - s.cur) * (rm ? 1 : 0.075)
      s.yaw += (s.ty - s.yaw) * 0.08; s.pitch += (s.tp - s.pitch) * 0.08
      const w = worldRef.current
      if (w) w.style.transform = `translateZ(${s.cur.toFixed(1)}px) rotateY(${s.yaw.toFixed(2)}deg) rotateX(${s.pitch.toFixed(2)}deg)`
      /* nearest frame */
      let best: string | null = null, bd = 330
      let h: string | null = null
      for (const it of Lref.current.items) {
        const d = Math.abs(it.z - 80 - s.cur)
        if (it.kind === 'frame' && d < bd) { bd = d; best = it.p.id }
        if (it.kind === 'arch' && it.z - 120 < s.cur + 200) h = it.cat
      }
      setNear(p => (p === best ? p : best))
      setHall(p => (p === h ? p : h))
    }
    s.raf = requestAnimationFrame(tick)
    const wheel = (e: WheelEvent) => { e.preventDefault(); goTo(s.target + e.deltaY * 1.1) }
    const mv = (e: PointerEvent) => {
      s.ty = ((e.clientX / innerWidth) - 0.5) * -26; s.tp = ((e.clientY / innerHeight) - 0.5) * 8
      if (s.drag) { goTo(s.target + (s.lastY - e.clientY) * 2.2); s.lastY = e.clientY }
    }
    const down = (e: PointerEvent) => { if ((e.target as HTMLElement).closest('button,input,aside,.mx-hud')) return; s.drag = true; s.lastY = e.clientY }
    const up = () => { s.drag = false }
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      if (['ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); goTo(s.target + 260) }
      if (['ArrowDown', 'KeyS'].includes(e.code)) { e.preventDefault(); goTo(s.target - 260) }
      if (e.code === 'PageDown') goTo(s.target + GAP * 2)
      if (e.code === 'PageUp') goTo(s.target - GAP * 2)
    }
    const el = document.getElementById('mx-root')
    el?.addEventListener('wheel', wheel, { passive: false })
    addEventListener('pointermove', mv); addEventListener('pointerdown', down); addEventListener('pointerup', up); addEventListener('keydown', key)
    return () => {
      cancelAnimationFrame(s.raf)
      el?.removeEventListener('wheel', wheel)
      removeEventListener('pointermove', mv); removeEventListener('pointerdown', down); removeEventListener('pointerup', up); removeEventListener('keydown', key)
    }
  }, [open, plan, goTo, L.length])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const ui = useUI.getState()
      if (ui.project || ui.graph || ui.lab || ui.palette) return
      if (sel) setSel(null); else setMuseum(false)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [open, sel, setMuseum])

  if (!open) return null
  const selP = sel ? projById.get(sel) : null
  const nearP = near ? projById.get(near) : null
  const halls = CATS.filter(c => list.some(p => p.c === c))
  const prog = Math.min(1, st.current.cur / Math.max(1, L.length - 900))
  const cycle = (dir: 1 | -1) => {
    const fr = L.items.filter((i): i is Extract<Item, { kind: 'frame' }> => i.kind === 'frame')
    const cur = st.current.target
    const nxt = dir > 0 ? fr.find(f => f.z - 80 > cur + 40) : [...fr].reverse().find(f => f.z - 80 < cur - 40)
    if (nxt) goTo(nxt.z - 80)
  }

  return (
    <div id="mx-root" className={'museum' + (plan ? ' plan' : '')} role="dialog" aria-modal="true" aria-label="Museum — all projects">
      <header className="mx-hud mx-top">
        <div className="mx-brand">
          <span className="mx-seal" aria-hidden="true">DK</span>
          <div><b>The Museum of Work</b><span>Divyanshu Kumar · {PROJECTS.length} exhibits · 8 halls</span></div>
        </div>
        <div className="mx-tools">
          <input type="search" placeholder="Search the collection…" aria-label="Search projects" value={q} onChange={e => { setQ(e.target.value); setSel(null); st.current.target = 0 }} />
          <button className="ibtn" type="button" aria-pressed={plan} onClick={() => setPlan(p => !p)}>{plan ? 'Walk' : 'Plan'}</button>
          <button className="ibtn" type="button" onClick={() => { setMuseum(false); enterWorld(true) }}>Drive instead</button>
          <button className="ibtn" type="button" onClick={() => setMuseum(false)} aria-label="Leave the museum">✕ Leave</button>
        </div>
      </header>

      {!plan && (
        <>
          <div className="mx-stage" aria-hidden={!!selP}>
            <div className="mx-light" aria-hidden="true" />
            <div className="mx-world" ref={worldRef}>
              <div className="mx-plane mx-floor" style={{ height: L.length + 600 }} />
              <div className="mx-plane mx-rug" style={{ height: L.length + 600 }} />
              <div className="mx-plane mx-ceil" style={{ height: L.length + 600 }} />
              <div className="mx-plane mx-wall l" style={{ width: L.length + 600 }} />
              <div className="mx-plane mx-wall r" style={{ width: L.length + 600 }} />
              <div className="mx-plane mx-end" style={{ '--z': -(L.length + 300) + 'px' } as React.CSSProperties}><span>End of the collection</span><small>Thank you for visiting</small></div>
              {L.items.map(it => it.kind === 'arch' ? (
                <div key={'a' + it.cat} className="mx-arch" style={{ '--z': -it.z + 'px', '--tone': CAT_COLOR[it.cat] } as React.CSSProperties}>
                  <small>{HALL_NO[it.cat]}</small><b>{it.cat}</b><span>{it.count} {it.count === 1 ? 'exhibit' : 'exhibits'}</span>
                </div>
              ) : (
                <Frame key={it.p.id} it={it} on={near === it.p.id} onOpen={() => setSel(it.p.id)} />
              ))}
              <div className="mx-start" style={{ '--z': -80 + 'px' } as React.CSSProperties}>
                <small>Welcome</small><b>Scroll, drag or press W / S to walk</b><span>Move the mouse to look around</span>
              </div>
            </div>
            <div className="mx-fog" aria-hidden="true" />
          </div>

          <footer className="mx-hud mx-bottom">
            <div className="mx-halls" role="tablist" aria-label="Jump to a hall">
              {halls.map(c => {
                const a = L.items.find(i => i.kind === 'arch' && i.cat === c)
                return (
                  <button key={c} type="button" role="tab" aria-selected={hall === c} className={hall === c ? 'on' : ''} style={{ '--tone': CAT_COLOR[c] } as React.CSSProperties}
                    onClick={() => a && goTo(a.z - 200)} title={c}>
                    <i /> <span>{HALL_NO[c].replace('Hall ', '')}</span>
                  </button>
                )
              })}
            </div>
            <div className="mx-nav">
              <button className="ibtn" type="button" onClick={() => cycle(-1)} aria-label="Previous exhibit">←</button>
              <div className="mx-meter" aria-hidden="true"><i style={{ width: prog * 100 + '%' }} /></div>
              <button className="ibtn" type="button" onClick={() => cycle(1)} aria-label="Next exhibit">→</button>
            </div>
          </footer>

          {nearP && !selP && (
            <div className="mx-now" key={nearP.id} style={{ '--tone': CAT_COLOR[nearP.c] } as React.CSSProperties}>
              <span className="mono">Now viewing · {HALL_NO[nearP.c]}</span>
              <b>{nearP.t}</b>
              <button className="btn pri" type="button" onClick={() => setSel(nearP.id)}>Open dossier</button>
            </div>
          )}
        </>
      )}

      {plan && (
        <div className="mx-plan">
          {halls.map(c => (
            <section key={c} style={{ '--tone': CAT_COLOR[c] } as React.CSSProperties}>
              <h3><small>{HALL_NO[c]}</small>{c}</h3>
              <div className="mx-plan-grid">
                {list.filter(p => p.c === c).map(p => (
                  <button key={p.id} type="button" className="mx-card" onClick={() => setSel(p.id)} aria-label={`Open exhibit ${p.t}`}>
                    <span className="mx-matte"><Art id={p.id} cat={p.c} motion={false} /></span>
                    <b>{p.t}</b><i>№ {String(PROJECTS.indexOf(p) + 1).padStart(2, '0')}</i>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {!list.length && <p className="muted" style={{ padding: 40 }}>Nothing on display matches. Clear the search.</p>}
        </div>
      )}

      {selP && <Dossier p={selP} onClose={() => setSel(null)} onNav={id => { setSel(id); if (!plan) goFrame(id); setSel(id) }} />}
    </div>
  )
}
