'use client'

import { useEffect } from 'react'
import { Preloader } from '@/components/Preloader'
import { Cursor } from '@/components/Cursor'
import { TopBar } from '@/components/TopBar'
import { Hero } from '@/components/Hero'
import { Marquee } from '@/components/Marquee'
import { Journey } from '@/components/Journey'
import { DriveCta } from '@/components/DriveCta'
import { Projects } from '@/components/Projects'
import { Attendance } from '@/components/Attendance'
import { Contact } from '@/components/Contact'
import { Footer } from '@/components/Footer'
import { SectionHead, useReveal } from '@/components/Reveal'
import { TECH, EV } from '@/lib/data'
import { EV_COLOR } from '@/lib/colors'
import { useUI } from '@/lib/store'
import { DriveMode } from '@/components/DriveMode'
import { Museum } from '@/components/Museum'
import { ProjectModal } from '@/components/Projects'
import { LabModal, GraphModal } from '@/components/world/Modals'
import { Palette } from '@/components/Palette'
import { Toast } from '@/components/Toast'
import { Bot } from '@/components/Bot'

/* Scroll portfolio first — finish the 7-stop journey and the car
   jumps into the full Neon Grid drive map (exitable at any time). */
export default function Page() {
  const ready = useUI(s => s.ready)
  const museumOpen = useUI(s => s.museumOpen)

  /* top scroll-progress bar */
  useEffect(() => {
    const el = document.getElementById('prog')
    if (!el) return
    const on = () => {
      const h = document.documentElement
      const p = h.scrollHeight - h.clientHeight
      el.style.transform = `scaleX(${p > 0 ? h.scrollTop / p : 0})`
    }
    on()
    addEventListener('scroll', on, { passive: true })
    return () => removeEventListener('scroll', on)
  }, [])

  return (
    <>
      <div id="prog" aria-hidden="true" />
      <div id="ring" aria-hidden="true" />
      <div id="dot" aria-hidden="true" />

      <div className={ready ? 'site ready' : 'site'} aria-hidden={museumOpen || undefined}>
        <TopBar />
        <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
          <Hero />
          <Marquee />
          <Journey />
          <Projects />
          <DriveCta />
          <StackSection />
          <section className="sec" id="attendance" aria-labelledby="am-h">
            <div className="wrap">
              <SectionHead eyebrow="Case study · in development" title={<>Attendance<em>Master</em></>}>
                <p className="lede">
                  After an exam, every centre sends back scanned attendance sheets. Each row carries a
                  <strong> Copy No</strong>, written by hand, that ties a student to an answer script.
                  AttendanceMaster reads those numbers so people only have to check them. The specimen sheet
                  below is fully interactive — click any Copy No cell to replay the preprocessing pipeline
                  the project runs before its CRNN ever sees the strip.
                </p>
              </SectionHead>
              <Attendance />
            </div>
          </section>
          <Contact />
          <Footer />
        </main>
      </div>

      {/* overlays above the site */}
      <DriveMode />
      <Museum />
      <ProjectModal />
      <LabModal />
      <GraphModal />
      <Palette />
      <Bot />
      <Toast />
      <Cursor />
      <Preloader />
    </>
  )
}

/* The stack, as an evidence board — the full drag graph opens from here. */
function StackSection() {
  const setGraph = useUI(s => s.setGraph)
  const ref = useReveal<HTMLDivElement>()
  const groups: [string, string][] = [
    ['cv', 'Listed in CV'],
    ['project', 'Used in a project'],
    ['exploring', 'Exploring'],
  ]
  return (
    <section className="sec" id="stack" aria-labelledby="stack-h">
      <div className="wrap">
        <SectionHead eyebrow="Technology" title={<>The stack, <em>traced to the work</em></>}>
          <p className="lede">
            {TECH.length} technologies, each placed by evidence — listed in my CV, used in a shipped project,
            or actively being explored. It is a trace, not a skill rating. Open the network graph to drag
            nodes and see exactly which project wires in which technology.
          </p>
        </SectionHead>
        <div className="stackboard rv" ref={ref}>
          <div className="sb-cols">
            {groups.map(([ev, label]) => (
              <div key={ev} className="sb-col" style={{ '--c': EV_COLOR[ev] } as React.CSSProperties}>
                <p className="mono sb-lbl"><i />{label}</p>
                <p className="sb-n">{TECH.filter(t => t.evidence.includes(ev as 'cv')).length}</p>
                <div className="chips" style={{ marginTop: 0 }}>
                  {TECH.filter(t => t.evidence.includes(ev as 'cv')).map(t => (
                    <span key={t.id} className="chip" title={t.summary}>{t.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="sb-cta">
            <button className="btn pri" type="button" onClick={() => setGraph(true)}>
              Open the network graph →
            </button>
            <p className="mono muted">drag nodes · click to focus · projects swing into orbit</p>
          </div>
        </div>
      </div>
    </section>
  )
}
