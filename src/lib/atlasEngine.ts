/* ============================================================
   ATLAS ENGINE — a small top-down driving sim on <canvas>.
   No dependencies. Used twice: fullscreen drive mode (interactive)
   and the live preview in the Atlas section (autopilot).
   ============================================================ */

import {
  WORLD, ROADS, RING, LAKES, BAY, BAY_CIRCLES, LANDMARKS, LIGHTHOUSE, SPOTS, SHARDS, BOOSTS, BLOCKS, TREES,
  PLAZAS, DISTRICTS, SPAWN, roadDistance, spotById, districtById,
  type Spot, type District, type V,
} from './atlas'

type Theme = {
  sea: string; land: string; grid: string; park: string; water: string; shore: string
  roadEdge: string; roadFill: string; roadDash: string; glowA: number
  plaza: string; plazaLine: string
  roof: string; roofEdge: string; shadow: string; win: string
  tree1: string; tree2: string
  ink: string; inkSoft: string; padFill: string
  carBody: string; carGlass: string
}

const NIGHT: Theme = {
  sea: '#04050a', land: '#0a0e18', grid: 'rgba(120,150,255,.05)', park: 'rgba(40,200,150,.07)', water: '#07243a', shore: 'rgba(55,215,255,.55)',
  roadEdge: '#37d7ff', roadFill: '#141a2b', roadDash: 'rgba(200,255,61,.65)', glowA: 1,
  plaza: '#101626', plazaLine: 'rgba(255,255,255,.12)',
  roof: '#161d31', roofEdge: 'rgba(154,139,255,.55)', shadow: 'rgba(0,0,0,.55)', win: 'rgba(255,214,120,.8)',
  tree1: '#0f3b2f', tree2: '#16604a', ink: '#eaf0ff', inkSoft: 'rgba(234,240,255,.55)', padFill: '#0b0f1b',
  carBody: '#c8ff3d', carGlass: '#0a0c06',
}
const DAY: Theme = {
  sea: '#cfd8d6', land: '#efebe0', grid: 'rgba(60,50,120,.06)', park: 'rgba(110,170,90,.16)', water: '#bfdcec', shore: 'rgba(40,120,160,.5)',
  roadEdge: '#bdb6a2', roadFill: '#fbfaf6', roadDash: 'rgba(75,52,255,.5)', glowA: 0,
  plaza: '#e6e1d2', plazaLine: 'rgba(0,0,0,.12)',
  roof: '#f9f7f1', roofEdge: 'rgba(40,30,100,.35)', shadow: 'rgba(40,30,70,.2)', win: 'rgba(75,52,255,.25)',
  tree1: '#7fae6c', tree2: '#9bc67e', ink: '#14151c', inkSoft: 'rgba(20,21,28,.55)', padFill: '#ffffff',
  carBody: '#4b34ff', carGlass: '#101226',
}

export type AtlasStats = { speed: number; boost: number; x: number; y: number; shards: number; drift: boolean }

export type AtlasOpts = {
  canvas: HTMLCanvasElement
  mini?: HTMLCanvasElement | null
  interactive?: boolean
  night?: boolean
  zoom?: number
  onSpot?: (s: Spot | null) => void
  onDistrict?: (d: District) => void
  onShard?: (total: number) => void
  onBoost?: () => void
  onStats?: (s: AtlasStats) => void
  onSkid?: (dt: number) => void
}

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; r: number }
type Npc = { t: number; v: number; c: string; lane: number }

export class Atlas {
  private cv: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private mini: HTMLCanvasElement | null
  private miniCtx: CanvasRenderingContext2D | null = null
  private miniBase: HTMLCanvasElement | null = null
  private opts: AtlasOpts
  private th: Theme
  night: boolean

  /* car */
  x = SPAWN.x; y = SPAWN.y; a = SPAWN.a; vx = 0; vy = 0
  steer = 0; brakeOn = false
  boostT = 0; boostCd = 0; shake = 0
  paused = false
  private keys = new Set<string>()
  private stick = { x: 0, y: 0 }
  private touchBrake = false; private touchBoost = false

  /* camera */
  private cx = SPAWN.x; private cy = SPAWN.y; private zoomUser = 1; private baseZoom: number

  private W = 0; private H = 0; private dpr = 1
  private raf = 0; private last = 0; private time = 0; private frame = 0
  private visible = true
  private road: Path2D[] = []
  private ringIdx = 0
  private parts: Particle[] = []
  private skids: { x1: number; y1: number; x2: number; y2: number; t: number }[] = []
  private lastSkid: ({ x: number; y: number } | null)[] = [null, null]
  private collected = new Set<number>()
  private current: Spot | null = null
  private curDistrict: string | null = null
  private flash = 0
  private npcs: Npc[]
  private autopilot: boolean
  private statT = 0
  private grid = new Map<number, { k: 'c' | 'r'; x: number; y: number; r?: number; w?: number; h?: number }[]>()
  private cleanup: (() => void)[] = []
  private io: IntersectionObserver | null = null

  constructor(opts: AtlasOpts) {
    this.opts = opts
    this.cv = opts.canvas
    this.ctx = opts.canvas.getContext('2d')!
    this.mini = opts.mini ?? null
    this.miniCtx = this.mini ? this.mini.getContext('2d') : null
    this.night = opts.night ?? true
    this.th = this.night ? NIGHT : DAY
    this.autopilot = !opts.interactive
    this.baseZoom = opts.zoom ?? 1
    this.npcs = [
      { t: 0.08, v: 190, c: '#ff6a3d', lane: -9 }, { t: 0.31, v: 230, c: '#37d7ff', lane: 9 }, { t: 0.55, v: 170, c: '#9a8bff', lane: -9 },
      { t: 0.77, v: 210, c: '#ffb36b', lane: 9 }, { t: 0.93, v: 250, c: '#45e6a0', lane: -9 },
    ]
    this.buildPaths()
    this.buildGrid()
    this.buildMiniBase()
    if (this.autopilot) { this.x = RING[40][0]; this.y = RING[40][1]; this.a = Math.atan2(RING[41][1] - RING[40][1], RING[41][0] - RING[40][0]); this.cx = this.x; this.cy = this.y; this.ringIdx = 40 }
    this.resize()
    const ro = new ResizeObserver(() => this.resize()); ro.observe(this.cv)
    this.cleanup.push(() => ro.disconnect())
    if (opts.interactive) this.bindKeys()
    this.io = new IntersectionObserver(es => { this.visible = es[0].isIntersecting }); this.io.observe(this.cv)
    this.cleanup.push(() => this.io?.disconnect())
  }

