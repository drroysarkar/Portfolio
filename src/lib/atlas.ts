/* ============================================================
   ATLAS — world data for the drivable map.
   Pure data + geometry (no DOM), so it is safe to import anywhere.
   Everything a visitor can park on is built from the real portfolio
   data: 7 journey stops, 20 projects, 31 technologies, contact.
   ============================================================ */

import { PROJECTS, TECH, CHAPTERS, EV, EMAIL, PHONE } from './data'
import { CAT_COLOR, EV_COLOR, HALL_NO } from './colors'

export const WORLD = { w: 3000, h: 2000 }
export type V = [number, number]

export type District = { id: string; name: string; tag: string; x: number; y: number; r: number; color: string; blurb: string }

export const DISTRICTS: District[] = [
  { id: 'nexus', name: 'Core Nexus', tag: 'Start here', x: 1500, y: 1000, r: 230, color: '#c8ff3d', blurb: 'The hub. Every road on the map starts and ends here.' },
  { id: 'journey', name: 'Journey Quarter', tag: '7 stops', x: 620, y: 600, r: 300, color: '#9a8bff', blurb: 'School in Bhagalpur to full-stack work in Lucknow, one stop per pad.' },
  { id: 'museum', name: 'Museum District', tag: '20 exhibits', x: 2330, y: 560, r: 330, color: '#ffb36b', blurb: 'Every project as an exhibit pad. Park on one for the dossier.' },
  { id: 'gardens', name: 'Stack Gardens', tag: '31 technologies', x: 2330, y: 1440, r: 300, color: '#37d7ff', blurb: 'One pad per technology, coloured by how it is evidenced.' },
  { id: 'lab', name: 'Vision Lab', tag: 'AttendanceMaster', x: 780, y: 1390, r: 300, color: '#ff6a3d', blurb: 'Where the handwriting reader lives. Park on the pad to open the Cell Lab.' },
  { id: 'harbour', name: 'Contact Harbour', tag: 'Say hello', x: 1500, y: 260, r: 250, color: '#45e6a0', blurb: 'Email, phone and where I am based.' },
]
export const districtById = new Map(DISTRICTS.map(d => [d.id, d]))

/* ---------- smooth curves ---------- */
function catmull(ctrl: V[], closed: boolean, step = 18): V[] {
  const n = ctrl.length
  const P = (i: number) => (closed ? ctrl[((i % n) + n) % n] : ctrl[Math.max(0, Math.min(n - 1, i))])
  const out: V[] = []
  const segs = closed ? n : n - 1
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2)
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1])
    const m = Math.max(4, Math.round(len / step))
    for (let k = 0; k < m; k++) {
      const t = k / m, t2 = t * t, t3 = t2 * t
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ])
    }
  }
  if (!closed) out.push(ctrl[n - 1])
  return out
}

export type Road = { id: string; pts: V[]; w: number; closed: boolean }

const RING_CTRL: V[] = [
  [620, 640], [900, 430], [1200, 340], [1500, 310], [1800, 340], [2100, 430], [2330, 560], [2500, 820],
  [2520, 1100], [2330, 1440], [2050, 1650], [1500, 1720], [1000, 1650], [640, 1400], [470, 1100], [500, 850],
]
const C: V = [1500, 1000]

export const ROADS: Road[] = [
  { id: 'ring', pts: catmull(RING_CTRL, true), w: 64, closed: true },
  { id: 'n', pts: catmull([C, [1500, 650], [1500, 310]], false), w: 46, closed: false },
  { id: 'e', pts: catmull([C, [1850, 800], [2330, 560]], false), w: 46, closed: false },
  { id: 'se', pts: catmull([C, [1900, 1250], [2330, 1440]], false), w: 46, closed: false },
  { id: 's', pts: catmull([C, [1500, 1360], [1500, 1720]], false), w: 46, closed: false },
  { id: 'sw', pts: catmull([C, [1080, 1230], [640, 1400]], false), w: 46, closed: false },
  { id: 'nw', pts: catmull([C, [1060, 800], [620, 640]], false), w: 46, closed: false },
]
export const RING = ROADS[0].pts

