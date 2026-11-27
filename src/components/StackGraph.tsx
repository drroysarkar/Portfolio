'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { TECH, PROJECTS, EV, techById, projById } from '@/lib/data'
import { useUI } from '@/lib/store'
import { SectionHead } from '@/components/Reveal'

const NS = 'http://www.w3.org/2000/svg'
const tid = (id: string) => 't:' + id
const pid = (id: string) => 'p:' + id
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const RM = typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type GNode = { id: string; key: string; kind: 'tech' | 'project'; label: string; r: number; x: number; y: number; vx: number; vy: number; pinned: boolean }
type GEdge = { a: string; b: string }

class ForceGraph {
  nodes: GNode[]
  edges: GEdge[]
  by: Map<string, GNode>
  nb: Map<string, Set<string>>
  alpha = 1
  focus: string | null = null

  constructor(init: GNode[], edges: GEdge[]) {
    const rnd = rng(11)
    const techs = init.filter(n => n.kind === 'tech')
    const projs = init.filter(n => n.kind === 'project')
    this.nodes = [
      ...techs.map((n, i) => ({ ...n, x: Math.cos((i / techs.length) * 6.2832) * 320, y: Math.sin((i / techs.length) * 6.2832) * 260, vx: 0, vy: 0, pinned: false })),
      ...projs.map((n, i) => ({ ...n, x: Math.cos((i / projs.length) * 6.2832 + 0.2) * (110 + rnd() * 50), y: Math.sin((i / projs.length) * 6.2832 + 0.2) * (90 + rnd() * 40), vx: 0, vy: 0, pinned: false })),
    ]
    this.by = new Map(this.nodes.map(n => [n.id, n]))
    this.nb = new Map(this.nodes.map(n => [n.id, new Set<string>()]))
    this.edges = edges.filter(e => this.by.has(e.a) && this.by.has(e.b))
    this.edges.forEach(e => { this.nb.get(e.a)?.add(e.b); this.nb.get(e.b)?.add(e.a) })
  }
  get(id: string) { return this.by.get(id) }
  setFocus(id: string | null) { this.focus = id; this.alpha = Math.max(this.alpha, 0.9) }
  pin(id: string, x: number, y: number) {
    const n = this.by.get(id); if (!n) return
    n.pinned = true; n.x = x; n.y = y; n.vx = n.vy = 0; this.alpha = Math.max(this.alpha, 0.5)
  }
  unpin(id: string) { const n = this.by.get(id); if (n) n.pinned = false; this.alpha = Math.max(this.alpha, 0.4) }
  get settled() { return this.alpha <= 0.021 && this.nodes.every(n => Math.abs(n.vx) + Math.abs(n.vy) < 0.12) }
  step() {
    const N = this.nodes, A = this.alpha
    const fx = new Float64Array(N.length), fy = new Float64Array(N.length)
    const idx = new Map(N.map((n, i) => [n.id, i]))
    const f0 = this.focus ? this.by.get(this.focus) : null
    const fn = f0 ? this.nb.get(f0.id) : null
    for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
      let dx = N[j].x - N[i].x, dy = N[j].y - N[i].y, d2 = dx * dx + dy * dy
      if (d2 < 0.01) { dx = (i - j) * 0.1; dy = 0.1; d2 = dx * dx + dy * dy }
      const d = Math.sqrt(d2)
      let f = Math.min(7, 2400 / d2)
      const m = N[i].r + N[j].r + 8
      if (d < m) f += (m - d) * 0.35
      const ux = dx / d, uy = dy / d
      fx[i] -= ux * f; fy[i] -= uy * f; fx[j] += ux * f; fy[j] += uy * f
    }
    for (const e of this.edges) {
      const i = idx.get(e.a), j = idx.get(e.b)
      if (i === undefined || j === undefined) continue
      const dx = N[j].x - N[i].x, dy = N[j].y - N[i].y
      const d = Math.hypot(dx, dy) || 0.01
      const hot = f0 && (e.a === f0.id || e.b === f0.id)
      const f = (d - (hot ? 140 : 150)) * (hot ? 0.06 : 0.035)
      const ux = dx / d, uy = dy / d
      fx[i] += ux * f; fy[i] += uy * f; fx[j] -= ux * f; fy[j] -= uy * f
    }
    for (let i = 0; i < N.length; i++) {
      const n = N[i]
      fx[i] -= n.x * 0.012; fy[i] -= n.y * 0.012
      if (!f0) continue
      const d = Math.hypot(n.x, n.y) || 0.01
      if (n.id === f0.id) { fx[i] -= n.x * 0.25; fy[i] -= n.y * 0.25 }
      else if (fn?.has(n.id)) { const p = (d - 170) * 0.05; fx[i] -= (n.x / d) * p; fy[i] -= (n.y / d) * p }
      else if (d < 440) { const p = (440 - d) * 0.03; fx[i] += (n.x / d) * p; fy[i] += (n.y / d) * p }
    }
    for (let i = 0; i < N.length; i++) {
      const n = N[i]
      if (n.pinned) { n.vx = n.vy = 0; continue }
      n.vx = clamp((n.vx + fx[i] * Math.max(A, 0.25)) * 0.82, -30, 30)
      n.vy = clamp((n.vy + fy[i] * Math.max(A, 0.25)) * 0.82, -30, 30)
      n.x += n.vx; n.y += n.vy
    }
    this.alpha = Math.max(0.02, A * 0.992)
  }
}

