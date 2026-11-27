'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PROJECTS, TECH, EMAIL } from '@/lib/data'
import { DISTRICTS } from '@/lib/atlas'
import { useUI, go } from '@/lib/store'

type Cmd = { l: string; g: string; f: () => void }

export function Palette() {
  const open = useUI(s => s.palette)
  const setOpen = useUI(s => s.setPalette)
  const [q, setQ] = useState('')
  const [selI, setSelI] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const cmds: Cmd[] = useCallback(() => {
    const ui = useUI.getState()
    return [
      { l: 'Drive the Atlas map', g: 'Drive', f: () => ui.enterWorld(true) },
      { l: 'Walk the Museum', g: 'Drive', f: () => ui.setMuseum(true) },
      ...DISTRICTS.map(d => ({ l: 'Drive to ' + d.name, g: 'Travel', f: () => { if (!useUI.getState().worldOpen) ui.enterWorld(true); setTimeout(() => ui.teleport(d.id), useUI.getState().worldOpen ? 0 : 1200) } })),
      { l: 'Jump to the Journey', g: 'Go', f: () => go('road') },
      { l: 'Jump to Projects', g: 'Go', f: () => go('projects') },
      { l: 'Jump to Contact', g: 'Go', f: () => go('contact') },
      { l: 'Copy email address', g: 'Action', f: () => { navigator.clipboard?.writeText(EMAIL).catch(() => {}); ui.showToast('Email copied') } },
      { l: 'Open the Cell Lab (CRNN pipeline)', g: 'Tool', f: () => ui.setLab(true) },
      { l: 'Open the stack network graph', g: 'Tool', f: () => ui.setGraph(true) },
      ...PROJECTS.map(p => ({ l: p.t, g: 'Project', f: () => ui.openProject(p.id) })),
      ...TECH.map(t => ({ l: 'Focus ' + t.name, g: 'Technology', f: () => { ui.setGraph(true); setTimeout(() => useUI.getState().focusNode('t:' + t.id), 90) } })),
    ]
  }, [])()

  const query = q.trim().toLowerCase()
  const items = cmds.filter(c => !query || (c.l + ' ' + c.g).toLowerCase().includes(query)).slice(0, 30)

  useEffect(() => { if (open) { setQ(''); setSelI(0); setTimeout(() => inputRef.current?.focus(), 30) } }, [open])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(!open) }
      if (e.key === 'Escape' && open) setOpen(false)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [open, setOpen])

  const run = (i: number) => { const c = items[i]; if (!c) return; setOpen(false); setTimeout(c.f, 60) }

  if (!open) return null
  return (
    <div id="pal" role="dialog" aria-modal="true" aria-label="Command palette" onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
      <div className="pal-box">
        <input id="palInput" ref={inputRef} type="text" placeholder="Drive somewhere, open a project, walk the museum…" aria-label="Command palette search" autoComplete="off" value={q}
          onChange={e => { setQ(e.target.value); setSelI(0) }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setSelI(i => Math.min(items.length - 1, i + 1)) }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setSelI(i => Math.max(0, i - 1)) }
            else if (e.key === 'Enter') { e.preventDefault(); run(selI) }
          }} />
        <ul id="palList" role="listbox">
          {items.map((c, i) => (
            <li key={c.l + c.g} role="option" aria-selected={i === selI}>
              <button type="button" tabIndex={-1} onMouseEnter={() => setSelI(i)} onClick={() => run(i)}><span>{c.l}</span><small>{c.g}</small></button>
            </li>
          ))}
          {!items.length && <li style={{ padding: 16 }} className="muted">Nothing matches.</li>}
        </ul>
      </div>
    </div>
  )
}
