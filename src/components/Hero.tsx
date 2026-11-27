'use client'

import { useEffect, useState } from 'react'
import { useUI, go } from '@/lib/store'
import { PROJECTS, TECH, CHAPTERS, ROWS } from '@/lib/data'
import { HeroField } from '@/components/HeroField'

/* The "reader": cycles specimen copy numbers from the AttendanceMaster sheet and
   reveals them digit by digit with a confidence bar — a nod to the case study. */
function Readout() {
  const [i, setI] = useState(0)
  const [n, setN] = useState(0)
  const row = ROWS[(i * 3) % ROWS.length]
  const digits = row.cn.split('')
  useEffect(() => {
    if (n < digits.length) { const t = setTimeout(() => setN(n + 1), 260); return () => clearTimeout(t) }
    const t = setTimeout(() => { setI(i + 1); setN(0) }, 2200)
    return () => clearTimeout(t)
  }, [n, i, digits.length])
  const conf = Math.round((n / digits.length) * 100)
  return (
    <div className="glass hcard readout">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="mono">Specimen · Copy No cell</span>
        <span className="pill k live">CRNN reading</span>
      </div>
      <div className="strip" aria-hidden="true"><b>{row.cn}</b></div>
      <div className="out" aria-label={'Read: ' + row.cn}>
        {digits.map((d, k) => <span key={k} className={k < n ? '' : 'off'}>{d}</span>)}
      </div>
      <div className="conf" aria-hidden="true"><i style={{ width: conf + '%' }} /></div>
      <p className="sub" style={{ fontSize: '.82rem' }}>Illustrative specimen from the Cell Lab — not a benchmark.</p>
    </div>
  )
}

export function Hero() {
  const enterWorld = useUI(s => s.enterWorld)
  const setMuseum = useUI(s => s.setMuseum)

  return (
    <section className="hero" id="top">
      <HeroField />
      <div className="wrap hero-in">
        <div>
          <p className="hero-badge"><i /> Full Stack Developer · Lucknow, India</p>
          <h1 aria-label="Divyanshu Kumar">
            <span className="ln" aria-hidden="true"><span>Divyanshu</span></span>
            <span className="ln" aria-hidden="true"><span>Kumar</span></span>
          </h1>
          <p className="hero-role">I build business software, and I&apos;m teaching a model <em>to read handwriting.</em></p>
          <p className="lede">
            ASP.NET, SQL Server and React by day at RMS Technosolution. By night, a CRNN that learns to read handwritten
            copy numbers from scanned exam attendance sheets.
          </p>
          <div className="cta">
            <button className="btn pri" type="button" onClick={() => enterWorld(true)}>Drive the Atlas <span className="arr">↗</span></button>
            <button className="btn" type="button" onClick={() => setMuseum(true)}>Walk the Museum</button>
            <a className="btn" href="#attendance" onClick={e => { e.preventDefault(); go('attendance') }}>Case study</a>
          </div>
        </div>
        <div className="hero-r">
          <div className="glass hcard">
            <span className="mono">Now</span>
            <h4>Full Stack Developer — RMS Technosolution</h4>
            <p className="sub">Lucknow · since August 2024 · C#, ASP.NET MVC, SQL Server</p>
          </div>
          <Readout />
          <div className="hstats">
            <div className="glass hcard"><b>{PROJECTS.length}</b><span>projects</span></div>
            <div className="glass hcard"><b>{TECH.length}</b><span>technologies</span></div>
            <div className="glass hcard"><b>{CHAPTERS.length}</b><span>journey stops</span></div>
          </div>
        </div>
      </div>
      <div className="hero-scroll mono" aria-hidden="true"><span>Scroll</span><i /></div>
    </section>
  )
}
