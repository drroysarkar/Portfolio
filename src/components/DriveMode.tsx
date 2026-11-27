'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { Atlas, type AtlasStats } from '@/lib/atlasEngine'
import { DISTRICTS, type Spot, type District } from '@/lib/atlas'
import { EXPEDITIONS, useUI, focusNode } from '@/lib/store'
import { EMAIL, PHONE } from '@/lib/data'

/* Fullscreen Atlas: the drivable map + HUD.
   Layout rule — the bottom-right corner belongs to the AI assistant. */

const seen = { districts: new Set<string>(), exhibits: new Set<string>(), tech: new Set<string>(), story: new Set<string>() }

export function DriveMode() {
  const worldOpen = useUI(s => s.worldOpen)
  const jumpFx = useUI(s => s.jumpFx)
  const [fx, setFx] = useState(false)

  useEffect(() => {
    if (!jumpFx) return
    setFx(true)
    const t = setTimeout(() => setFx(false), 1550)
    return () => clearTimeout(t)
  }, [jumpFx])

  return (
    <>
      {worldOpen && <AtlasWorld />}
      {fx && (
        <div className="jumpfx" role="presentation">
          <div className="jfx-tag"><b>Opening the Atlas</b>Six districts · one car</div>
        </div>
      )}
    </>
  )
}

