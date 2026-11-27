'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { PROJECTS, CATS, techById, projById } from '@/lib/data'
import { CAT_COLOR } from '@/lib/colors'
import { focusNode, useUI } from '@/lib/store'
import { SectionHead, useReveal } from '@/components/Reveal'
import { Art } from '@/components/Art'

function Pill({ p }: { p: { s: string } }) {
  return p.s === 'dev' ? <span className="pill k">In development</span> : <span className="pill">Details being confirmed</span>
}

function Card({ p, i, onOpen }: { p: (typeof PROJECTS)[number]; i: number; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement | null>(null)
  const rv = useReveal<HTMLButtonElement>()
  useEffect(() => {
    const el = ref.current
    if (!el || !matchMedia('(hover:hover) and (pointer:fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const mv = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height
      el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 7}deg) translateY(-4px)`
      el.style.setProperty('--gx', px * 100 + '%'); el.style.setProperty('--gy', py * 100 + '%')
    }
    const lv = () => { el.style.transform = '' }
    el.addEventListener('pointermove', mv); el.addEventListener('pointerleave', lv)
    return () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerleave', lv) }
  }, [])
  return (
    <button ref={el => { ref.current = el; rv.current = el }} className="pc rv" type="button" aria-haspopup="dialog" onClick={onOpen}
      style={{ transitionDelay: `${(i % 6) * 50}ms`, '--tone': CAT_COLOR[p.c] } as React.CSSProperties}>
      <span className="no">P-{String(PROJECTS.indexOf(p) + 1).padStart(2, '0')}</span>
      <Art id={p.id} cat={p.c} motion={false} />
      <div className="body">
        <div><Pill p={p} /></div>
        <h3>{p.t}</h3>
        <p>{p.d}</p>
        <div className="tech">{p.tech.slice(0, 5).map(t => techById.get(t)?.name).filter(Boolean).join(' · ')}</div>
      </div>
      <div className="glare" aria-hidden="true" />
    </button>
  )
}

export function Projects() {
  const [cat, setCat] = useState('All')
  const [q, setQ] = useState('')
  const openProject = useUI(s => s.openProject)
  const setMuseum = useUI(s => s.setMuseum)
  const flagship = PROJECTS[0]

  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    return PROJECTS.filter(p =>
      (cat === 'All' || p.c === cat) &&
      (!query || (p.t + ' ' + p.c + ' ' + p.d + ' ' + p.tech.map(t => techById.get(t)?.name ?? '').join(' ')).toLowerCase().includes(query))
    )
  }, [cat, q])

  return (
    <section className="sec band" id="projects" aria-labelledby="proj-h">
      <div className="wrap">
        <SectionHead eyebrow="Work" title={<>Twenty projects, <em>one collection</em></>}>
          <p className="lede">
            University result systems, ERP and enterprise tools, desktop utilities, a mobile app and one computer-vision project.
            Only AttendanceMaster is written up in depth; the rest show what I can state from my CV and project list, and say
            so when details are still being confirmed.
          </p>
        </SectionHead>

        <button className="feat" type="button" onClick={() => openProject(flagship.id)} aria-haspopup="dialog" aria-label={`Open ${flagship.t}`}>
          <Art id={flagship.id} cat={flagship.c} />
          <div className="body">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><span className="pill k live">Flagship · in development</span><span className="pill">{flagship.c}</span></div>
            <h3>{flagship.t}</h3>
            <p className="d">{flagship.d}</p>
            <div className="chips" style={{ marginTop: 0 }}>{flagship.tech.slice(0, 6).map(t => <span key={t} className="chip">{techById.get(t)?.name}</span>)}</div>
            <span className="tlink" style={{ justifySelf: 'start' }}>Read the dossier →</span>
          </div>
        </button>

        <button type="button" className="mx-strip" onClick={() => setMuseum(true)}>
          <span>
            <b>THE MUSEUM · 8 HALLS · 20 EXHIBITS</b>
            <strong>Step inside and walk the whole collection, frame by frame.</strong>
          </span>
          <span className="go" aria-hidden="true">→</span>
        </button>

        <div className="toolbar">
          <label className="search">
            <span className="sr">Search projects</span>
            <input type="search" id="pq" placeholder="Search projects, technologies, categories…" value={q} onChange={e => setQ(e.target.value)} />
          </label>
          <span className="mono muted" aria-live="polite">{list.length} of {PROJECTS.length}</span>
        </div>
        <div className="filters" id="pf" role="group" aria-label="Filter by category" style={{ marginBottom: 26 }}>
          {['All', ...CATS].map(c => (
            <button key={c} className="chip" type="button" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <div className="pgrid" id="pgrid">
          {list.map(p => <Card key={p.id} p={p} i={list.indexOf(p)} onOpen={() => openProject(p.id)} />)}
          {!list.length && <p className="muted">No projects match. Clear the search or pick another category.</p>}
        </div>
      </div>
    </section>
  )
}

export function ProjectModal() {
  const project = useUI(s => s.project)
  const openProject = useUI(s => s.openProject)
  const setMuseum = useUI(s => s.setMuseum)
  const p = project ? projById.get(project) : null
  return (
    <Dialog open={!!p} onOpenChange={v => { if (!v) openProject(null) }}>
      <DialogContent className="dlg-in" aria-describedby={undefined}>
        {p && <div style={{ margin: 'calc(-1 * clamp(22px,4vw,40px))', marginBottom: 0, height: 180, position: 'relative' }}><Art id={p.id} cat={p.c} /></div>}
        <DialogTitle asChild><h3 style={{ marginTop: 8 }}>{p?.t ?? ''}</h3></DialogTitle>
        <DialogDescription asChild><p>{p?.d ?? ''}</p></DialogDescription>
        {p && (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Pill p={p} /><span className="pill" style={{ borderColor: CAT_COLOR[p.c], color: CAT_COLOR[p.c] }}>{p.c}</span></div>
            {p.ident && <div className="note"><p><b>Being confirmed.</b> {p.ident}</p></div>}
            {p.feat && (<div><p className="mono muted" style={{ marginBottom: 8 }}>Features</p><ul>{p.feat.map((f, i) => <li key={i}>{f}</li>)}</ul></div>)}
            <div>
              <p className="mono muted" style={{ marginBottom: 8 }}>Built with</p>
              <div className="chips" style={{ margin: 0 }}>
                {p.tech.map(t => <button key={t} className="chip" type="button" onClick={() => { openProject(null); focusNode('t:' + t) }}>{techById.get(t)?.name ?? t}</button>)}
              </div>
            </div>
            {p.limit && (<div><p className="mono muted" style={{ marginBottom: 8 }}>Limits</p><ul>{p.limit.map((f, i) => <li key={i}>{f}</li>)}</ul></div>)}
            {p.conf && <p className="muted" style={{ fontSize: '.92rem' }}>{p.conf}</p>}
            {p.rel && (
              <div>
                <p className="mono muted" style={{ marginBottom: 8 }}>Related</p>
                <div className="chips" style={{ margin: 0 }}>
                  {p.rel.map(r => <button key={r} className="chip" type="button" onClick={() => openProject(r)}>{projById.get(r)?.t ?? r}</button>)}
                </div>
              </div>
            )}
            <div className="cta" style={{ margin: 0 }}>
              {p.full && <button className="btn pri" type="button" onClick={() => { openProject(null); useUI.getState().setLab(true) }}>Open the Cell Lab →</button>}
              <button className="btn" type="button" onClick={() => { openProject(null); setMuseum(true, p.id) }}>See it in the museum</button>
              <button className="btn" type="button" onClick={() => { openProject(null); useUI.getState().setGraph(true); setTimeout(() => focusNode('p:' + p.id), 90) }}>Stack graph</button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
