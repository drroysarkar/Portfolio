'use client'

import { useEffect, useRef, useState } from 'react'
import { CHAPTERS, techById, projById } from '@/lib/data'
import { focusNode, useUI, go } from '@/lib/store'
import { SectionHead } from '@/components/Reveal'

/* A vertical timeline: a sticky index on the left, a glowing rail that fills as you scroll,
   and one card per stop. Facts are carried over 1:1 from the CV. */
export function Journey() {
  const [cur, setCur] = useState(0)
  const listRef = useRef<HTMLOListElement>(null)
  const railRef = useRef<HTMLElement | null>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const nums = useRef<(HTMLElement | null)[]>([])
  const counted = useRef(new Set<number>())
  const openProject = useUI(s => s.openProject)
  const enterWorld = useUI(s => s.enterWorld)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const items = Array.from(list.querySelectorAll<HTMLElement>('.jr-item'))
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return
      const i = items.indexOf(e.target as HTMLElement)
      setCur(i)
      items.forEach((it, k) => it.classList.toggle('on', k <= i))
      if (!counted.current.has(i)) { counted.current.add(i); countUp(i) }
    }), { rootMargin: '-42% 0px -50% 0px' })
    items.forEach(it => io.observe(it))
    const onScroll = () => {
      const r = list.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, (innerHeight * 0.5 - r.top) / r.height))
      if (railRef.current) railRef.current.style.height = p * 100 + '%'
      if (barRef.current) barRef.current.style.width = p * 100 + '%'
    }
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => { io.disconnect(); removeEventListener('scroll', onScroll) }
  }, [])

  function countUp(i: number) {
    const n = nums.current[i]
    if (!n || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const v = +n.dataset.v!, d = +(n.dataset.d || 0), t0 = performance.now()
    const f = (t: number) => {
      const k = Math.min(1, (t - t0) / 1000), e = 1 - Math.pow(1 - k, 3)
      n.textContent = (v * e).toFixed(d)
      if (k < 1) requestAnimationFrame(f)
    }
    requestAnimationFrame(f)
  }

  const onClick = (e: React.MouseEvent) => {
    const t = (e.target as HTMLElement).closest('[data-t],[data-p],[data-go]') as HTMLElement | null
    if (!t) return
    if (t.dataset.t) focusNode('t:' + t.dataset.t)
    else if (t.dataset.p) openProject(t.dataset.p)
    else if (t.dataset.go) go(t.dataset.go)
  }

  const c = CHAPTERS[cur]
  return (
    <section className="sec" id="road" aria-labelledby="road-h">
      <div className="wrap">
        <SectionHead eyebrow="Journey" title={<>Seven stops, <em>one road</em></>}>
          <p className="lede">
            From school in Bhagalpur to full-stack work in Lucknow, and on into computer vision. Everything stated as a fact
            comes from my CV — and each stop is also a pad you can park on in the <strong>Atlas</strong> drive map.
          </p>
        </SectionHead>
        <div className="jr">
          <aside className="jr-side" aria-hidden="true">
            <div className="jr-big"><b>{String(c.n).padStart(2, '0')}</b></div>
            <div className="jr-meta">
              <span className="mono muted">Stop {c.n} of {CHAPTERS.length} · {c.km}</span>
              <strong>{c.stone}</strong>
              <div className="jr-bar" style={{ marginTop: 10 }}><i ref={barRef} /></div>
            </div>
          </aside>
          <div>
            <ol className="jr-list" ref={listRef} onClick={onClick}>
              <div className="jr-rail" aria-hidden="true"><i ref={el => { railRef.current = el }} /></div>
              {CHAPTERS.map((ch, i) => (
                <li key={ch.id} className="jr-item" id={'stop-' + ch.id}>
                  <span className="jr-dot" aria-hidden="true" />
                  <div className="jcard">
                    <div className="top-row">
                      <span className="stone"><b>{ch.km}</b> · {ch.stone}</span>
                      <span className="mono">{String(ch.n).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')}</span>
                    </div>
                    <h3>{ch.title}</h3>
                    <p className="where">{ch.where}</p>
                    {ch.score !== undefined && (
                      <>
                        <div className="big">
                          <span className="num" data-v={ch.score} data-d={ch.dec || 0} ref={el => { nums.current[i] = el }}>{ch.score.toFixed(ch.dec || 0)}</span>
                          <small>{ch.unit} {ch.lbl}</small>
                        </div>
                        {ch.note && <p className="muted" style={{ marginTop: 10 }}>{ch.note}</p>}
                      </>
                    )}
                    {ch.bullets && <ul className="dots">{ch.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
                    {ch.text && <p className="muted" style={{ marginTop: 16 }}>{ch.text}</p>}
                    {ch.techs && <div className="chips">{ch.techs.map(t => <button key={t} className="chip" type="button" data-t={t}>{techById.get(t)?.name ?? t}</button>)}</div>}
                    {ch.projects && <div className="chips">{ch.projects.map(p => <button key={p} className="chip" type="button" data-p={p}>{projById.get(p)?.t ?? p}</button>)}</div>}
                    {ch.link && <p style={{ marginTop: 18 }}><button className="tlink" type="button" data-go={ch.link[0]}>{ch.link[1]}</button></p>}
                  </div>
                </li>
              ))}
            </ol>
            <div className="jr-end">
              <span className="pill k">KM 6 · the road ends here</span>
              <h3>Now take the car out for a drive.</h3>
              <p className="muted" style={{ maxWidth: '54ch' }}>The same seven stops are laid out as pads in the Journey Quarter of the Atlas map. Park on one to read it again.</p>
              <button className="btn pri" type="button" onClick={() => enterWorld(true)}>Open the Atlas <span className="arr">↗</span></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
