import { NextResponse } from 'next/server'

/** VYRON REACH uses ChatGPT handoff — no server-side OpenAI generation. */
export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    mode: 'handoff',
    message:
      'VYRON REACH prepares premium ChatGPT prompts client-side. Use Campaign Studio → Open in ChatGPT. No API key required.',
  })
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'Server-side AI disabled',
      detail:
        'Use Campaign Studio in VYRON REACH to build your prompt, then click Open in ChatGPT. Paste results back via Import creative.',
      mode: 'handoff',
    },
    { status: 410 },
  )
}
