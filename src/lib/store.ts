'use client'

import { create } from 'zustand'

/* ============================================================
   Global UI state. Everything that more than one component needs
   (overlays, modals, the Atlas drive map, the museum) lives here.
   ============================================================ */

export type Expedition = { id: string; title: string; hint: string; goal: number; xp: number }

export const EXPEDITIONS: Expedition[] = [
  { id: 'districts', title: 'Grand Tour', hint: 'Enter all six districts', goal: 6, xp: 300 },
  { id: 'shards', title: 'Data Hunter', hint: 'Collect data shards', goal: 20, xp: 250 },
  { id: 'boost', title: 'Full Throttle', hint: 'Hit boost pads', goal: 5, xp: 150 },
  { id: 'exhibits', title: 'Curator', hint: 'Visit exhibit pads in the Museum District', goal: 6, xp: 250 },
  { id: 'stack', title: 'Polyglot', hint: 'Visit technology pads in the Stack Gardens', goal: 8, xp: 200 },
  { id: 'story', title: 'Storyteller', hint: 'Drive all seven Journey stops', goal: 7, xp: 250 },
]

type UIState = {
  ready: boolean
  setReady: (v: boolean) => void

  project: string | null
  openProject: (id: string | null) => void

  focus: string | null
  focusTick: number
  focusNode: (id: string) => void
  clearFocus: () => void

  palette: boolean
  setPalette: (v: boolean) => void

  toast: { msg: string; k: number } | null
  showToast: (msg: string) => void

  lab: boolean
  setLab: (v: boolean) => void
  graph: boolean
  setGraph: (v: boolean) => void

  /* --- Atlas drive map --- */
  worldOpen: boolean
  worldWarm: boolean
  jumpFx: number
  enterWorld: (fx?: boolean) => void
  exitWorld: () => void
  teleportTo: string | null
  teleport: (id: string | null) => void

  /* --- Museum --- */
  museumOpen: boolean
  museumAt: string | null          // project id to walk to when the museum opens
  setMuseum: (v: boolean, at?: string | null) => void

  /* --- expeditions (progress is per visit) --- */
  prog: Record<string, number>
  xp: number
  progress: (id: string, n?: number) => void
}

export const useUI = create<UIState>((set, get) => ({
  ready: false,
  setReady: v => set({ ready: v }),

  project: null,
  openProject: id => set({ project: id }),

  focus: null,
  focusTick: 0,
  focusNode: id => set(s => ({ focus: id, focusTick: s.focusTick + 1 })),
  clearFocus: () => set({ focus: null }),

  palette: false,
  setPalette: v => set({ palette: v }),

  toast: null,
  showToast: msg => set(s => ({ toast: { msg, k: (s.toast?.k ?? 0) + 1 } })),

  lab: false,
  setLab: v => set({ lab: v }),
  graph: false,
  setGraph: v => set({ graph: v }),

  worldOpen: false,
  worldWarm: false,
  jumpFx: 0,
  enterWorld: (fx = true) => {
    if (fx) set(s => ({ jumpFx: s.jumpFx + 1 }))
    setTimeout(() => {
      set({ worldOpen: true, worldWarm: true, museumOpen: false })
      document.body.style.overflow = 'hidden'
    }, fx ? 700 : 0)
  },
  exitWorld: () => {
    set({ worldOpen: false })
    document.body.style.overflow = ''
  },
  teleportTo: null,
  teleport: id => set({ teleportTo: id }),

  museumOpen: false,
  museumAt: null,
  setMuseum: (v, at = null) => {
    set({ museumOpen: v, museumAt: v ? at : null, ...(v ? { worldOpen: false } : {}) })
    document.body.style.overflow = v || get().worldOpen ? 'hidden' : ''
  },

  prog: {},
  xp: 0,
  progress: (id, n = 1) => {
    const s = get()
    const ex = EXPEDITIONS.find(e => e.id === id)
    if (!ex) return
    const before = s.prog[id] ?? 0
    if (before >= ex.goal) return
    const after = Math.min(ex.goal, before + n)
    const done = after >= ex.goal
    set({ prog: { ...s.prog, [id]: after }, xp: s.xp + (done ? ex.xp : 0) })
    if (done) setTimeout(() => get().showToast(`${ex.title} complete  ·  +${ex.xp} XP`), 50)
  },
}))

export const go = (id: string) => {
  const e = document.getElementById(id)
  if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export const focusNode = (id: string) => {
  useUI.getState().focusNode(id)
  go('stack')
}
