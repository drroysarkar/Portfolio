'use client'

import { useId } from 'react'
import { CAT_COLOR } from '@/lib/colors'

/* Deterministic generative "artwork" for every project — used on cards,
   in the featured tile and, inside gold frames, on the museum walls.
   Each hall (category) gets its own motif so the collection reads as a set. */

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const shade = (hex: string, a: number) => hex + Math.round(a * 255).toString(16).padStart(2, '0')

export function Art({ id, cat, motion = true }: { id: string; cat: string; motion?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const tone = CAT_COLOR[cat] ?? '#c8ff3d'
  const r = rng(hash(id))
  const W = 400, H = 260
  const o1 = { x: 60 + r() * 280, y: 40 + r() * 180 }
  const o2 = { x: 60 + r() * 280, y: 40 + r() * 180 }
  const motif = (() => {
    switch (cat) {
      case 'Computer Vision & AI': {
        const cols = 7
        const cells = Array.from({ length: cols * 4 }, (_, i) => i)
        return (
          <g>
            {cells.map(i => {
              const cx = 40 + (i % cols) * 46, cy = 52 + Math.floor(i / cols) * 46
              const on = r() > 0.55
              return <rect key={i} x={cx} y={cy} width="38" height="38" rx="6" fill={on ? shade(tone, .35) : 'none'} stroke={shade('#ffffff', .25)} />
            })}
            <rect x="34" y="46" width="352" height="2.5" fill={tone} opacity=".95">
              {motion && <animate attributeName="y" values="46;212;46" dur="4.2s" repeatCount="indefinite" />}
            </rect>
            <text x="42" y="238" fontFamily="monospace" fontSize="15" fill="#fff" opacity=".85">4408121 → 4408121</text>
          </g>
        )
      }
      case 'University ERP & Result Management':
        return (
          <g>
            {Array.from({ length: 11 }, (_, i) => {
              const h = 40 + r() * 140
              return <rect key={i} x={36 + i * 30} y={222 - h} width="20" height={h} rx="5" fill={shade(tone, .25 + (i / 11) * .6)} />
            })}
            <polyline fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="2" points={Array.from({ length: 11 }, (_, i) => `${46 + i * 30},${190 - r() * 120}`).join(' ')} />
          </g>
        )
      case 'Enterprise Systems':
        return (
          <g fill="none" stroke={tone}>
            {[28, 56, 88, 122].map((rad, i) => (
              <circle key={i} cx="200" cy="130" r={rad} strokeWidth={i % 2 ? 1.5 : 3} strokeDasharray={i % 2 ? '4 8' : `${20 + i * 10} 12`} opacity={0.9 - i * 0.12}>
                {motion && <animateTransform attributeName="transform" type="rotate" from={`0 200 130`} to={`${i % 2 ? -360 : 360} 200 130`} dur={`${16 + i * 6}s`} repeatCount="indefinite" />}
              </circle>
            ))}
            <circle cx="200" cy="130" r="9" fill="#fff" stroke="none" />
          </g>
        )
      case 'Web Applications':
        return (
          <g>
            <rect x="46" y="40" width="308" height="190" rx="14" fill="#0b0d14" fillOpacity=".55" stroke="#fff" strokeOpacity=".35" />
            <circle cx="66" cy="58" r="4" fill="#ff5f57" /><circle cx="80" cy="58" r="4" fill="#febc2e" /><circle cx="94" cy="58" r="4" fill="#28c840" />
            <rect x="64" y="82" width="140" height="14" rx="7" fill={tone} />
            <rect x="64" y="106" width="220" height="8" rx="4" fill="#fff" opacity=".4" />
            <rect x="64" y="124" width="190" height="8" rx="4" fill="#fff" opacity=".25" />
            <rect x="64" y="154" width="86" height="56" rx="10" fill={shade(tone, .35)} />
            <rect x="160" y="154" width="86" height="56" rx="10" fill={shade(tone, .2)} />
            <rect x="256" y="154" width="86" height="56" rx="10" fill={shade(tone, .5)} />
          </g>
        )
      case 'Desktop Applications':
        return (
          <g>
            <rect x="40" y="46" width="200" height="140" rx="10" fill="#0b0d14" fillOpacity=".55" stroke="#fff" strokeOpacity=".35" />
            <rect x="40" y="46" width="200" height="22" rx="10" fill={tone} />
            <rect x="160" y="96" width="200" height="130" rx="10" fill="#0b0d14" fillOpacity=".75" stroke={tone} />
            <rect x="160" y="96" width="200" height="22" rx="10" fill={shade(tone, .55)} />
            {[0, 1, 2, 3].map(i => <rect key={i} x="176" y={132 + i * 20} width={120 - i * 14} height="8" rx="4" fill="#fff" opacity=".5" />)}
          </g>
        )
      case 'Mobile Applications':
        return (
          <g>
            <rect x="148" y="24" width="104" height="212" rx="20" fill="#0b0d14" fillOpacity=".7" stroke="#fff" strokeOpacity=".5" strokeWidth="2" />
            <rect x="188" y="32" width="24" height="5" rx="3" fill="#fff" opacity=".5" />
            <circle cx="200" cy="100" r="30" fill="none" stroke={tone} strokeWidth="8" strokeDasharray="130 60" />
            <rect x="164" y="148" width="72" height="10" rx="5" fill="#fff" opacity=".6" />
            <rect x="164" y="168" width="52" height="8" rx="4" fill="#fff" opacity=".3" />
            <rect x="164" y="196" width="72" height="22" rx="11" fill={tone} />
          </g>
        )
      case 'Developer Tools':
        return (
          <g fontFamily="monospace" fontSize="14">
            <rect x="40" y="46" width="320" height="170" rx="12" fill="#0b0d14" fillOpacity=".7" stroke="#fff" strokeOpacity=".35" />
            <text x="58" y="78" fill={tone}>$ select * from</text>
            <text x="58" y="102" fill="#fff" opacity=".7">  projects</text>
            <text x="58" y="126" fill="#fff" opacity=".7">  where status = &apos;beta&apos;;</text>
            <rect x="58" y="146" width="10" height="18" fill={tone}>{motion && <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />}</rect>
          </g>
        )
      default:
        return (
          <g fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2">
            {[[70, 70], [190, 70], [310, 70], [130, 190], [250, 190]].map(([x, y], i) => <rect key={i} x={x - 34} y={y - 22} width="68" height="44" rx="12" fill={shade(tone, .25 + i * .1)} />)}
            <path d="M104 70H156M224 70H276M190 92L146 168M190 92L234 168M310 92L270 168" strokeDasharray="5 6" />
          </g>
        )
    }
  })()

  return (
    <div className="art" aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`a${uid}`} cx={o1.x} cy={o1.y} r="260" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor={tone} stopOpacity=".7" /><stop offset="1" stopColor={tone} stopOpacity="0" /></radialGradient>
          <radialGradient id={`b${uid}`} cx={o2.x} cy={o2.y} r="240" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#7a6bff" stopOpacity=".55" /><stop offset="1" stopColor="#7a6bff" stopOpacity="0" /></radialGradient>
          <pattern id={`p${uid}`} width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#fff" strokeOpacity=".05" /></pattern>
        </defs>
        <rect width={W} height={H} fill="#0a0c12" />
        <rect width={W} height={H} fill={`url(#a${uid})`} />
        <rect width={W} height={H} fill={`url(#b${uid})`} />
        <rect width={W} height={H} fill={`url(#p${uid})`} />
        {motif}
      </svg>
    </div>
  )
}