/* ---------- terrain features ---------- */
export type Circle = { x: number; y: number; r: number }
export const LAKES: Circle[] = [
  { x: 1020, y: 1015, r: 105 }, { x: 1980, y: 1015, r: 105 },
]
/* north bay: an ellipse, collided as a chain of circles */
export const BAY = { x: 1500, y: 36, rx: 440, ry: 128 }
export const BAY_CIRCLES: Circle[] = [1100, 1250, 1400, 1550, 1700, 1850, 1950].map(x => ({ x, y: 40, r: 112 }))

export type Rect = { x: number; y: number; w: number; h: number }
export type Landmark = { id: string; rect: Rect; kind: 'museum' | 'lab' | 'tower' }
export const LANDMARKS: Landmark[] = [
  { id: 'museum-hall', rect: { x: 2170, y: 318, w: 320, h: 122 }, kind: 'museum' },
  { id: 'lab-hall', rect: { x: 690, y: 1268, w: 220, h: 112 }, kind: 'lab' },
]
export const LIGHTHOUSE: Circle = { x: 1500, y: 178, r: 17 }

/* ---------- pads: everything you can park on ---------- */
export type SpotKind = 'hub' | 'chapter' | 'project' | 'tech' | 'lab' | 'graph' | 'museum' | 'email' | 'phone' | 'place'
export type Spot = {
  id: string; kind: SpotKind; x: number; y: number; r: number; district: string
  title: string; sub: string; body: string; color: string; ref?: string; glyph: string
}

const evLabel = (e: string[]) => e.map(x => EV[x]).join(' · ')

function buildSpots(): Spot[] {
  const s: Spot[] = []
  s.push({
    id: 'hub', kind: 'hub', x: 1500, y: 1000, r: 56, district: 'nexus', color: '#c8ff3d', glyph: 'DK',
    title: 'Divyanshu Kumar', sub: 'Core Nexus · Full Stack Developer',
    body: 'ASP.NET, C#, SQL Server and React at RMS Technosolution, Lucknow, since August 2024 — and a CRNN that learns to read handwritten copy numbers. Pick any road.',
  })
  /* journey: seven pads on an arc */
  CHAPTERS.forEach((c, i) => {
    const a = (200 + (140 / 6) * i) * (Math.PI / 180)
    const detail = c.score !== undefined ? `${c.score.toFixed(c.dec || 0)}${c.unit ? c.unit : ''} ${c.lbl}` : (c.bullets ? c.bullets[0] : (c.text ?? ''))
    s.push({
      id: 'ch:' + c.id, kind: 'chapter', x: Math.round(620 + Math.cos(a) * 205), y: Math.round(600 + Math.sin(a) * 205), r: 27, district: 'journey',
      color: '#9a8bff', glyph: String(c.n), ref: c.id,
      title: c.title, sub: `${c.km} · ${c.stone}`, body: `${c.where}. ${detail}`,
    })
  })
  /* museum: 20 exhibits on a 5 × 4 grid */
  PROJECTS.forEach((p, i) => {
    const col = i % 5, row = Math.floor(i / 5)
    s.push({
      id: 'pj:' + p.id, kind: 'project', x: 2202 + col * 64, y: 556 + row * 64, r: 24, district: 'museum',
      color: CAT_COLOR[p.c] ?? '#ffb36b', glyph: String(i + 1).padStart(2, '0'), ref: p.id,
      title: p.t, sub: `${HALL_NO[p.c] ?? 'Hall'} · ${p.c}`, body: p.d,
    })
  })
  s.push({
    id: 'museum-door', kind: 'museum', x: 2330, y: 478, r: 34, district: 'museum', color: '#ffb36b', glyph: '⌂',
    title: 'Enter the Museum', sub: 'Walk-through gallery · 8 halls',
    body: 'A first-person walk through all 20 exhibits, hung in frames with museum-style labels.',
  })
  /* gardens: 31 technology pads on a golden-angle spiral, graph pad at the centre */
  s.push({
    id: 'graph', kind: 'graph', x: 2330, y: 1440, r: 36, district: 'gardens', color: '#37d7ff', glyph: '◎',
    title: 'Stack network graph', sub: 'Projects × technologies',
    body: 'Every technology wired to the projects that use it. Drag nodes, click to focus.',
  })
  TECH.forEach((t, i) => {
    const rad = 36 * Math.sqrt(i + 2.4), ang = i * 2.399963
    const ev = t.evidence.includes('exploring') ? 'exploring' : t.evidence.includes('cv') ? 'cv' : 'project'
    s.push({
      id: 'te:' + t.id, kind: 'tech', x: Math.round(2330 + Math.cos(ang) * rad), y: Math.round(1440 + Math.sin(ang) * rad), r: 15, district: 'gardens',
      color: EV_COLOR[ev], glyph: t.name.slice(0, 2), ref: t.id,
      title: t.name, sub: evLabel(t.evidence), body: t.summary,
    })
  })
  s.push({
    id: 'lab', kind: 'lab', x: 780, y: 1448, r: 40, district: 'lab', color: '#ff6a3d', glyph: '▣',
    title: 'AttendanceMaster · Cell Lab', sub: 'Computer vision · in development',
    body: 'Click any handwritten Copy No cell on a specimen sheet and replay the preprocessing the CRNN sees. Reported accuracy is ~20–40% and is not a benchmark.',
  })
  s.push({
    id: 'email', kind: 'email', x: 1400, y: 236, r: 30, district: 'harbour', color: '#45e6a0', glyph: '@',
    title: 'Email', sub: 'Contact Harbour', body: EMAIL,
  })
  s.push({
    id: 'phone', kind: 'phone', x: 1500, y: 214, r: 30, district: 'harbour', color: '#45e6a0', glyph: '☎',
    title: 'Phone', sub: 'Contact Harbour', body: PHONE,
  })
  s.push({
    id: 'place', kind: 'place', x: 1600, y: 236, r: 30, district: 'harbour', color: '#45e6a0', glyph: '⌖',
    title: 'Based in Lucknow, India', sub: 'Contact Harbour', body: 'Originally from Bhagalpur, Bihar. Open to full-stack and computer-vision work.',
  })
  return s
}
export const SPOTS: Spot[] = buildSpots()
export const spotById = new Map(SPOTS.map(s => [s.id, s]))

