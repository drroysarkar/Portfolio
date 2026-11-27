'use client'

import { useEffect, useRef } from 'react'

/* Adds the `in` class when the element scrolls into view (works with .rv/.rv-l/.rv-s). */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }),
      { rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

export function Reveal({ as, className = '', children, ...rest }: { as?: 'div' | 'p' | 'li' | 'span' } & React.HTMLAttributes<HTMLElement>) {
  const ref = useReveal<HTMLDivElement>()
  const Tag = (as || 'div') as 'div'
  return (
    <Tag ref={ref} className={`rv ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

export function SectionHead({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode }) {
  const a = useReveal<HTMLDivElement>()
  const b = useReveal<HTMLDivElement>()
  return (
    <div className="sec-head">
      <div ref={a} className="rv" style={{ transitionDelay: '0ms' }}>
        <p className="eyebrow mono">{eyebrow}</p>
        <h2 style={{ marginTop: 14 }}>{title}</h2>
      </div>
      {children && <div ref={b} className="rv" style={{ transitionDelay: '120ms' }}>{children}</div>}
    </div>
  )
}
