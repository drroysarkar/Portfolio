'use client'

import { useEffect, useRef } from 'react'
import { useUI } from '@/lib/store'

export function Toast() {
  const toast = useUI(s => s.toast)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!toast || !ref.current) return
    const el = ref.current
    el.textContent = toast.msg
    el.classList.add('on')
    const t = setTimeout(() => el.classList.remove('on'), 2200)
    return () => clearTimeout(t)
  }, [toast])
  return <div className="toast" id="toast" ref={ref} role="status" aria-live="polite" />
}