function nColor(n: GNode): string {
  if (n.kind === 'project') return 'var(--fg)'
  const t = techById.get(n.key)
  if (!t) return 'var(--muted)'
  return t.evidence.includes('exploring') ? 'var(--mark)' : t.evidence.includes('cv') ? 'var(--sign)' : 'var(--muted)'
}

export function StackGraph() {
  const svgRef = useRef<SVGSVGElement>(null)
  const groot = useRef<SVGGElement>(null)
  const GRef = useRef<ForceGraph | null>(null)
  const nodeEls = useRef(new Map<string, SVGGElement>())
  const edgeEls = useRef(new Map<string, SVGLineElement>())
  const cam = useRef({ x: 0, y: 0, k: 1, tx: 0, ty: 0, tk: 1 })
  const raf = useRef(0)
  const drag = useRef<{ id: string; sx: number; sy: number; moved: boolean } | null>(null)
  const pan = useRef<{ sx: number; sy: number; cx: number; cy: number } | null>(null)
  const hoverRef = useRef<string | null>(null)
  const visRef = useRef(false)
  const qRef = useRef('')

  const [filter, setFilter] = useState<'all' | 'cv' | 'project' | 'exploring'>('all')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<string | null>(null)
  const openProject = useUI(s => s.openProject)
  const focus = useUI(s => s.focus)
  const focusTick = useUI(s => s.focusTick)

  const toWorld = useCallback((cx: number, cy: number) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const m = svg.getScreenCTM()
    if (!m) return { x: 0, y: 0 }
    const p = svg.createSVGPoint()
    p.x = cx; p.y = cy
    const w = p.matrixTransform(m.inverse())
    const c = cam.current
    return { x: (w.x - c.x) / c.k, y: (w.y - c.y) / c.k }
  }, [])

  qRef.current = q.trim().toLowerCase()

  /* ---------- paint / style ---------- */
  const paint = useCallback(() => {
    const G = GRef.current
    if (!G) return
    for (const n of G.nodes) nodeEls.current.get(n.id)?.setAttribute('transform', `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`)
    for (const e of G.edges) {
      const a = G.get(e.a), b = G.get(e.b), l = edgeEls.current.get(e.a + '|' + e.b)
      if (a && b && l) { l.setAttribute('x1', a.x.toFixed(1)); l.setAttribute('y1', a.y.toFixed(1)); l.setAttribute('x2', b.x.toFixed(1)); l.setAttribute('y2', b.y.toFixed(1)) }
    }
    const c = cam.current
    groot.current?.setAttribute('transform', `translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) scale(${c.k.toFixed(3)})`)
  }, [])

  const style = useCallback(() => {
    const G = GRef.current
    if (!G) return
    const selV = sel
    const qV = qRef.current
    const nb = selV ? G.nb.get(selV) : null
    const matches = qV ? new Set(G.nodes.filter(n => n.label.toLowerCase().includes(qV)).map(n => n.id)) : null
    G.nodes.forEach(n => {
      const g = nodeEls.current.get(n.id)
      if (!g) return
      const inF = !selV || n.id === selV || !!nb?.has(n.id)
      const inM = !matches || matches.has(n.id)
      g.classList.toggle('dim', !(inF && inM))
      g.classList.toggle('sel', n.id === selV)
      g.classList.toggle('show', n.id === selV || !!nb?.has(n.id) || hoverRef.current === n.id || (!!matches && matches.has(n.id)) || n.key === 'attendance-master')
      g.setAttribute('aria-pressed', String(n.id === selV))
    })
    G.edges.forEach(e => {
      const l = edgeEls.current.get(e.a + '|' + e.b)
      if (!l) return
      const hot = !!selV && (e.a === selV || e.b === selV)
      l.classList.toggle('hot', hot)
      l.classList.toggle('dim', (!!selV && !hot) || (!!qV && !(matches?.has(e.a) || matches?.has(e.b))))
    })
  }, [sel])

  const tick = useCallback(() => {
    raf.current = 0
    const G = GRef.current
    if (!G) return
    const e = RM ? 1 : 0.14
    const c = cam.current
    c.x += (c.tx - c.x) * e; c.y += (c.ty - c.y) * e; c.k += (c.tk - c.k) * e
    G.step(); paint()
    const moving = Math.abs(c.tx - c.x) + Math.abs(c.ty - c.y) + Math.abs(c.tk - c.k) > 0.05
    if (!G.settled || moving || drag.current) raf.current = requestAnimationFrame(tick)
  }, [paint])

  const wake = useCallback(() => { if (!raf.current && visRef.current) raf.current = requestAnimationFrame(tick) }, [tick])

  const apply = useCallback((selV: string | null) => {
    const G = GRef.current
    if (!G) return
    G.setFocus(selV)
    cam.current.tx = 0; cam.current.ty = 0; cam.current.tk = selV ? 1.1 : 1
    if (RM) for (let i = 0; i < 500; i++) G.step()
    style()
    wake()
  }, [style, wake])

  /* ---------- build graph ---------- */
  useEffect(() => {
    const svg = svgRef.current, gr = groot.current
    if (!svg || !gr) return
    gr.innerHTML = ''
    nodeEls.current.clear(); edgeEls.current.clear()
    const techs = TECH.filter(t => filter === 'all' || t.evidence.includes(filter))
    const ids = new Set(techs.map(t => t.id))
    const edges: GEdge[] = PROJECTS.flatMap(p => p.tech.filter(t => ids.has(t)).map(t => ({ a: tid(t), b: pid(p.id) })))
    const used = new Set(edges.map(e => e.b))
    const init: GNode[] = [
      ...techs.map(t => ({ id: tid(t.id), key: t.id, kind: 'tech' as const, label: t.name, r: 9 + Math.min(8, PROJECTS.filter(p => p.tech.includes(t.id)).length * 1.6), x: 0, y: 0, vx: 0, vy: 0, pinned: false })),
      ...PROJECTS.filter(p => filter === 'all' || used.has(pid(p.id))).map(p => ({ id: pid(p.id), key: p.id, kind: 'project' as const, label: p.t, r: p.full ? 9 : 6, x: 0, y: 0, vx: 0, vy: 0, pinned: false })),
    ]
    const G = new ForceGraph(init, edges)
    for (let i = 0; i < 260; i++) G.step()
    GRef.current = G

    const eg = document.createElementNS(NS, 'g')
    const ng = document.createElementNS(NS, 'g')
    gr.append(eg, ng)
    G.edges.forEach(e => {
      const l = document.createElementNS(NS, 'line')
      eg.appendChild(l)
      edgeEls.current.set(e.a + '|' + e.b, l)
    })
    G.nodes.forEach(n => {
      const g = document.createElementNS(NS, 'g')
      g.setAttribute('class', 'n ' + (n.kind === 'tech' ? 'tech' : 'proj'))
      g.setAttribute('tabindex', '0')
      g.setAttribute('role', 'button')
      g.setAttribute('aria-label', n.label + (n.kind === 'tech' ? ', technology' : ', project'))
      const c = nColor(n)
      const t = n.kind === 'tech' ? techById.get(n.key) : null
      g.innerHTML =
        `<circle class="hit" r="${n.r + 12}" fill="transparent"/><circle class="halo" r="${n.r + 8}"/>` +
        `<g class="body">${n.kind === 'tech'
          ? `<circle r="${n.r}" fill="${t && t.evidence.includes('cv') && !t.evidence.includes('exploring') ? c : 'var(--elev)'}" stroke="${c}" stroke-width="2.5"/>`
          : `<rect x="${-n.r}" y="${-n.r}" width="${n.r * 2}" height="${n.r * 2}" transform="rotate(45)" fill="${projById.get(n.key)?.s === 'dev' ? 'var(--mark)' : 'var(--bg)'}" stroke="var(--fg)" stroke-width="1.8"/>`
        }</g>` +
        `<text y="${n.r + 17}" text-anchor="middle">${n.label}</text>`
      g.addEventListener('pointerdown', ev => {
        ev.stopPropagation()
        g.setPointerCapture(ev.pointerId)
        drag.current = { id: n.id, sx: ev.clientX, sy: ev.clientY, moved: false }
      })
      g.addEventListener('pointermove', ev => {
        const d = drag.current
        if (!d || d.id !== n.id) return
        if (!d.moved && Math.hypot(ev.clientX - d.sx, ev.clientY - d.sy) > 5) d.moved = true
        if (d.moved) { const w = toWorld(ev.clientX, ev.clientY); G.pin(n.id, w.x, w.y); wake() }
      })
      g.addEventListener('pointerup', ev => {
        const d = drag.current
        drag.current = null
        try { g.releasePointerCapture(ev.pointerId) } catch { /* ignore */ }
        if (!d || d.id !== n.id) return
        if (d.moved) { G.unpin(n.id); wake() } else setSel(prev => (prev === n.id ? null : n.id))
      })
      g.addEventListener('pointercancel', () => { drag.current = null; G.unpin(n.id) })
      g.addEventListener('pointerenter', () => { hoverRef.current = n.id; style() })
      g.addEventListener('pointerleave', () => { if (hoverRef.current === n.id) hoverRef.current = null; style() })
      g.addEventListener('focus', () => { hoverRef.current = n.id; style() })
      g.addEventListener('blur', () => { if (hoverRef.current === n.id) hoverRef.current = null; style() })
      g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setSel(prev => (prev === n.id ? null : n.id)) } })
      ng.appendChild(g)
      nodeEls.current.set(n.id, g)
    })
    style()
    paint()
    for (let i = 0; i < 80; i++) G.step()
    paint()
    wake()
    return () => { GRef.current = null }
  }, [filter])

  useEffect(() => { style(); if (GRef.current) apply(sel) }, [sel, style, apply])
  useEffect(() => { style() }, [q, style])

  /* external focus requests (project modal, journey chips, palette) */
  useEffect(() => {
    if (!focus) return
    setFilter('all')
    setSel(focus)
  }, [focus, focusTick])

  /* pan + zoom */
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    let panLocal: { sx: number; sy: number; cx: number; cy: number } | null = null
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      panLocal = { sx: e.clientX, sy: e.clientY, cx: cam.current.tx, cy: cam.current.ty }
      svg.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!panLocal) return
      const u = 1000 / svg.getBoundingClientRect().width
      cam.current.tx = panLocal.cx + (e.clientX - panLocal.sx) * u
      cam.current.ty = panLocal.cy + (e.clientY - panLocal.sy) * u
      cam.current.x = cam.current.tx; cam.current.y = cam.current.ty
      paint()
    }
    const up = () => { panLocal = null }
    svg.addEventListener('pointerdown', down)
    svg.addEventListener('pointermove', move)
    svg.addEventListener('pointerup', up)
    svg.addEventListener('pointercancel', up)
    const io = new IntersectionObserver(es => { visRef.current = es[0].isIntersecting; if (visRef.current) wake() })
    io.observe(svg)
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !sel) return
      const sec = svg.closest('section')
      const r = sec?.getBoundingClientRect()
      if (r && r.top < window.innerHeight && r.bottom > 0) setSel(null)
    }
    addEventListener('keydown', onKey)
    return () => {
      svg.removeEventListener('pointerdown', down)
      svg.removeEventListener('pointermove', move)
      svg.removeEventListener('pointerup', up)
      svg.removeEventListener('pointercancel', up)
      io.disconnect()
      removeEventListener('keydown', onKey)
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [paint, wake, sel, toWorld])

  /* ---------- panel ---------- */
  const G = GRef.current
  const selNode = sel ? G?.get(sel) : null
  const selTech = selNode?.kind === 'tech' ? techById.get(selNode.key) : null
  const selProj = selNode?.kind === 'project' ? projById.get(selNode.key) : null

  const listTechs = TECH.filter(t => (filter === 'all' || t.evidence.includes(filter)) && t.name.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <section className="sec" id="stack" aria-labelledby="stack-h">
      <div className="wrap">
        <SectionHead eyebrow="Technology" title="The stack, traced to the work">
          <p className="lede">
            Drag any node. Click a technology and the projects that use it swing into orbit; click a project to
            see what it is built with. Colour shows why a technology is here (listed in my CV, used in a
            project, or being explored). It is evidence, not a skill rating.
          </p>
        </SectionHead>
        <div className="filters" id="gf" role="group" aria-label="Filter technologies by evidence">
          {([['all', 'All'], ['cv', 'Listed in CV'], ['project', 'Used in projects'], ['exploring', 'Exploring']] as const).map(([k, lbl]) => (
            <button key={k} className="chip" type="button" aria-pressed={filter === k} onClick={() => { setFilter(k); setSel(null) }}>{lbl}</button>
          ))}
        </div>
        <div className="stack-grid">
          <div className="gwrap">
            <svg id="g" ref={svgRef} viewBox="-500 -340 1000 680" role="group" aria-label="Technology network. The same information is in the list to the right.">
              <g ref={groot} />
            </svg>
            <div className="zoom">
              <button type="button" id="zin" aria-label="Zoom in" onClick={() => { cam.current.tk = clamp(cam.current.tk * 1.25, 0.5, 2.6); wake() }}>+</button>
              <button type="button" id="zout" aria-label="Zoom out" onClick={() => { cam.current.tk = clamp(cam.current.tk * 0.8, 0.5, 2.6); wake() }}>−</button>
              <button type="button" id="zreset" aria-label="Reset view" onClick={() => { cam.current.tx = 0; cam.current.ty = 0; cam.current.tk = 1; setSel(null); setQ(''); }}>⟲</button>
            </div>
            <div className="legend" aria-label="Legend">
              <span><i style={{ borderColor: 'var(--sign)', background: 'var(--sign)' }} />In CV</span>
              <span><i style={{ borderColor: 'var(--mark)' }} />Exploring</span>
              <span><i style={{ borderColor: 'var(--muted)' }} />Used in a project</span>
              <span><i className="d" style={{ borderColor: 'var(--fg)' }} />Project</span>
              <span style={{ marginLeft: 'auto' }}>Drag · click · Esc to clear</span>
            </div>
          </div>
          <div>
            <label>
              <span className="sr">Search technologies and projects</span>
              <input
                type="search"
                id="gq"
                placeholder="Search — Enter focuses the first match"
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => {
                  if (e.key !== 'Enter') return
                  const query = q.trim().toLowerCase()
                  const m = GRef.current?.nodes.filter(n => n.label.toLowerCase().includes(query)) ?? []
                  if (query && m.length) setSel((m.find(n => n.kind === 'tech') ?? m[0]).id)
                }}
              />
            </label>
            <div className="dpanel" id="gpanel" aria-live="polite">
              {!selNode && (
                <>
                  <p className="mono muted">Select a node</p>
                  <h3>Nothing focused</h3>
                  <p className="muted">
                    Click a technology and the projects that use it swing into orbit around it. Click a project
                    to see the technologies behind it. Tags show the evidence for each technology, not a
                    proficiency level.
                  </p>
                </>
              )}
              {selNode && selTech && (() => {
                const ps = PROJECTS.filter(x => x.tech.includes(selTech.id))
                return (
                  <>
                    <p className="mono muted">Technology</p>
                    <h3>{selTech.name}</h3>
                    <p className="muted">{selTech.summary}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {selTech.evidence.map(e => <span key={e} className={'pill ' + (e === 'exploring' ? 'y' : e === 'cv' ? 'g' : '')}>{EV[e]}</span>)}
                    </div>
                    <p className="mono muted" style={{ marginTop: 6 }}>Projects ({ps.length})</p>
                    {ps.length ? (
                      <div className="chips" style={{ margin: 0 }}>
                        {ps.map(x => <button key={x.id} className="chip" type="button" onClick={() => setSel(pid(x.id))}>{x.t}</button>)}
                      </div>
                    ) : (
                      <p className="muted">No project is linked yet. It appears because of the evidence above.</p>
                    )}
                  </>
                )
              })()}
              {selNode && selProj && (
                <>
                  <p className="mono muted">{selProj.c}</p>
                  <h3>{selProj.t}</h3>
                  <p className="muted">{selProj.d}</p>
                  <p className="mono muted">Built with</p>
                  <div className="chips" style={{ margin: 0 }}>
                    {selProj.tech.map(t => <button key={t} className="chip" type="button" onClick={() => setSel(tid(t))}>{techById.get(t)?.name ?? t}</button>)}
                  </div>
                  <div className="cta" style={{ margin: '6px 0 0' }}>
                    <button className="btn pri" type="button" onClick={() => openProject(selProj.id)}>Open details →</button>
                  </div>
                </>
              )}
            </div>
            <p className="mono muted" style={{ marginTop: 16 }}>All technologies</p>
            <div className="chips" id="glist">
              {listTechs.map(t => (
                <button key={t.id} className="chip" type="button" aria-pressed={sel === tid(t.id)} onClick={() => setSel(sel === tid(t.id) ? null : tid(t.id))}>{t.name}</button>
              ))}
              {!listTechs.length && <span className="muted">No technologies match.</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