/* ---------- deterministic scatter: trees, city blocks, shards, boost pads ---------- */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const coarse: V[] = ROADS.flatMap(r => r.pts.filter((_, i) => i % 2 === 0))
export function roadDistance(x: number, y: number, pts: V[] = coarse): number {
  let m = 1e9
  for (const p of pts) { const d = (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y); if (d < m) m = d }
  return Math.sqrt(m)
}

/* plazas: paved areas that replace the road under a district's pads */
export type Plaza = { id: string; shape: 'circle' | 'rect'; x: number; y: number; r?: number; w?: number; h?: number; color: string }
export const PLAZAS: Plaza[] = [
  { id: 'nexus', shape: 'circle', x: 1500, y: 1000, r: 150, color: '#c8ff3d' },
  { id: 'museum', shape: 'rect', x: 2150, y: 512, w: 360, h: 296, color: '#ffb36b' },
  { id: 'gardens', shape: 'circle', x: 2330, y: 1440, r: 232, color: '#37d7ff' },
  { id: 'lab', shape: 'rect', x: 670, y: 1396, w: 220, h: 100, color: '#ff6a3d' },
  { id: 'harbour', shape: 'rect', x: 1330, y: 186, w: 340, h: 94, color: '#45e6a0' },
  { id: 'journey', shape: 'circle', x: 620, y: 610, r: 250, color: '#9a8bff' },
]