  /* ---------- lifecycle ---------- */
  start() {
    if (this.raf) return
    this.last = performance.now()
    const loop = (t: number) => {
      this.raf = requestAnimationFrame(loop)
      const dt = Math.min(0.05, (t - this.last) / 1000)
      this.last = t
      if (!this.visible) return
      if (!this.paused) this.update(dt)
      this.draw()
    }
    this.raf = requestAnimationFrame(loop)
  }
  stop() { cancelAnimationFrame(this.raf); this.raf = 0 }
  destroy() { this.stop(); this.cleanup.forEach(f => f()); this.cleanup = [] }

  setNight(n: boolean) { this.night = n; this.th = n ? NIGHT : DAY; this.buildMiniBase() }
  setStick(x: number, y: number) { this.stick.x = x; this.stick.y = y }
  setBrake(b: boolean) { this.touchBrake = b }
  setBoost(b: boolean) { this.touchBoost = b }
  zoomBy(f: number) { this.zoomUser = Math.max(0.55, Math.min(1.7, this.zoomUser * f)) }
  get spot() { return this.current }
  get shardCount() { return this.collected.size }

  teleport(id: string) {
    const d = districtById.get(id)
    const s = spotById.get(id)
    let tx = 0, ty = 0, ta = -Math.PI / 2
    if (d) {
      const hub = d.id === 'nexus'
      tx = hub ? SPAWN.x : d.x; ty = hub ? SPAWN.y : d.y
      const adj: Record<string, V> = { museum: [2330, 760], gardens: [2330, 1260], journey: [620, 780], lab: [780, 1520], harbour: [1500, 330] }
      if (adj[d.id]) { tx = adj[d.id][0]; ty = adj[d.id][1] }
      ta = Math.atan2(1000 - ty, 1500 - tx)
    } else if (s) { tx = s.x; ty = s.y + s.r + 60; ta = -Math.PI / 2 }
    else return
    this.x = tx; this.y = ty; this.a = ta; this.vx = this.vy = 0; this.cx = tx; this.cy = ty; this.flash = 1
    this.skids.length = 0; this.lastSkid = [null, null]
    for (let i = 0; i < 26; i++) this.spark(tx, ty, this.th.carBody)
  }

