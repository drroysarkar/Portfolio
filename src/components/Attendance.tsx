'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ROWS, AUGS, SD, PIPE, ARCH } from '@/lib/data'
import { SectionHead, useReveal } from '@/components/Reveal'

const cap = (s: string) => s.toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase())
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

type Aug = Record<string, boolean>

/* ---------- canvas helpers (ported from the project's preprocessing idea) ---------- */
function drawCell(c: HTMLCanvasElement, row: (typeof ROWS)[number], aug: Aug) {
  const W = 300, H = 110
  c.width = W; c.height = H
  const x = c.getContext('2d')!
  x.fillStyle = '#fbfbf6'; x.fillRect(0, 0, W, H)
  x.save(); x.translate(W / 2, H / 2)
  let rot = row.kind === 'diag' ? -0.15 : 0
  if (aug.tilt) rot += 0.14
  x.rotate(rot)
  if (aug.squeeze) x.scale(0.72, 1)
  x.translate(-W / 2, -H / 2)
  x.fillStyle = '#1b2a4a'; x.strokeStyle = '#1b2a4a'; x.lineJoin = 'round'; x.textBaseline = 'alphabetic'
  x.globalAlpha = aug.faint ? 0.42 : 1
  x.lineWidth = aug.bold ? 3.2 : 0
  const put = (t: string, px: number, py: number, sz: number) => {
    x.font = '700 ' + sz + 'px ' + cssFont('--hand')
    x.fillText(t, px, py)
    if (aug.bold) x.strokeText(t, px, py)
  }
  if (row.kind === 'two') { put(row.cn.slice(0, 5), 42, 52, 46); put(row.cn.slice(5), 96, 100, 46) }
  else {
    x.font = '700 66px ' + cssFont('--hand')
    const wd = x.measureText(row.cn).width
    put(row.cn, (W - wd) / 2, 72, 66)
  }
  x.restore(); x.globalAlpha = 1
  if (aug.border) { x.fillStyle = '#1c2330'; x.fillRect(W - 4, 0, 3, H) }
  if (aug.cut) { x.fillStyle = '#fbfbf6'; x.fillRect(118, 0, 22, H) }
  if (aug.noise) {
    const id = x.getImageData(0, 0, W, H), d = id.data
    let s = 7
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
    for (let i = 0; i < d.length; i += 4) { if (r() < 0.025) { const v = 60 + r() * 120; d[i] = d[i + 1] = d[i + 2] = v } }
    x.putImageData(id, 0, 0)
  }
}

function cssFont(varName: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  return v || 'Caveat,cursive'
}

function otsu(g: Uint8Array) {
  const h = new Float64Array(256)
  g.forEach(v => { h[v]++ })
  const tot = g.length
  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * h[i]
  let sb = 0, wb = 0, best = 0, thr = 128
  for (let t = 0; t < 256; t++) {
    wb += h[t]
    if (!wb) continue
    const wf = tot - wb
    if (!wf) break
    sb += t * h[t]
    const mb = sb / wb, mf = (sum - sb) / wf, v = wb * wf * (mb - mf) * (mb - mf)
    if (v > best) { best = v; thr = t }
  }
  return thr
}

function bbox(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const d = ctx.getImageData(0, 0, w, h).data
  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (d[(y * w + x) * 4] < 128) {
      if (x < x0) x0 = x; if (x > x1) x1 = x
      if (y < y0) y0 = y; if (y > y1) y1 = y
    }
  }
  return x1 < 0 ? null : { x0, y0, x1: x1 + 1, y1: y1 + 1 }
}

function resizeH(src: HTMLCanvasElement, box: { x0: number; y0: number; x1: number; y1: number }, H: number) {
  const sw = box.x1 - box.x0, sh = box.y1 - box.y0
  const w = Math.max(4, Math.round((sw * H) / sh))
  const c = document.createElement('canvas')
  c.width = w; c.height = H
  const x = c.getContext('2d')!
  x.fillStyle = '#fff'; x.fillRect(0, 0, w, H)
  x.imageSmoothingQuality = 'high'
  x.drawImage(src, box.x0, box.y0, sw, sh, 0, 0, w, H)
  return c
}

