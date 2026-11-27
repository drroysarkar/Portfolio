'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { Atlas } from '@/lib/atlasEngine'
import { TECH, PROJECTS, CHAPTERS } from '@/lib/data'
import { useUI } from '@/lib/store'
import { SectionHead, useReveal } from '@/components/Reveal'

/* Live preview: the same engine as drive mode, on autopilot around the ring road. */
function AtlasPreview() {
  const ref = useRef<HTMLCanvasElement>(null)
  const eng = useRef<Atlas | null>(null)
  const { resolvedTheme } = useTheme()
  const night = resolvedTheme !== 'light'
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const e = new Atlas({ canvas: cv, interactive: false, night, zoom: 0.62 })
    eng.current = e
    e.start()
    return () => { e.destroy(); eng.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { eng.current?.setNight(night) }, [night])
  return <canvas ref={ref} aria-hidden="true" />
}

const STATS: [string, string][] = [
  ['6', 'districts, linked by a ring road and six avenues'],
  [String(PROJECTS.length), 'exhibit pads in the Museum District'],
  [String(TECH.length), 'technology pads in the Stack Gardens'],
  [String(CHAPTERS.length), 'journey stops you can park on and re-read'],
]

export function DriveCta() {
  const enterWorld = useUI(s => s.enterWorld)
  const setMuseum = useUI(s => s.setMuseum)
  const ref = useReveal<HTMLDivElement>()
  return (
    <section className="sec band" id="drive" aria-labelledby="drive-h">
      <div className="wrap">
        <SectionHead eyebrow="The Atlas" title={<>Don&apos;t scroll it. <em>Drive it.</em></>}>
          <p className="lede">
            The whole portfolio is also a map. Take the car out with <strong>W A S D</strong> (or the on-screen stick), hit boost pads,
            collect data shards and park on any pad to open a project, a technology or a chapter of the journey.
            It follows the site theme: neon at night, paper-atlas by day.
          </p>
        </SectionHead>
        <div className="dcta rv" ref={ref}>
          <div>
            <div className="dcta-stats" style={{ marginTop: 0 }}>
              {STATS.map(([v, d]) => (
                <div key={d} className="dcta-stat"><b>{v}</b><span>{d}</span></div>
              ))}
            </div>
            <div className="cta">
              <button className="btn pri" type="button" onClick={() => enterWorld(true)}>Start the engine <span className="arr">↗</span></button>
              <button className="btn" type="button" onClick={() => setMuseum(true)}>Or walk the museum</button>
            </div>
            <p className="mono muted" style={{ marginTop: 16 }}>Six expeditions · boost pads · day / night map · works on touch</p>
          </div>
          <div className="device">
            <div className="device-glow" aria-hidden="true" />
            <div className="device-in">
              <AtlasPreview />
              <div className="device-hud"><span className="tag">Live · autopilot</span><span className="tag">Atlas 3000 × 2000</span></div>
              <button className="btn pri device-play" type="button" onClick={() => enterWorld(true)}>Take the wheel</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