function AtlasWorld() {
  const { resolvedTheme, setTheme } = useTheme()
  const night = resolvedTheme !== 'light'
  const cvRef = useRef<HTMLCanvasElement>(null)
  const miniRef = useRef<HTMLCanvasElement>(null)
  const engine = useRef<Atlas | null>(null)
  const stickRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLElement | null>(null)
  const spotRef = useRef<Spot | null>(null)

  const [spot, setSpot] = useState<Spot | null>(null)
  const [banner, setBanner] = useState<{ d: District; k: number } | null>(null)
  const [stats, setStats] = useState<AtlasStats>({ speed: 0, boost: 1, x: 0, y: 0, shards: 0, drift: false })
  const [panel, setPanel] = useState<'exp' | 'tele' | null>(null)
  const [hintFade, setHintFade] = useState(false)

  const exitWorld = useUI(s => s.exitWorld)
  const prog = useUI(s => s.prog)
  const xp = useUI(s => s.xp)
  const teleportTo = useUI(s => s.teleportTo)
  const paused = useUI(s => s.project || s.lab || s.graph || s.palette || s.museumOpen)

  const act = useCallback((s: Spot) => {
    const ui = useUI.getState()
    switch (s.kind) {
      case 'project': ui.openProject(s.ref!); break
      case 'tech': ui.setGraph(true); setTimeout(() => ui.focusNode('t:' + s.ref), 90); break
      case 'graph': ui.setGraph(true); break
      case 'lab': ui.setLab(true); break
      case 'museum': ui.setMuseum(true); break
      case 'email': navigator.clipboard?.writeText(EMAIL).catch(() => {}); ui.showToast('Email copied'); break
      case 'phone': navigator.clipboard?.writeText(PHONE).catch(() => {}); ui.showToast('Phone copied'); break
      default: break
    }
  }, [])
  const actLabel = (s: Spot) => ({ project: 'Open dossier', tech: 'Show in graph', graph: 'Open graph', lab: 'Open Cell Lab', museum: 'Enter museum', email: 'Copy email', phone: 'Copy phone' } as Record<string, string>)[s.kind]

  /* engine lifecycle */
  useEffect(() => {
    const cv = cvRef.current, mini = miniRef.current
    if (!cv) return
    const ui = () => useUI.getState()
    const e = new Atlas({
      canvas: cv, mini, interactive: true, night,
      onSpot: s => {
        spotRef.current = s; setSpot(s)
        if (!s) return
        if (s.kind === 'project' && !seen.exhibits.has(s.id)) { seen.exhibits.add(s.id); ui().progress('exhibits') }
        if (s.kind === 'tech' && !seen.tech.has(s.id)) { seen.tech.add(s.id); ui().progress('stack') }
        if (s.kind === 'chapter' && !seen.story.has(s.id)) { seen.story.add(s.id); ui().progress('story') }
      },
      onDistrict: d => {
        setBanner({ d, k: Date.now() })
        if (!seen.districts.has(d.id)) { seen.districts.add(d.id); ui().progress('districts') }
      },
      onShard: () => ui().progress('shards'),
      onBoost: () => ui().progress('boost'),
      onStats: s => setStats(s),
    })
    engine.current = e
    e.start()
    const onKey = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      const st = ui()
      if (st.project || st.lab || st.graph || st.palette || st.museumOpen) return
      if (ev.code === 'KeyE' || ev.code === 'Enter') { if (spotRef.current) act(spotRef.current) }
      else if (ev.code === 'KeyM') setPanel(p => (p === 'exp' ? null : 'exp'))
      else if (ev.code === 'KeyT') setPanel(p => (p === 'tele' ? null : 'tele'))
      else if (ev.code === 'Escape') { if (panel) setPanel(null); else st.exitWorld() }
    }
    addEventListener('keydown', onKey)
    const hint = setTimeout(() => setHintFade(true), 14000)
    return () => { clearTimeout(hint); removeEventListener('keydown', onKey); e.destroy(); engine.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { engine.current?.setNight(night) }, [night])
  useEffect(() => { if (engine.current) engine.current.paused = !!paused }, [paused])
  useEffect(() => {
    if (!teleportTo) return
    engine.current?.teleport(teleportTo)
    useUI.getState().teleport(null)
  }, [teleportTo])

  /* touch joystick */
  const onStick = (ev: React.PointerEvent) => {
    const el = stickRef.current, e = engine.current
    if (!el || !e) return
    const r = el.getBoundingClientRect()
    const dx = ev.clientX - (r.left + r.width / 2), dy = ev.clientY - (r.top + r.height / 2)
    const m = Math.min(1, Math.hypot(dx, dy) / 50), a = Math.atan2(dy, dx)
    const nx = Math.cos(a) * m, ny = Math.sin(a) * m
    e.setStick(Math.abs(nx) < 0.15 ? 0 : nx, Math.abs(ny) < 0.15 ? 0 : ny)
    if (knobRef.current) knobRef.current.style.transform = `translate(${nx * 38}px, ${ny * 38}px)`
  }
  const endStick = () => { engine.current?.setStick(0, 0); if (knobRef.current) knobRef.current.style.transform = '' }

  const kmh = Math.round(stats.speed * 0.2)
  const done = EXPEDITIONS.filter(x => (prog[x.id] ?? 0) >= x.goal).length

  return (
    <div className={'drivemode' + (night ? '' : ' day')} role="application" aria-label="Atlas drive map. Use W A S D or arrow keys to drive.">
      <canvas ref={cvRef} className="at-cv" />

      <div className="at-tl">
        <button className="at-btn at-glass" type="button" onClick={exitWorld} aria-label="Exit the Atlas">← Exit</button>
        <span className="at-title at-glass"><i /> Atlas · Divyanshu Kumar</span>
      </div>

      {banner && (
        <div className="at-banner" key={banner.k} aria-live="polite">
          <b style={{ color: banner.d.color }}>{banner.d.name}</b>
          <span>{banner.d.blurb}</span>
        </div>
      )}

      <div className="at-tr">
        <div className="at-mini at-glass"><canvas ref={miniRef} width={440} height={294} aria-label="Minimap" /></div>
        <div className="at-tools">
          <button className="at-btn sq at-glass" type="button" aria-pressed={panel === 'tele'} onClick={() => setPanel(p => (p === 'tele' ? null : 'tele'))} aria-label="Teleport to a district (T)" title="Teleport (T)">⌖</button>
          <button className="at-btn at-glass" type="button" aria-pressed={panel === 'exp'} onClick={() => setPanel(p => (p === 'exp' ? null : 'exp'))} title="Expeditions (M)">Expeditions {done}/{EXPEDITIONS.length}</button>
          <button className="at-btn sq at-glass" type="button" onClick={() => engine.current?.zoomBy(1 / 1.2)} aria-label="Zoom out">−</button>
          <button className="at-btn sq at-glass" type="button" onClick={() => engine.current?.zoomBy(1.2)} aria-label="Zoom in">+</button>
          <button className="at-btn sq at-glass" type="button" onClick={() => setTheme(night ? 'light' : 'dark')} aria-label="Switch map between night and day">{night ? '☀' : '☾'}</button>
        </div>
      </div>

      {panel === 'exp' && (
        <div className="at-exp at-glass" role="region" aria-label="Expeditions">
          <h4>Expeditions <span>{xp} XP</span></h4>
          {EXPEDITIONS.map(x => {
            const p = prog[x.id] ?? 0, ok = p >= x.goal
            return (
              <div key={x.id} className={'at-ex' + (ok ? ' done' : '')}>
                <div className="t">{ok ? '✓ ' : ''}{x.title}<span>{p}/{x.goal} · {x.xp} XP</span></div>
                <div className="at-bar"><i style={{ width: (p / x.goal) * 100 + '%' }} /></div>
                <div className="h">{x.hint}</div>
              </div>
            )
          })}
        </div>
      )}

      {panel === 'tele' && (
        <div className="at-tele at-glass" role="menu" aria-label="Teleport">
          {DISTRICTS.map(d => (
            <button key={d.id} type="button" role="menuitem" style={{ '--c': d.color } as React.CSSProperties} onClick={() => { engine.current?.teleport(d.id); setPanel(null) }}>
              <i /><b>{d.name}</b><small>{d.tag}</small>
            </button>
          ))}
        </div>
      )}

      <div className="at-bl">
        <div className="at-speed at-glass">
          <div className="row">
            <span className="n">{kmh}</span><span className="u">KM/H</span>
            <span className="stat">SHARDS <b>{stats.shards}</b>/36<br />XP <b>{xp}</b></span>
          </div>
          <div className="at-bar boost" title="Boost (Shift)"><i style={{ width: stats.boost * 100 + '%' }} /></div>
        </div>
        <div className={'at-keys' + (hintFade ? ' fade' : '')}>
          <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> drive</span>
          <span><kbd>Space</kbd> brake</span>
          <span><kbd>Shift</kbd> boost</span>
          <span><kbd>E</kbd> open</span>
          <span><kbd>M</kbd> goals</span>
          <span><kbd>Esc</kbd> exit</span>
        </div>
      </div>

      {spot && (
        <div className="at-card at-glass" style={{ '--c': spot.color } as React.CSSProperties} role="status" key={spot.id}>
          <span className="sub">{spot.sub}</span>
          <h3>{spot.title}</h3>
          <p>{spot.body}</p>
          {actLabel(spot) && (
            <div className="acts">
              <button className="at-btn pri" type="button" onClick={() => act(spot)}>{actLabel(spot)} <span aria-hidden="true">↗</span></button>
              <span className="hint">or press E</span>
            </div>
          )}
        </div>
      )}

      <div className="at-stick at-glass" ref={stickRef} onPointerDown={e => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); onStick(e) }} onPointerMove={e => { if (e.buttons || e.pointerType === 'touch') onStick(e) }} onPointerUp={endStick} onPointerCancel={endStick} aria-hidden="true">
        <i ref={el => { knobRef.current = el }} />
      </div>
      <div className="at-pedals">
        <button className="at-glass" type="button" onPointerDown={() => engine.current?.setBrake(true)} onPointerUp={() => engine.current?.setBrake(false)} onPointerLeave={() => engine.current?.setBrake(false)}>Brake</button>
        <button className="at-glass" type="button" onPointerDown={() => engine.current?.setBoost(true)} onPointerUp={() => engine.current?.setBoost(false)} onPointerLeave={() => engine.current?.setBoost(false)}>Boost</button>
      </div>
    </div>
  )
}