function bboxRegion(ctx: CanvasRenderingContext2D, w: number, y0: number, y1: number) {
  const d = ctx.getImageData(0, y0, w, y1 - y0).data, h = y1 - y0
  let x0 = w, x1 = 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (d[(y * w + x) * 4] < 128) { if (x < x0) x0 = x; if (x + 1 > x1) x1 = x + 1 }
  }
  if (x1 <= x0) { x0 = 0; x1 = w }
  return { x0, x1, y0, y1 }
}

/* ================= section ================= */
export function Attendance() {
  const [selRow, setSelRow] = useState<(typeof ROWS)[number]>(ROWS[0])
  const [aug, setAug] = useState<Aug>({})
  const [labOut, setLabOut] = useState('')
  const [pipeCur, setPipeCur] = useState(4)
  const [archCur, setArchCur] = useState(0)
  const [wPx, setWPx] = useState(160)
  const [nDig, setNDig] = useState(7)
  const [pct, setPct] = useState(90)
  const cvs = [useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null)]
  const labRef = useRef<HTMLDivElement>(null)
  const rv = useReveal<HTMLDivElement>()

  const runLab = useCallback(() => {
    const [c1, c2, c3, c4] = cvs.map(r => r.current)
    if (!c1 || !c2 || !c3 || !c4) return
    const row = selRow
    const W = 300, H = 110
    drawCell(c1, row, aug)
    const x1 = c1.getContext('2d')!
    const id = x1.getImageData(0, 0, W, H)
    const g = new Uint8Array(W * H)
    for (let i = 0; i < W * H; i++) g[i] = id.data[i * 4] * 0.3 + id.data[i * 4 + 1] * 0.59 + id.data[i * 4 + 2] * 0.11
    const thr = otsu(g)
    c2.width = W; c2.height = H
    const x2 = c2.getContext('2d')!
    const o = x2.createImageData(W, H)
    for (let i = 0; i < W * H; i++) { const v = g[i] < thr ? 0 : 255; o.data[i * 4] = o.data[i * 4 + 1] = o.data[i * 4 + 2] = v; o.data[i * 4 + 3] = 255 }
    x2.putImageData(o, 0, 0)
    /* layout: row projection */
    const rs = new Array(H).fill(0)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (o.data[(y * W + x) * 4] < 128) rs[y]++
    const mx = Math.max(...rs, 1)
    const on = rs.map(v => v > Math.max(2, mx * 0.04))
    const runs: [number, number][] = []
    for (let y = 0; y < H; y++) {
      if (on[y]) {
        if (runs.length && y - runs[runs.length - 1][1] <= 3) runs[runs.length - 1][1] = y + 1
        else runs.push([y, y + 1])
      }
    }
    const big = runs.filter(r => r[1] - r[0] >= 14)
    c3.width = W; c3.height = H
    const x3 = c3.getContext('2d')!
    let finalC: HTMLCanvasElement
    let layout: string
    if (big.length >= 2) {
      layout = 'two-line'
      x3.drawImage(c2, 0, 0)
      x3.strokeStyle = '#e8601c'; x3.lineWidth = 2
      const parts = [big[0], big[big.length - 1]].map(r => {
        const y0 = Math.max(0, r[0] - 2), y1 = Math.min(H, r[1] + 2)
        x3.strokeRect(1, y0, W - 2, y1 - y0)
        const bb = bboxRegion(x2, W, y0, y1)
        return resizeH(c2, bb, 32)
      })
      const sep = 6
      const tw = parts[0].width + sep + parts[1].width
      finalC = document.createElement('canvas')
      finalC.width = tw; finalC.height = 32
      const fx = finalC.getContext('2d')!
      fx.fillStyle = '#fff'; fx.fillRect(0, 0, tw, 32)
      fx.drawImage(parts[0], 0, 0)
      fx.drawImage(parts[1], parts[0].width + sep, 0)
    } else {
      let best = 0, bs = -1
      const t = document.createElement('canvas')
      t.width = W; t.height = H
      const tx = t.getContext('2d')!
      for (let a = -16; a <= 16; a += 2) {
        tx.fillStyle = '#fff'; tx.fillRect(0, 0, W, H)
        tx.save(); tx.translate(W / 2, H / 2); tx.rotate((a * Math.PI) / 180); tx.drawImage(c2, -W / 2, -H / 2); tx.restore()
        const d = tx.getImageData(0, 0, W, H).data
        let sc = 0
        for (let y = 0; y < H; y++) { let s = 0; for (let x = 0; x < W; x++) if (d[(y * W + x) * 4] < 128) s++; sc += s * s }
        if (sc > bs) { bs = sc; best = a }
      }
      if (Math.abs(best) < 3) best = 0
      x3.fillStyle = '#fff'; x3.fillRect(0, 0, W, H)
      x3.save(); x3.translate(W / 2, H / 2); x3.rotate((best * Math.PI) / 180); x3.drawImage(c2, -W / 2, -H / 2); x3.restore()
      layout = best ? 'tilted, straightened by ' + Math.abs(best) + '°' : 'horizontal'
      const bb = bbox(x3, W, H)
      finalC = bb
        ? resizeH(c3, { x0: Math.max(0, bb.x0 - 6), y0: Math.max(0, bb.y0 - 6), x1: Math.min(W, bb.x1 + 6), y1: Math.min(H, bb.y1 + 6) }, 32)
        : document.createElement('canvas')
    }
    const padS = 8
    let fw = finalC.width + padS * 2
    fw += (4 - (fw % 4)) % 4
    c4.width = fw; c4.height = 32
    const x4 = c4.getContext('2d')!
    x4.fillStyle = '#fff'; x4.fillRect(0, 0, fw, 32)
    x4.drawImage(finalC, padS, 0)
    ;[c1, c2, c3].forEach(c => { c.style.width = Math.min(c.width, 300) + 'px' })
    c4.style.width = Math.min(fw * 3, 560) + 'px'
    c4.style.height = Math.round((Math.min(fw * 3, 560) * 32) / fw) + 'px'
    setLabOut('Layout: ' + layout + ' · model input 1 × 32 × ' + fw + ' → ' + (fw / 4) + ' time steps · made-up label ' + row.cn)
  }, [selRow, aug])

  useEffect(() => { runLab() }, [runLab])
  useEffect(() => {
    (document as Document & { fonts?: FontFaceSet }).fonts?.load('700 60px Caveat').then(() => runLab()).catch(() => {})
  }, [runLab])

  const noPhoto = [4, 6]
  const all = Math.pow(pct / 100, nDig)
  const pc = all * 100

  return (
    <section className="sec band" id="attendance" aria-labelledby="am-h">
      <div className="wrap">
        <SectionHead eyebrow="Case study · in development" title="AttendanceMaster">
          <p className="lede">
            After an exam, every centre sends back scanned attendance sheets. Each row carries a{' '}
            <strong>Copy No</strong>, written by hand, that ties a student to an answer script.
            AttendanceMaster reads those numbers so people only have to check them.
          </p>
          <div className="note">
            <p>
              <b>Status.</b> The handwriting model is still being trained. An accuracy of about 20–40% is
              reported for the handwriting recogniser, but no held-out test set or metric has been defined
              yet, so I do not present it as a benchmark. Real sheets and student data are confidential. The
              sheet below is a made-up specimen.
            </p>
          </div>
        </SectionHead>

        <h3 style={{ marginBottom: 6 }}>A specimen sheet to poke at</h3>
        <p className="muted" style={{ marginBottom: 16, maxWidth: '70ch' }}>
          Invented institution, names, roll numbers and copy numbers, laid out like the real thing. Click any
          Copy No cell to see what the preprocessing does to it.
        </p>
        <div className="am-grid rv" ref={rv}>
          <div className="sheet-scroll" tabIndex={0} role="region" aria-label="Specimen attendance sheet (scrolls sideways on narrow screens)">
            <div className="sheet">
              <div className="corner" /><div className="seal" aria-hidden="true">SAMPLE<br />SEAL</div>
              <div className="t1">EXAMPLE STATE UNIVERSITY, SAMPLE CITY</div>
              <div className="t2">B.A./B.Sc./B.Com. Semester-IV, Examination-2026</div>
              <div className="t3">ATTENDANCE SHEET</div>
              <div className="meta">
                <span>Date of Exam : 12-08-2026</span>
                <span>Room No. :<span className="room">07</span></span>
              </div>
              <div className="hdrs">
                <div className="hdr">Centre of Exam : 000 - Sample Centre College, Sample Town</div>
                <div className="hdr">College Name : 000-Sample College, Sample Town</div>
                <div className="hdr">Course : Bachelor of Arts</div>
                <div className="hdr">Subject Name : 0000-Sample Subject-VI-2nd Sitting</div>
              </div>
              <table>
                <colgroup>
                  <col style={{ width: '6%' }} /><col style={{ width: '15%' }} /><col style={{ width: '17%' }} /><col style={{ width: '8%' }} />
                  <col style={{ width: '7%' }} /><col style={{ width: '15%' }} /><col style={{ width: '9%' }} /><col style={{ width: '23%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Sl.No</th><th>Roll No</th><th>Name</th><th>Photo</th><th>Paper</th><th>Copy No</th><th>Add. Copy</th><th>Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map(r => {
                    const cn = r.kind === 'two'
                      ? <><span>{r.cn.slice(0, 5)}</span><span>{r.cn.slice(5)}</span></>
                      : <span>{r.cn}</span>
                    const nm = r.name.split(' ')
                    return (
                      <tr key={r.n}>
                        <td>{r.n}</td>
                        <td>{r.roll}</td>
                        <td>{r.name}</td>
                        <td><span className={'ph' + (noPhoto.includes(r.n) ? ' no' : '')} aria-hidden="true" /></td>
                        <td>MJC</td>
                        <td>
                          <button
                            className={'cn ' + (r.kind === 'two' ? 'twol' : r.kind)}
                            type="button"
                            aria-pressed={selRow.n === r.n}
                            aria-label={'Copy No, row ' + r.n + '. Select to inspect it in the cell lab.'}
                            onClick={() => setSelRow(r)}
                          >
                            {cn}
                          </button>
                        </td>
                        <td />
                        <td><span className="sig" aria-hidden="true">{cap(nm[0])}<br />{cap(nm[1] || '')}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="foot">
                <div>Total Count on Page : 16<br /><br />Page 1 of 4</div>
                <div>Total Present <span className="box">16</span><br /><br />Total Absent <span className="box" style={{ minWidth: 48 }}>0</span></div>
                <div style={{ width: '44%', position: 'relative', minHeight: 70 }}>
                  <div className="stamp" style={{ left: 4, top: 4 }}>CENTRE SUPERINTENDENT<br />SAMPLE COLLEGE</div>
                  <div className="stamp" style={{ right: 0, top: 18, transform: 'rotate(5deg)' }}>EXAMINATION CONTROLLER<br />SAMPLE CENTRE</div>
                </div>
              </div>
              <div className="spec">SPECIMEN · INVENTED DATA</div>
            </div>
          </div>
          <div className="lab" id="lab" aria-live="polite" ref={labRef}>
            <div>
              <p className="mono muted">Cell lab</p>
              <h3>Row {selRow.n}</h3>
            </div>
            <p className="muted" style={{ fontSize: '.92rem' }}>
              The browser re-enacts the idea behind the project&apos;s <code>preprocess.py</code>: find the ink,
              join two-line writing into one line, straighten, and resize to a fixed 32 px height. It does{' '}
              <b>not</b> run the model.
            </p>
            <div className="augs" role="group" aria-label="Training-style distortions">
              <span className="mono muted" style={{ alignSelf: 'center', marginRight: 4 }}>Distort like training:</span>
              {AUGS.map(([k, l]) => (
                <button
                  key={k}
                  className="chip"
                  type="button"
                  aria-pressed={!!aug[k]}
                  onClick={() => setAug(a => ({ ...a, [k]: !a[k] }))}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="stages">
              {SD.map(([t, c], i) => (
                <div className="stg" key={t}>
                  <p className="mono muted">{t} · {c}</p>
                  <div className="cv"><canvas ref={cvs[i]} /></div>
                </div>
              ))}
            </div>
            <p className="mono" id="labOut">{labOut}</p>
          </div>
        </div>

        <h3 style={{ margin: '56px 0 6px' }}>How a sheet travels through the system</h3>
        <p className="muted" style={{ marginBottom: 18, maxWidth: '72ch' }}>
          Read from the project&apos;s own code. Select a step for the detail. This describes what the code
          does; it is not a measurement of how well it does it.
        </p>
        <ol className="pipe" id="pipe">
          {PIPE.map((p, i) => (
            <li key={i}>
              <button type="button" aria-pressed={pipeCur === i} onClick={() => setPipeCur(i)}>
                <span className="no">{i + 1}</span>
                <span className="tt">{p[0]}</span>
                <span className="ss">{p[1]}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="detail" id="pipeDetail" aria-live="polite">
          <p className="mono muted">Step {pipeCur + 1} of {PIPE.length} · described from the project code</p>
          <h3>{PIPE[pipeCur][0]}</h3>
          <p>{PIPE[pipeCur][2]}</p>
        </div>

        <h3 style={{ margin: '56px 0 6px' }}>Inside the reader</h3>
        <p className="muted" style={{ marginBottom: 18, maxWidth: '72ch' }}>
          The recogniser is a CRNN: a convolutional stack that turns the strip into a sequence of columns, a
          two-layer bidirectional LSTM that reads that sequence, and CTC decoding that outputs a digit string
          without anyone labelling where each digit sits.
        </p>
        <div className="arch" id="arch" role="group" aria-label="Network layers">
          {ARCH.map((s, i) => (
            <span key={i} style={{ display: 'contents' }}>
              {i > 0 && <span className="ar" aria-hidden="true">→</span>}
              <button type="button" aria-pressed={archCur === i} onClick={() => setArchCur(i)}>
                <b>{s[0]}</b><span>{s[1]}</span>
              </button>
            </span>
          ))}
        </div>
        <div className="detail" id="archDetail" aria-live="polite">
          <p className="mono muted">Layer {archCur + 1} of {ARCH.length} · {ARCH[archCur][1]}</p>
          <h3>{ARCH[archCur][0]}</h3>
          <p>{ARCH[archCur][2]}</p>
        </div>
        <div className="calc" style={{ marginTop: 22 }}>
          <label>
            Strip width after resizing: <b>{wPx} px</b>
            <input id="wIn" type="range" min={64} max={320} step={4} value={wPx} onChange={e => setWPx(+e.target.value)} />
          </label>
          <p id="tOut" className="mono">→ {wPx / 4} time steps for the LSTM to read</p>
        </div>

        <h3 style={{ margin: '56px 0 6px' }}>Why one wrong digit matters</h3>
        <p className="muted" style={{ marginBottom: 18, maxWidth: '72ch' }}>
          A copy number is only useful if every digit is right. That makes exact-match accuracy much harsher
          than per-digit accuracy. This is plain arithmetic with sliders, not a measurement of
          AttendanceMaster.
        </p>
        <div className="calc">
          <label>
            Digits in the copy number: <b>{nDig}</b>
            <input id="nIn" type="range" min={6} max={9} step={1} value={nDig} onChange={e => setNDig(+e.target.value)} />
          </label>
          <label>
            Chance each digit is read correctly: <b>{pct}%</b>
            <input id="pIn" type="range" min={50} max={100} step={1} value={pct} onChange={e => setPct(+e.target.value)} />
          </label>
          <div>
            <div className="meter" role="img" aria-label="Chance a whole copy number is right">
              <i style={{ width: clamp(pc, 0, 100) + '%' }} />
              <span>{pc.toFixed(1)}% fully right</span>
            </div>
            <p className="muted" style={{ fontSize: '.88rem', marginTop: 8 }}>
              About {Math.round(pc)} of every 100 copy numbers would be exactly right and{' '}
              {100 - Math.round(pc)} would need a person to fix them.
            </p>
          </div>
        </div>

        <h3 style={{ margin: '56px 0 12px' }}>What is measured, and what is not</h3>
        <dl className="kv">
          <dt>Defined</dt><dd>The reader, the preprocessing, the training loop, the review workflow, and how verified rows feed the next training run.</dd>
          <dt>Reported</dt><dd>About 20–40% accuracy for handwritten Copy No recognition. The metric and test set behind it are not established.</dd>
          <dt>Not yet</dt><dd>A held-out test set, a log of model runs with measured results, and sanitised error examples.</dd>
          <dt>Next</dt><dd>Define the metric and test set, log every model version with its results, and keep studying failures to pick the next experiment.</dd>
        </dl>
      </div>
    </section>
  )
}