function insidePlaza(x: number, y: number, m = 0) {
  for (const p of PLAZAS) {
    if (p.shape === 'circle') { if (Math.hypot(x - p.x, y - p.y) < (p.r ?? 0) + m) return true }
    else if (x > p.x - m && x < p.x + (p.w ?? 0) + m && y > p.y - m && y < p.y + (p.h ?? 0) + m) return true
  }
  return false
}
const nearLake = (x: number, y: number, m: number) =>
  LAKES.some(l => Math.hypot(x - l.x, y - l.y) < l.r + m) || BAY_CIRCLES.some(l => Math.hypot(x - l.x, y - l.y) < l.r + m) ||
  LANDMARKS.some(l => x > l.rect.x - m && x < l.rect.x + l.rect.w + m && y > l.rect.y - m && y < l.rect.y + l.rect.h + m)

export type Block = Rect & { hgt: number; hue: number; lit: number }
export const BLOCKS: Block[] = (() => {
  const r = rng(21), out: Block[] = []
  let tries = 0
  while (out.length < 120 && tries++ < 6000) {
    const w = 44 + r() * 70, h = 44 + r() * 70
    const x = 90 + r() * (WORLD.w - 180 - w), y = 90 + r() * (WORLD.h - 180 - h)
    const cx = x + w / 2, cy = y + h / 2
    if (roadDistance(cx, cy) < 56 + Math.hypot(w, h) / 2) continue
    if (insidePlaza(cx, cy, 70) || nearLake(cx, cy, 80)) continue
    if (DISTRICTS.some(d => d.id !== 'nexus' && Math.hypot(cx - d.x, cy - d.y) < 150)) continue
    if (out.some(b => Math.abs(b.x + b.w / 2 - cx) < (b.w + w) / 2 + 26 && Math.abs(b.y + b.h / 2 - cy) < (b.h + h) / 2 + 26)) continue
    out.push({ x, y, w, h, hgt: 10 + r() * 34, hue: r(), lit: r() })
  }
  return out
})()

export type Tree = { x: number; y: number; r: number; k: number }
export const TREES: Tree[] = (() => {
  const r = rng(77), out: Tree[] = []
  let tries = 0
  while (out.length < 260 && tries++ < 9000) {
    const x = 60 + r() * (WORLD.w - 120), y = 60 + r() * (WORLD.h - 120)
    if (roadDistance(x, y) < 50 || insidePlaza(x, y, 40) || nearLake(x, y, 34)) continue
    if (BLOCKS.some(b => x > b.x - 22 && x < b.x + b.w + 22 && y > b.y - 22 && y < b.y + b.h + 22)) continue
    out.push({ x, y, r: 12 + r() * 14, k: r() })
  }
  return out
})()

export type Shard = { id: number; x: number; y: number }
export const SHARDS: Shard[] = (() => {
  const r = rng(5), out: Shard[] = []
  const pool = ROADS.flatMap(rd => rd.pts.map((p, i) => ({ p, i, rd })))
  let tries = 0
  while (out.length < 36 && tries++ < 4000) {
    const q = pool[Math.floor(r() * pool.length)]
    const [x, y] = q.p
    const ox = (r() - .5) * 26, oy = (r() - .5) * 26
    if (insidePlaza(x, y, 0)) continue
    if (out.some(o => Math.hypot(o.x - x, o.y - y) < 150)) continue
    out.push({ id: out.length, x: x + ox, y: y + oy })
  }
  return out
})()

export type BoostPad = { id: number; x: number; y: number; a: number }
export const BOOSTS: BoostPad[] = (() => {
  const out: BoostPad[] = []
  const place = (road: Road, idx: number) => {
    const n = road.pts.length, i = ((idx % n) + n) % n
    const a = road.pts[i], b = road.pts[(i + 1) % n]
    out.push({ id: out.length, x: a[0], y: a[1], a: Math.atan2(b[1] - a[1], b[0] - a[0]) })
  }
  const ring = ROADS[0]
  ;[22, 70, 118, 165, 215, 262, 300].forEach(i => place(ring, i))
  place(ROADS[1], 22); place(ROADS[3], 30); place(ROADS[4], 26); place(ROADS[6], 28)
  return out.filter(b => !insidePlaza(b.x, b.y, 0))
})()

export const SPAWN = { x: 1500, y: 1150, a: -Math.PI / 2 }
