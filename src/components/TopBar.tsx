'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { useUI } from '@/lib/store'

const LINKS: [string, string][] = [
  ['road', 'Journey'], ['drive', 'Atlas'], ['projects', 'Work'],
  ['stack', 'Stack'], ['attendance', 'Case study'], ['contact', 'Contact'],
]

export function TopBar() {
  const setPalette = useUI(s => s.setPalette)
  const setMuseum = useUI(s => s.setMuseum)
  const enterWorld = useUI(s => s.enterWorld)
  const { resolvedTheme, setTheme } = useTheme()
  const [menu, setMenu] = useState(false)
  const navRef = useActiveNav()

  const toggle = (e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = r.left + r.width / 2, y = r.top + r.height / 2
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } }
    const apply = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    if (!doc.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) { apply(); return }
    const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    doc.startViewTransition(apply).ready.then(() => {
      doc.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] },
        { duration: 700, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' }
      )
    }).catch(() => {})
  }

  const nav = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault(); setMenu(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className="top">
      <div className="bar">
        <a className="logo" href="#top" aria-label="Divyanshu Kumar, top of page" onClick={nav('top')}>
          <i>DK</i><span>Divyanshu</span>
        </a>
        <nav aria-label="Sections" ref={navRef}>
          {LINKS.map(([id, label]) => <a key={id} href={'#' + id} onClick={nav(id)}>{label}</a>)}
        </nav>
        <div className="tools">
          <button className="ibtn srch" id="openPal" type="button" aria-label="Open command palette" onClick={() => setPalette(true)}>
            Search <kbd>Ctrl K</kbd>
          </button>
          <button className="ibtn" type="button" onClick={() => setMuseum(true)} aria-label="Walk the museum">Museum</button>
          <button className="ibtn go" type="button" onClick={() => enterWorld(true)}>Drive ↗</button>
          <button className="ibtn" id="themeBtn" type="button" onClick={toggle} aria-label="Switch between light and dark theme">
            <span className="theme-ic" aria-hidden="true">
              <svg className="moon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
              <svg className="sun" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
            </span>
            <span className="sr">Theme</span>
          </button>
          <button className="ibtn menu-btn" type="button" aria-expanded={menu} aria-label="Menu" onClick={() => setMenu(m => !m)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={menu ? 'M6 6l12 12M18 6L6 18' : 'M4 8h16M4 16h16'} /></svg>
          </button>
        </div>
        <div className={'menu-panel' + (menu ? ' open' : '')}>
          {LINKS.map(([id, label]) => <a key={id} href={'#' + id} onClick={nav(id)}>{label}</a>)}
        </div>
      </div>
    </header>
  )
}

/* Highlight the nav link of the section in view. */
function useActiveNav() {
  const ref = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const nav = ref.current
    if (!nav) return
    const links = Array.from(nav.querySelectorAll('a'))
    const secs = links.map(a => document.getElementById(a.getAttribute('href')!.slice(1))).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) links.forEach(l => l.classList.toggle('on', l.getAttribute('href') === '#' + e.target.id))
    }), { rootMargin: '-40% 0px -55% 0px' })
    secs.forEach(s => io.observe(s))
    return () => io.disconnect()
  }, [])
  return ref
}
