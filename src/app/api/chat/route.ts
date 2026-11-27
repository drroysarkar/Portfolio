import { NextResponse } from 'next/server'
import { answerLocally } from '@/lib/bot'

export const runtime = 'nodejs'

/* DK Assistant — answers strictly from Divyanshu's portfolio facts.
   Primary: LLM (z-ai-web-dev-sdk) grounded with BOT_FACTS.
   Fallback: the local retrieval engine, so the bot always replies. */

const SYSTEM = `You are DK Assistant, the corner bot of Divyanshu Kumar's portfolio website.
Answer ONLY from the FACTS below — never invent employers, dates, numbers, projects or claims.
Where the data says something is "being confirmed" or "not yet defined", say so plainly.
Style: friendly, precise, 1-3 short paragraphs max unless a list is asked for. You may use "I" as the assistant voice, and "Divyanshu/he" for the subject.

FACTS:
`

export async function POST(req: Request) {
  let message = ''
  try {
    const body = await req.json()
    message = String(body?.message ?? '').slice(0, 800)
  } catch {
    message = ''
  }
  if (!message.trim()) {
    return NextResponse.json({ reply: 'Ask me anything about Divyanshu — projects, stack, journey, education, contact.', source: 'local' })
  }

  try {
    const { BOT_FACTS } = await import('@/lib/bot')
    const mod = (await import('z-ai-web-dev-sdk')) as unknown as {
      default: new () => { chat: { completions: { create: (a: unknown) => Promise<{ choices: { message: { content?: string } }[] }> } } }
    }
    const zai = new mod.default()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM + BOT_FACTS },
        { role: 'user', content: message },
      ],
    })
    const text = completion?.choices?.[0]?.message?.content?.trim()
    if (text) return NextResponse.json({ reply: text, source: 'llm' })
    throw new Error('empty completion')
  } catch {
    const local = answerLocally(message)
    return NextResponse.json({ reply: local.text, chips: local.chips, source: 'local' })
  }
}
