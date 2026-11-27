'use client'

import { useEffect, useRef, useState } from 'react'
import { useUI } from '@/lib/store'
import { answerLocally } from '@/lib/bot'

/* ============================================================
   DK ASSISTANT — corner bot. Knows the whole portfolio (CV facts).
   Tries the grounded LLM route first; falls back to the local
   retrieval engine so an answer always arrives.
   ============================================================ */

type Msg = { who: 'bot' | 'me'; text: string; chips?: string[] }

const WELCOME: Msg = {
  who: 'bot',
  text: "Hi, I am DK Assistant — the bot in the corner. I know Divyanshu's CV, all 20 projects, his stack, his journey and the drive mode. Ask me anything about him.",
  chips: ['Tell me about him', 'Best project?', 'What is his stack?', 'His journey', 'How to contact?'],
}

export function Bot() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [nudge, setNudge] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const setMuseum = useUI(s => s.setMuseum)
  const enterWorld = useUI(s => s.enterWorld)

  /* gentle nudge after a while, once */
  useEffect(() => {
    const t = setTimeout(() => setNudge(true), 12000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (open) {
      setNudge(false)
      setTimeout(() => inputRef.current?.focus(), 60)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        const t = e.target as HTMLElement | null
        if (t && t.closest('.bot-panel')) setOpen(false)
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, busy])

  const send = async (text: string) => {
    const msg = text.trim()
    if (!msg || busy) return
    setMsgs(m => [...m, { who: 'me', text: msg }])
    setQ('')
    setBusy(true)
    /* local answer arrives instantly; the LLM route overrides it when it responds */
    const local = answerLocally(msg)
    let done = false
    const t = setTimeout(() => {
      if (!done) {
        done = true
        setBusy(false)
        setMsgs(m => [...m, { who: 'bot', text: local.text, chips: local.chips }])
      }
    }, 900)
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      const j = await r.json()
      if (!done && j?.reply) {
        done = true
        clearTimeout(t)
        setBusy(false)
        setMsgs(m => [...m, { who: 'bot', text: String(j.reply), chips: j.chips }])
      }
    } catch {
      if (!done) {
        done = true
        clearTimeout(t)
        setBusy(false)
        setMsgs(m => [...m, { who: 'bot', text: local.text, chips: local.chips }])
      }
    }
  }

  const chipAction = (c: string) => {
    if (c === 'Copy email') {
      navigator.clipboard?.writeText('divyanshupc@gmail.com').catch(() => {})
      setMsgs(m => [...m, { who: 'bot', text: 'Email copied: divyanshupc@gmail.com' }])
      return
    }
    if (c.startsWith('Open ') || c.includes('museum')) {
      const lower = c.toLowerCase()
      if (lower.includes('museum')) { setOpen(false); setMuseum(true); return }
      if (lower.includes('drive') || lower.includes('grid')) { setOpen(false); enterWorld(true); return }
    }
    void send(c)
  }

  return (
    <>
      {!open && (
        <div className="bot-dock">
          {nudge && (
            <button type="button" className="bot-nudge" onClick={() => { setOpen(true); setNudge(false) }}>
              Questions about Divyanshu? Ask the AI.
            </button>
          )}
          <button type="button" className="bot-fab" onClick={() => setOpen(true)} aria-label="Open the AI assistant, which answers questions about Divyanshu">
            <span className="orb" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9z" /><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" /></svg>
            </span>
            <span className="lbl">Ask AI</span>
          </button>
        </div>
      )}

      {open && (
        <div className="bot-dock"><div className="bot-panel" ref={panelRef} role="dialog" aria-label="DK Assistant chat">
          <header className="bot-head">
            <span className="bot-ava" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9z" /></svg></span>
            <div>
              <b>Ask AI</b>
              <span className="mono">answers only from portfolio data</span>
            </div>
            <button className="ibtn bot-x" type="button" onClick={() => setOpen(false)} aria-label="Close the assistant">✕</button>
          </header>

          <div className="bot-msgs" ref={scrollRef} aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={'bot-row ' + m.who}>
                <div className="bot-bubble">
                  {m.text.split('\n').map((ln, j) => <p key={j}>{ln}</p>)}
                </div>
                {m.chips && (
                  <div className="bot-chips">
                    {m.chips.slice(0, 4).map(c => (
                      <button key={c} type="button" className="chip" onClick={() => chipAction(c)}>{c}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="bot-row bot">
                <div className="bot-bubble bot-typing" aria-label="Assistant is typing">
                  <i /><i /><i />
                </div>
              </div>
            )}
          </div>

          <form
            className="bot-form"
            onSubmit={e => { e.preventDefault(); void send(q) }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about projects, stack, journey…"
              aria-label="Ask the assistant about Divyanshu"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            <button className="bot-send" type="submit" disabled={!q.trim() || busy} aria-label="Send">↑</button>
          </form>
        </div></div>
      )}
    </>
  )
}
