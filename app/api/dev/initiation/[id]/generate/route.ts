import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { describeInitiationError } from '@/lib/dev/initiation/initiationService'
import { runGeneration } from '@/lib/dev/initiation/initiationGenerationService'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const { id } = await params

  try {
    // Awaited fully (the OpenAI call happens within this request) — the
    // response already reflects the terminal Review/GenerationFailed
    // status, unlike the fire-and-forget director handoff's 202.
    const initiation = await runGeneration(id)
    return NextResponse.json({ initiation })
  } catch (err) {
    const described = describeInitiationError(err)
    if (described) return NextResponse.json({ error: described.error }, { status: described.status })
    throw err
  }
}