  resize() {
    const r = this.cv.getBoundingClientRect()
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    this.W = Math.max(1, r.width); this.H = Math.max(1, r.height)
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr)
  }

  /* ---------- precompute ---------- */
  private buildPaths() {
    this.road = ROADS.map(r => {
      const p = new Path2D()
      r.pts.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])))
      if (r.closed) p.closePath()
      return p
    })
  }

  private addObs(o: { k: 'c' | 'r'; x: number; y: number; r?: number; w?: number; h?: number }) {
    const x0 = o.k === 'c' ? o.x - (o.r ?? 0) : o.x, x1 = o.k === 'c' ? o.x + (o.r ?? 0) : o.x + (o.w ?? 0)
    const y0 = o.k === 'c' ? o.y - (o.r ?? 0) : o.y, y1 = o.k === 'c' ? o.y + (o.r ?? 0) : o.y + (o.h ?? 0)
    for (let gx = Math.floor(x0 / 200); gx <= Math.floor(x1 / 200); gx++)
      for (let gy = Math.floor(y0 / 200); gy <= Math.floor(y1 / 200); gy++) {
        const key = gx * 1000 + gy
        const arr = this.grid.get(key)
        if (arr) arr.push(o); else this.grid.set(key, [o])
      }
  }
  private buildGrid() {
    LAKES.forEach(l => this.addObs({ k: 'c', x: l.x, y: l.y, r: l.r - 6 }))
    BAY_CIRCLES.forEach(l => this.addObs({ k: 'c', x: l.x, y: l.y, r: l.r - 6 }))
    this.addObs({ k: 'c', x: LIGHTHOUSE.x, y: LIGHTHOUSE.y, r: LIGHTHOUSE.r })
    LANDMARKS.forEach(l => this.addObs({ k: 'r', x: l.rect.x, y: l.rect.y, w: l.rect.w, h: l.rect.h }))
    BLOCKS.forEach(b => this.addObs({ k: 'r', x: b.x, y: b.y, w: b.w, h: b.h }))
    TREES.forEach(t => this.addObs({ k: 'c', x: t.x, y: t.y, r: t.r * 0.45 }))
  }

  private buildMiniBase() {
    if (!this.mini) return
    const W = this.mini.width, H = this.mini.height, s = W / WORLD.w
    const c = document.createElement('canvas'); c.width = W; c.height = H
    const g = c.getContext('2d')!
    g.fillStyle = this.night ? '#070a12' : '#e7e3d6'; g.fillRect(0, 0, W, H)
    g.fillStyle = this.night ? '#0a2a40' : '#b9d6e6'
    ;[...LAKES, ...BAY_CIRCLES].forEach(l => { g.beginPath(); g.arc(l.x * s, l.y * s, l.r * s, 0, 6.3); g.fill() })
    g.lineCap = 'round'; g.lineJoin = 'round'
    ROADS.forEach(r => {
      g.beginPath(); r.pts.forEach((p, i) => (i ? g.lineTo(p[0] * s, p[1] * s) : g.moveTo(p[0] * s, p[1] * s)))
      if (r.closed) g.closePath()
      g.strokeStyle = this.night ? '#2a3a66' : '#bdb6a2'; g.lineWidth = r.w * s * 1.3; g.stroke()
    })
    DISTRICTS.forEach(d => { g.fillStyle = d.color; g.globalAlpha = .9; g.beginPath(); g.arc(d.x * s, d.y * s, 4.2, 0, 6.3); g.fill(); g.globalAlpha = 1 })
    this.miniBase = c
  }

  /* ---------- input ---------- */
  private bindKeys() {
    const ok = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      return !(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable))
    }
    const down = (e: KeyboardEvent) => {
      if (this.paused || !ok(e)) return
      const k = e.code
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(k)) e.preventDefault()
      this.keys.add(k)
      if (k === 'Equal' || k === 'NumpadAdd') this.zoomBy(1.15)
      if (k === 'Minus' || k === 'NumpadSubtract') this.zoomBy(1 / 1.15)
    }
    const up = (e: KeyboardEvent) => { this.keys.delete(e.code) }
    const blur = () => this.keys.clear()
    const wheel = (e: WheelEvent) => { if (this.paused) return; this.zoomBy(e.deltaY < 0 ? 1.08 : 1 / 1.08) }
    addEventListener('keydown', down); addEventListener('keyup', up); addEventListener('blur', blur)
    this.cv.addEventListener('wheel', wheel, { passive: true })
    this.cleanup.push(() => { removeEventListener('keydown', down); removeEventListener('keyup', up); removeEventListener('blur', blur); this.cv.removeEventListener('wheel', wheel) })
  }
  private key(...c: string[]) { return c.some(k => this.keys.has(k)) }

  /* ---------- simulation ---------- */
  private update(dt: number) {
    this.time += dt
    let thr = 0, str = 0, brake = false, wantBoost = false
    if (this.autopilot) {
      const n = RING.length
      let best = 1e9, bi = this.ringIdx
      for (let k = -6; k < 22; k++) {
        const i = (((this.ringIdx + k) % n) + n) % n
        const d = (RING[i][0] - this.x) ** 2 + (RING[i][1] - this.y) ** 2
        if (d < best) { best = d; bi = i }
      }
      this.ringIdx = bi
      const tg = RING[(bi + 9) % n]
      let da = Math.atan2(tg[1] - this.y, tg[0] - this.x) - this.a
      while (da > Math.PI) da -= 2 * Math.PI
      while (da < -Math.PI) da += 2 * Math.PI
      str = Math.max(-1, Math.min(1, da * 2.4)); thr = Math.abs(da) > 0.5 ? 0.45 : 0.85
    } else {
      thr = (this.key('KeyW', 'ArrowUp') ? 1 : 0) - (this.key('KeyS', 'ArrowDown') ? 0.7 : 0) + (-this.stick.y)
      str = (this.key('KeyD', 'ArrowRight') ? 1 : 0) - (this.key('KeyA', 'ArrowLeft') ? 1 : 0) + this.stick.x
      brake = this.key('Space') || this.touchBrake
      wantBoost = this.key('ShiftLeft', 'ShiftRight') || this.touchBoost
      thr = Math.max(-1, Math.min(1, thr)); str = Math.max(-1, Math.min(1, str))
    }
    this.steer += (str - this.steer) * Math.min(1, dt * 9)
    this.brakeOn = brake || thr < -0.05

    const fx = Math.cos(this.a), fy = Math.sin(this.a), rx = -fy, ry = fx
    let vF = this.vx * fx + this.vy * fy, vL = this.vx * rx + this.vy * ry

    const onRoad = roadDistance(this.x, this.y) < 34 || this.inPlaza(this.x, this.y)
    const cap = (onRoad ? 520 : 300) * (this.boostT > 0 ? 1.6 : 1)
    if (wantBoost && this.boostT <= 0 && this.boostCd <= 0 && Math.abs(vF) > 120) { this.boostT = 0.9; this.boostCd = 2.6; this.shake = 0.3 }
    this.boostT = Math.max(0, this.boostT - dt); this.boostCd = Math.max(0, this.boostCd - dt)

    if (thr > 0) vF += thr * (this.boostT > 0 ? 1100 : 600) * dt
    else if (thr < 0) vF += thr * (vF > 20 ? 1500 : 380) * dt
    if (brake) vF -= Math.sign(vF) * Math.min(Math.abs(vF), 1500 * dt)
    if (thr === 0) vF *= Math.exp(-0.9 * dt)
    vF = Math.max(-170, Math.min(cap, vF))
    if (!onRoad && vF > cap) vF = cap
    const grip = brake ? 1.4 : onRoad ? 7.5 : 3.5
    vL *= Math.exp(-grip * dt)

    const turn = (2.9 * Math.min(1, Math.abs(vF) / 140)) / (1 + Math.abs(vF) / 800)
    this.a += this.steer * turn * dt * (vF >= 0 ? 1 : -1) * (brake && Math.abs(vF) > 150 ? 1.5 : 1)

    const fx2 = Math.cos(this.a), fy2 = Math.sin(this.a)
    this.vx = fx2 * vF + -fy2 * vL; this.vy = fy2 * vF + fx2 * vL
    this.x += this.vx * dt; this.y += this.vy * dt

    /* world bounds */
    const m = 50
    if (this.x < m) { this.x = m; this.vx = Math.abs(this.vx) * 0.3 }
    if (this.x > WORLD.w - m) { this.x = WORLD.w - m; this.vx = -Math.abs(this.vx) * 0.3 }
    if (this.y < m) { this.y = m; this.vy = Math.abs(this.vy) * 0.3 }
    if (this.y > WORLD.h - m) { this.y = WORLD.h - m; this.vy = -Math.abs(this.vy) * 0.3 }
    this.collide()

    const speed = Math.hypot(this.vx, this.vy)
    const drift = Math.abs(vL) > 95 && speed > 150
    /* skid marks + particles */
    if (drift || (brake && speed > 220)) {
      const wheels: [number, number][] = [[-8, 0], [8, 1]]
      for (const [sd, wi] of wheels) {
        const px = this.x - Math.cos(this.a) * 12 - Math.sin(this.a) * sd, py = this.y - Math.sin(this.a) * 12 + Math.cos(this.a) * sd
        const lp = this.lastSkid[wi]
        if (lp) this.skids.push({ x1: lp.x, y1: lp.y, x2: px, y2: py, t: this.time })
        this.lastSkid[wi] = { x: px, y: py }
      }
      this.opts.onSkid?.(dt)
    } else this.lastSkid = [null, null]
    if (this.skids.length > 600) this.skids.splice(0, this.skids.length - 600)
    if (!onRoad && speed > 90 && Math.random() < 0.5) this.parts.push({ x: this.x - fx2 * 14, y: this.y - fy2 * 14, vx: -this.vx * 0.1 + (Math.random() - .5) * 40, vy: -this.vy * 0.1 + (Math.random() - .5) * 40, life: 0.6, max: 0.6, c: this.night ? 'rgba(120,150,255,.35)' : 'rgba(120,100,60,.35)', r: 4 + Math.random() * 4 })
    if (this.boostT > 0) for (let i = 0; i < 2; i++) this.parts.push({ x: this.x - fx2 * 18, y: this.y - fy2 * 18, vx: -fx2 * 160 + (Math.random() - .5) * 60, vy: -fy2 * 160 + (Math.random() - .5) * 60, life: 0.35, max: 0.35, c: i ? '#ffb36b' : '#ff6a3d', r: 4 + Math.random() * 3 })
    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt }
    this.parts = this.parts.filter(p => p.life > 0)
    this.shake = Math.max(0, this.shake - dt)
    this.flash = Math.max(0, this.flash - dt * 2.2)

    /* NPC traffic */
    const L = RING.length
    for (const n of this.npcs) n.t = (n.t + (n.v * dt) / (L * 18)) % 1

    /* pickups */
    if (!this.autopilot) {
      for (const s of SHARDS) {
        if (this.collected.has(s.id)) continue
        if (Math.hypot(s.x - this.x, s.y - this.y) < 30) {
          this.collected.add(s.id)
          for (let i = 0; i < 14; i++) this.spark(s.x, s.y, '#c8ff3d')
          this.opts.onShard?.(this.collected.size)
        }
      }
      if (this.boostCd <= 1.9) {
        for (const b of BOOSTS) {
          if (Math.hypot(b.x - this.x, b.y - this.y) < 34) { this.boostT = 1.5; this.boostCd = 2.4; this.shake = 0.35; this.vx += Math.cos(b.a) * 120; this.vy += Math.sin(b.a) * 120; this.opts.onBoost?.(); break }
        }
      }
      /* spots */
      let near: Spot | null = null, nd = 1e9
      for (const s of SPOTS) {
        const d = Math.hypot(s.x - this.x, s.y - this.y)
        if (d < s.r + 6 && d < nd) { nd = d; near = s }
      }
      if (near !== this.current) { this.current = near; this.opts.onSpot?.(near) }
      let dist: District | null = null
      for (const d of DISTRICTS) if (Math.hypot(d.x - this.x, d.y - this.y) < d.r * (d.id === 'nexus' ? 0.75 : 0.85)) { dist = d; break }
      if (dist && dist.id !== this.curDistrict) { this.curDistrict = dist.id; this.opts.onDistrict?.(dist) }
      else if (!dist) this.curDistrict = null
      this.statT += dt
      if (this.statT > 0.1) {
        this.statT = 0
        this.opts.onStats?.({ speed, boost: this.boostT > 0 ? 1 : 1 - Math.min(1, this.boostCd / 2.6), x: this.x, y: this.y, shards: this.collected.size, drift })
      }
    }
    /* camera */
    const look = this.autopilot ? 0.2 : 0.38
    const tx = this.x + this.vx * look, ty = this.y + this.vy * look
    const k = 1 - Math.exp(-dt * 5)
    this.cx += (tx - this.cx) * k; this.cy += (ty - this.cy) * k
  }

  private inPlaza(x: number, y: number) {
    for (const p of PLAZAS) {
      if (p.shape === 'circle') { if (Math.hypot(x - p.x, y - p.y) < (p.r ?? 0)) return true }
      else if (x > p.x && x < p.x + (p.w ?? 0) && y > p.y && y < p.y + (p.h ?? 0)) return true
    }
    return false
  }

  private collide() {
    const R = 13
    const gx = Math.floor(this.x / 200), gy = Math.floor(this.y / 200)
    for (let ax = gx - 1; ax <= gx + 1; ax++)
      for (let ay = gy - 1; ay <= gy + 1; ay++) {
        const arr = this.grid.get(ax * 1000 + ay)
        if (!arr) continue
        for (const o of arr) {
          let nx = 0, ny = 0, pen = 0
          if (o.k === 'c') {
            const dx = this.x - o.x, dy = this.y - o.y, d = Math.hypot(dx, dy) || 0.001
            pen = (o.r ?? 0) + R - d
            if (pen > 0) { nx = dx / d; ny = dy / d }
          } else {
            const cx = Math.max(o.x, Math.min(this.x, o.x + (o.w ?? 0))), cy = Math.max(o.y, Math.min(this.y, o.y + (o.h ?? 0)))
            let dx = this.x - cx, dy = this.y - cy, d = Math.hypot(dx, dy)
            if (d < 0.001) { dx = this.x - (o.x + (o.w ?? 0) / 2); dy = this.y - (o.y + (o.h ?? 0) / 2); d = Math.hypot(dx, dy) || 1 }
            pen = R - d
            if (pen > 0) { nx = dx / d; ny = dy / d }
          }
          if (pen > 0) {
            this.x += nx * pen; this.y += ny * pen
            const vn = this.vx * nx + this.vy * ny
            if (vn < 0) {
              this.vx -= 1.3 * vn * nx; this.vy -= 1.3 * vn * ny
              this.vx *= 0.88; this.vy *= 0.88
              if (-vn > 120) { this.shake = Math.min(0.35, -vn / 900); for (let i = 0; i < 5; i++) this.spark(this.x - nx * R, this.y - ny * R, '#ffb36b') }
            }
          }
        }
      }
  }

  private spark(x: number, y: number, c: string) {
    const a = Math.random() * 6.283, s = 60 + Math.random() * 180
    this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5, max: 0.5, c, r: 2 + Math.random() * 2.5 })
  }

  /* ---------- rendering ---------- */
  private draw() {
    const c = this.ctx, th = this.th, W = this.W, H = this.H
    const speed = Math.hypot(this.vx, this.vy)
    const dzoom = 1 - Math.min(0.14, speed / 4000)
    const scale = Math.max(0.3, (Math.min(W, H) / 760) * this.baseZoom * this.zoomUser * dzoom * (W < 560 ? 1.1 : 1))
    const sx = this.shake > 0 ? (Math.random() - .5) * this.shake * 18 : 0, sy = this.shake > 0 ? (Math.random() - .5) * this.shake * 18 : 0
    const ox = W / 2 - this.cx * scale + sx, oy = H / 2 - this.cy * scale + sy
    const vx0 = (-ox) / scale, vy0 = (-oy) / scale, vx1 = vx0 + W / scale, vy1 = vy0 + H / scale
    const t = this.time

    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    c.fillStyle = th.sea; c.fillRect(0, 0, W, H)
    c.setTransform(this.dpr * scale, 0, 0, this.dpr * scale, ox * this.dpr, oy * this.dpr)
    const inView = (x: number, y: number, r: number) => x + r > vx0 && x - r < vx1 && y + r > vy0 && y - r < vy1

    /* land */
    c.fillStyle = th.land
    c.beginPath(); c.roundRect(0, 0, WORLD.w, WORLD.h, 60); c.fill()
    c.strokeStyle = this.night ? 'rgba(55,215,255,.28)' : 'rgba(75,52,255,.25)'; c.lineWidth = 3; c.stroke()
    /* grid */
    c.strokeStyle = th.grid; c.lineWidth = 1 / scale * 1.2
    c.beginPath()
    for (let gx = Math.max(0, Math.floor(vx0 / 100) * 100); gx <= Math.min(WORLD.w, vx1); gx += 100) { c.moveTo(gx, Math.max(0, vy0)); c.lineTo(gx, Math.min(WORLD.h, vy1)) }
    for (let gy = Math.max(0, Math.floor(vy0 / 100) * 100); gy <= Math.min(WORLD.h, vy1); gy += 100) { c.moveTo(Math.max(0, vx0), gy); c.lineTo(Math.min(WORLD.w, vx1), gy) }
    c.stroke()
    /* parks */
    c.fillStyle = th.park
    for (const [px, py, pr] of [[1250, 640, 170], [1760, 700, 160], [1250, 1380, 170], [1760, 1330, 150], [260, 300, 200], [2800, 1000, 190], [300, 1750, 190], [2750, 250, 150], [2700, 1800, 190], [1500, 1860, 160]] as number[][]) {
      if (inView(px, py, pr)) { c.beginPath(); c.arc(px, py, pr, 0, 6.3); c.fill() }
    }
    /* water */
    c.fillStyle = th.water
    for (const l of LAKES) if (inView(l.x, l.y, l.r + 20)) { c.beginPath(); c.arc(l.x, l.y, l.r, 0, 6.3); c.fill() }
    if (inView(BAY.x, BAY.y, 600)) { c.beginPath(); c.ellipse(BAY.x, BAY.y, BAY.rx, BAY.ry, 0, 0, 6.3); c.fill() }
    c.strokeStyle = th.shore; c.lineWidth = 2.2
    for (const l of LAKES) if (inView(l.x, l.y, l.r + 40)) {
      c.beginPath(); c.arc(l.x, l.y, l.r, 0, 6.3); c.stroke()
      c.globalAlpha = .35; c.beginPath(); c.arc(l.x, l.y, l.r * (0.55 + 0.1 * Math.sin(t * 1.3)), 0, 6.3); c.stroke(); c.globalAlpha = 1
    }
    if (inView(BAY.x, BAY.y, 600)) { c.beginPath(); c.ellipse(BAY.x, BAY.y, BAY.rx, BAY.ry, 0, 0, 6.3); c.stroke() }

    /* roads */
    c.lineCap = 'round'; c.lineJoin = 'round'
    ROADS.forEach((r, i) => {
      const p = this.road[i]
      if (th.glowA) {
        c.strokeStyle = 'rgba(55,215,255,.09)'; c.lineWidth = r.w + 26; c.stroke(p)
        c.strokeStyle = 'rgba(55,215,255,.16)'; c.lineWidth = r.w + 12; c.stroke(p)
      }
      c.strokeStyle = th.roadEdge; c.lineWidth = r.w + 5; c.globalAlpha = th.glowA ? 0.75 : 1; c.stroke(p); c.globalAlpha = 1
      c.strokeStyle = th.roadFill; c.lineWidth = r.w; c.stroke(p)
    })
    c.setLineDash([22, 22]); c.lineDashOffset = -t * 22; c.lineWidth = 2.5; c.strokeStyle = th.roadDash
    ROADS.forEach((_, i) => c.stroke(this.road[i]))
    c.setLineDash([])

    /* plazas */
    for (const p of PLAZAS) {
      const cxp = p.shape === 'circle' ? p.x : p.x + (p.w ?? 0) / 2, cyp = p.shape === 'circle' ? p.y : p.y + (p.h ?? 0) / 2
      if (!inView(cxp, cyp, (p.r ?? Math.max(p.w ?? 0, p.h ?? 0)) + 30)) continue
      c.beginPath()
      if (p.shape === 'circle') c.arc(p.x, p.y, p.r ?? 0, 0, 6.3); else c.roundRect(p.x, p.y, p.w ?? 0, p.h ?? 0, 36)
      c.fillStyle = th.plaza; c.fill()
      c.strokeStyle = p.color; c.globalAlpha = this.night ? .5 : .65; c.lineWidth = 3; c.stroke(); c.globalAlpha = 1
      c.strokeStyle = th.plazaLine; c.lineWidth = 1.2
      if (p.shape === 'circle') { for (const k of [0.8, 0.6]) { c.beginPath(); c.arc(p.x, p.y, (p.r ?? 0) * k, 0, 6.3); c.stroke() } }
    }
    this.drawNexus(c)

    /* journey path: a glowing thread through the seven stops */
    const chs = SPOTS.filter(s => s.kind === 'chapter')
    if (chs.length && inView(620, 600, 340)) {
      c.beginPath(); chs.forEach((s, i) => (i ? c.lineTo(s.x, s.y) : c.moveTo(s.x, s.y)))
      c.strokeStyle = '#9a8bff'; c.globalAlpha = .55; c.lineWidth = 3; c.setLineDash([4, 10]); c.lineDashOffset = -t * 18; c.stroke(); c.setLineDash([]); c.globalAlpha = 1
    }

    /* skids */
    c.lineWidth = 3.2; c.lineCap = 'butt'
    for (const s of this.skids) {
      const age = t - s.t
      if (age > 14) continue
      c.strokeStyle = this.night ? `rgba(200,255,61,${0.22 * (1 - age / 14)})` : `rgba(30,25,80,${0.3 * (1 - age / 14)})`
      c.beginPath(); c.moveTo(s.x1, s.y1); c.lineTo(s.x2, s.y2); c.stroke()
    }
    c.lineCap = 'round'

    /* boost pads */
    for (const b of BOOSTS) {
      if (!inView(b.x, b.y, 60)) continue
      c.save(); c.translate(b.x, b.y); c.rotate(b.a)
      c.fillStyle = this.night ? 'rgba(255,179,107,.14)' : 'rgba(232,80,31,.12)'; c.beginPath(); c.roundRect(-30, -26, 60, 52, 10); c.fill()
      for (let i = 0; i < 3; i++) {
        const a = (Math.sin(t * 6 - i * 0.9) + 1) / 2
        c.strokeStyle = this.night ? '#ffb36b' : '#e8501f'; c.globalAlpha = 0.25 + a * 0.75; c.lineWidth = 4
        c.beginPath(); c.moveTo(-16 + i * 14, -14); c.lineTo(-6 + i * 14, 0); c.lineTo(-16 + i * 14, 14); c.stroke()
      }
      c.restore(); c.globalAlpha = 1
    }

    /* pads */
    this.drawPads(c, scale, vx0, vy0, vx1, vy1)

    /* NPC cars (ring traffic) */
    const L = RING.length
    for (const n of this.npcs) {
      const f = n.t * L, i = Math.floor(f) % L, j = (i + 1) % L
      const px = RING[i][0] + (RING[j][0] - RING[i][0]) * (f - Math.floor(f)), py = RING[i][1] + (RING[j][1] - RING[i][1]) * (f - Math.floor(f))
      const ang = Math.atan2(RING[j][1] - RING[i][1], RING[j][0] - RING[i][0])
      if (!inView(px, py, 40)) continue
      this.drawCar(c, px - Math.sin(ang) * n.lane, py + Math.cos(ang) * n.lane, ang, n.c, 0.8, false, false)
    }

    /* buildings, landmarks, trees */
    this.drawBuildings(c, inView)
    this.drawTrees(c, inView)

    /* shards */
    if (!this.autopilot) {
      for (const s of SHARDS) {
        if (this.collected.has(s.id) || !inView(s.x, s.y, 30)) continue
        const bob = Math.sin(t * 3 + s.id) * 3
        c.save(); c.translate(s.x, s.y + bob); c.rotate(t * 1.5 + s.id)
        c.fillStyle = this.night ? 'rgba(200,255,61,.2)' : 'rgba(75,52,255,.14)'; c.beginPath(); c.arc(0, 0, 17, 0, 6.3); c.fill()
        c.fillStyle = this.night ? '#c8ff3d' : '#4b34ff'
        c.beginPath(); c.moveTo(0, -9); c.lineTo(7, 0); c.lineTo(0, 9); c.lineTo(-7, 0); c.closePath(); c.fill()
        c.restore()
      }
    }

    /* car + particles */
    for (const p of this.parts) { c.globalAlpha = Math.max(0, p.life / p.max); c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, p.r * (0.6 + 0.4 * p.life / p.max), 0, 6.3); c.fill() }
    c.globalAlpha = 1
    this.drawCar(c, this.x, this.y, this.a, th.carBody, 1, true, this.brakeOn)

    /* district names, floating above everything in world space */
    for (const d of DISTRICTS) {
      if (!inView(d.x, d.y, 400)) continue
      const dist = Math.hypot(d.x - this.x, d.y - this.y)
      const al = Math.max(0, Math.min(1, (dist - 120) / 260)) * 0.9
      if (al <= 0.02) continue
      const ty = d.id === 'harbour' ? d.y - 150 : d.id === 'museum' ? d.y - 330 : d.id === 'nexus' ? d.y - 190 : d.id === 'lab' ? d.y - 220 : d.id === 'journey' ? d.y - 290 : d.y - 270
      c.globalAlpha = al; c.textAlign = 'center'
      c.fillStyle = th.ink; c.font = '700 34px "Bricolage Grotesque", system-ui, sans-serif'
      c.fillText(d.name, d.x, ty)
      c.fillStyle = d.color; c.font = '500 14px "JetBrains Mono", monospace'
      c.fillText(d.tag.toUpperCase(), d.x, ty + 24)
      c.globalAlpha = 1
    }

    /* headlight cone, additive */
    if (this.night) {
      c.save(); c.translate(this.x, this.y); c.rotate(this.a); c.globalCompositeOperation = 'lighter'
      const g = c.createRadialGradient(18, 0, 4, 150, 0, 210)
      g.addColorStop(0, 'rgba(255,245,200,.34)'); g.addColorStop(1, 'rgba(255,245,200,0)')
      c.fillStyle = g; c.beginPath(); c.moveTo(16, -7); c.lineTo(230, -92); c.lineTo(230, 92); c.lineTo(16, 7); c.closePath(); c.fill()
      c.restore()
    }

    /* screen-space finish: vignette + teleport flash */
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    const vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75)
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, this.night ? 'rgba(2,3,8,.7)' : 'rgba(60,50,90,.18)')
    c.fillStyle = vg; c.fillRect(0, 0, W, H)
    if (this.boostT > 0) { c.fillStyle = 'rgba(255,179,107,.07)'; c.fillRect(0, 0, W, H) }
    if (this.flash > 0) { c.fillStyle = `rgba(255,255,255,${this.flash * 0.5})`; c.fillRect(0, 0, W, H) }

    this.frame++
    if (this.mini && this.miniCtx && this.frame % 4 === 0) this.drawMini(scale, vx0, vy0, vx1, vy1)
  }

  private drawNexus(c: CanvasRenderingContext2D) {
    const t = this.time, th = this.th
    if (Math.hypot(1500 - this.cx, 1000 - this.cy) > 700) return
    c.save(); c.translate(1500, 1000)
    c.strokeStyle = this.night ? '#c8ff3d' : '#4b34ff'; c.lineWidth = 3
    c.rotate(t * 0.25); c.setLineDash([40, 22]); c.beginPath(); c.arc(0, 0, 112, 0, 6.3); c.stroke()
    c.rotate(-t * 0.7); c.setLineDash([10, 18]); c.globalAlpha = .6; c.beginPath(); c.arc(0, 0, 92, 0, 6.3); c.stroke()
    c.setLineDash([]); c.globalAlpha = 1
    c.restore()
    void th
  }

  private drawPads(c: CanvasRenderingContext2D, scale: number, vx0: number, vy0: number, vx1: number, vy1: number) {
    const th = this.th, t = this.time
    for (const s of SPOTS) {
      if (s.x < vx0 - 80 || s.x > vx1 + 80 || s.y < vy0 - 80 || s.y > vy1 + 80) continue
      const on = this.current === s
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.4 + s.x * 0.01)
      /* halo */
      c.beginPath(); c.arc(s.x, s.y, s.r + 8 + pulse * 5, 0, 6.3)
      c.fillStyle = s.color; c.globalAlpha = on ? 0.3 : 0.1 + pulse * 0.06; c.fill(); c.globalAlpha = 1
      /* body */
      c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.3); c.fillStyle = th.padFill; c.fill()
      c.lineWidth = on ? 4 : 2.6; c.strokeStyle = s.color; c.stroke()
      if (s.kind === 'chapter' || s.kind === 'project') { c.beginPath(); c.arc(s.x, s.y, s.r - 6, 0, 6.3); c.fillStyle = s.color; c.globalAlpha = this.night ? 0.2 : 0.18; c.fill(); c.globalAlpha = 1 }
      /* glyph */
      c.fillStyle = th.ink; c.textAlign = 'center'; c.textBaseline = 'middle'
      const fs = s.kind === 'tech' ? 10.5 : s.kind === 'chapter' ? 16 : s.kind === 'project' ? 13 : 18
      c.font = `700 ${fs}px "JetBrains Mono", monospace`
      c.fillText(s.glyph, s.x, s.y + 0.5)
      c.textBaseline = 'alphabetic'
      /* label when close enough to read */
      const d = Math.hypot(s.x - this.x, s.y - this.y)
      if ((s.kind === 'tech' && d < 60) || (s.kind === 'project' && d < 70) || (s.kind !== 'tech' && s.kind !== 'project' && d < 340 * (1 / Math.max(0.5, scale)))) {
        c.font = `600 ${s.kind === 'tech' ? 11 : 13}px "Hanken Grotesk", system-ui, sans-serif`
        const label = s.kind === 'project' || s.kind === 'tech' ? s.title : s.title
        const w = c.measureText(label).width + 16
        const ly = s.y + s.r + 20
        c.fillStyle = this.night ? 'rgba(6,8,16,.82)' : 'rgba(255,255,255,.92)'
        c.beginPath(); c.roundRect(s.x - w / 2, ly - 13, w, 20, 10); c.fill()
        c.strokeStyle = s.color; c.globalAlpha = .6; c.lineWidth = 1; c.stroke(); c.globalAlpha = 1
        c.fillStyle = th.ink; c.fillText(label, s.x, ly + 1)
      }
    }
    c.textAlign = 'start'
  }

  private drawBuildings(c: CanvasRenderingContext2D, inView: (x: number, y: number, r: number) => boolean) {
    const th = this.th, t = this.time
    const night = this.night
    for (const b of BLOCKS) {
      if (!inView(b.x + b.w / 2, b.y + b.h / 2, 120)) continue
      const o = b.hgt * 0.7
      c.fillStyle = th.shadow
      c.beginPath(); c.moveTo(b.x, b.y + b.h); c.lineTo(b.x + o, b.y + b.h + o); c.lineTo(b.x + b.w + o, b.y + b.h + o); c.lineTo(b.x + b.w + o, b.y + o); c.lineTo(b.x + b.w, b.y); c.lineTo(b.x + b.w, b.y + b.h); c.closePath(); c.fill()
      c.fillStyle = th.roof; c.beginPath(); c.roundRect(b.x, b.y, b.w, b.h, 6); c.fill()
      c.strokeStyle = th.roofEdge; c.lineWidth = 1.5; c.stroke()
      /* rooftop detail */
      c.strokeStyle = th.roofEdge; c.globalAlpha = .5; c.lineWidth = 1
      c.strokeRect(b.x + 8, b.y + 8, b.w * 0.4, b.h * 0.35)
      c.globalAlpha = 1
      if (b.lit > 0.45) { c.fillStyle = th.win; c.globalAlpha = night ? 0.5 + 0.4 * Math.sin(t * 1.2 + b.x) : 1; c.fillRect(b.x + b.w - 18, b.y + b.h - 14, 8, 5); c.globalAlpha = 1 }
    }
    /* landmarks */
    for (const l of LANDMARKS) {
      const r = l.rect
      if (!inView(r.x + r.w / 2, r.y + r.h / 2, 260)) continue
      c.fillStyle = th.shadow; c.beginPath(); c.roundRect(r.x + 16, r.y + 18, r.w, r.h, 12); c.fill()
      const accent = l.kind === 'museum' ? '#ffb36b' : '#ff6a3d'
      c.fillStyle = th.roof; c.beginPath(); c.roundRect(r.x, r.y, r.w, r.h, 12); c.fill()
      c.strokeStyle = accent; c.lineWidth = 3; c.stroke()
      if (l.kind === 'museum') {
        /* pediment + columns seen from above, skylight */
        c.fillStyle = accent; c.globalAlpha = .2; c.fillRect(r.x + 20, r.y + 18, r.w - 40, r.h - 36); c.globalAlpha = 1
        c.strokeStyle = accent; c.lineWidth = 2
        for (let i = 0; i < 9; i++) { const x = r.x + 26 + i * ((r.w - 52) / 8); c.beginPath(); c.moveTo(x, r.y + r.h - 12); c.lineTo(x, r.y + r.h - 3); c.stroke() }
        c.globalAlpha = .8; c.strokeRect(r.x + r.w / 2 - 56, r.y + 30, 112, 44); c.globalAlpha = 1
        c.fillStyle = th.ink; c.textAlign = 'center'; c.font = '700 15px "JetBrains Mono", monospace'; c.fillText('M U S E U M', r.x + r.w / 2, r.y + 58)
      } else {
        c.fillStyle = accent; c.globalAlpha = .15; c.fillRect(r.x + 12, r.y + 12, r.w - 24, r.h - 24); c.globalAlpha = 1
        /* scanning beam */
        const sx = r.x + 14 + ((Math.sin(t * 1.6) + 1) / 2) * (r.w - 28)
        c.strokeStyle = accent; c.lineWidth = 3; c.beginPath(); c.moveTo(sx, r.y + 8); c.lineTo(sx, r.y + r.h - 8); c.stroke()
        c.fillStyle = th.ink; c.textAlign = 'center'; c.font = '700 14px "JetBrains Mono", monospace'; c.fillText('V I S I O N  L A B', r.x + r.w / 2, r.y + r.h / 2 + 5)
      }
      c.textAlign = 'start'
    }
    /* lighthouse */
    if (inView(LIGHTHOUSE.x, LIGHTHOUSE.y, 200)) {
      const L = LIGHTHOUSE
      c.fillStyle = th.shadow; c.beginPath(); c.arc(L.x + 8, L.y + 10, L.r, 0, 6.3); c.fill()
      c.fillStyle = '#f4f1ea'; c.beginPath(); c.arc(L.x, L.y, L.r, 0, 6.3); c.fill()
      c.strokeStyle = '#ff6a3d'; c.lineWidth = 5; c.beginPath(); c.arc(L.x, L.y, L.r - 6, 0, 6.3); c.stroke()
      const a = t * 1.4
      c.save(); c.translate(L.x, L.y); c.rotate(a); c.globalCompositeOperation = this.night ? 'lighter' : 'source-over'
      const g = c.createLinearGradient(0, 0, 220, 0); g.addColorStop(0, 'rgba(255,230,160,.55)'); g.addColorStop(1, 'rgba(255,230,160,0)')
      c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(220, -34); c.lineTo(220, 34); c.closePath(); c.globalAlpha = this.night ? 1 : .4; c.fill(); c.restore()
      c.globalAlpha = 1
    }
  }

  private drawTrees(c: CanvasRenderingContext2D, inView: (x: number, y: number, r: number) => boolean) {
    const th = this.th
    for (const tr of TREES) {
      if (!inView(tr.x, tr.y, 40)) continue
      c.fillStyle = th.shadow; c.beginPath(); c.arc(tr.x + 6, tr.y + 8, tr.r, 0, 6.3); c.fill()
      c.fillStyle = th.tree1; c.beginPath(); c.arc(tr.x, tr.y, tr.r, 0, 6.3); c.fill()
      c.fillStyle = th.tree2; c.beginPath(); c.arc(tr.x - tr.r * 0.22, tr.y - tr.r * 0.22, tr.r * 0.62, 0, 6.3); c.fill()
    }
  }

  private drawCar(c: CanvasRenderingContext2D, x: number, y: number, a: number, body: string, s: number, hero: boolean, brake: boolean) {
    c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s)
    c.fillStyle = this.th.shadow; c.beginPath(); c.roundRect(-18 + 5, -10 + 7, 38, 20, 7); c.fill()
    c.fillStyle = body; c.beginPath(); c.roundRect(-19, -10, 38, 20, 7); c.fill()
    c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.roundRect(-19, -10, 38, 7, 7); c.fill()
    c.fillStyle = this.th.carGlass; c.beginPath(); c.roundRect(-4, -7.5, 11, 15, 3); c.fill()
    c.beginPath(); c.roundRect(-13, -6.5, 6, 13, 2); c.fill()
    c.fillStyle = '#fff6c8'; c.fillRect(16, -8, 3, 4); c.fillRect(16, 4, 3, 4)
    c.fillStyle = brake ? '#ff3b30' : '#7a1d18'; c.fillRect(-19, -8, 3, 4); c.fillRect(-19, 4, 3, 4)
    if (brake && hero) { c.fillStyle = 'rgba(255,59,48,.35)'; c.beginPath(); c.arc(-20, 0, 12, 0, 6.3); c.fill() }
    c.restore()
  }

  private drawMini(scale: number, vx0: number, vy0: number, vx1: number, vy1: number) {
    const m = this.mini!, g = this.miniCtx!, s = m.width / WORLD.w
    g.setTransform(1, 0, 0, 1, 0, 0)
    if (this.miniBase) g.drawImage(this.miniBase, 0, 0)
    g.strokeStyle = this.night ? 'rgba(200,255,61,.8)' : 'rgba(75,52,255,.8)'; g.lineWidth = 1.2
    g.strokeRect(vx0 * s, vy0 * s, (vx1 - vx0) * s, (vy1 - vy0) * s)
    for (const sh of SHARDS) if (!this.collected.has(sh.id)) { g.fillStyle = this.night ? 'rgba(200,255,61,.8)' : 'rgba(75,52,255,.7)'; g.fillRect(sh.x * s - 1, sh.y * s - 1, 2, 2) }
    g.save(); g.translate(this.x * s, this.y * s); g.rotate(this.a)
    g.fillStyle = this.night ? '#fff' : '#111'; g.beginPath(); g.moveTo(6, 0); g.lineTo(-4, -4); g.lineTo(-2, 0); g.lineTo(-4, 4); g.closePath(); g.fill()
    g.restore()
    void scale
  }
}
