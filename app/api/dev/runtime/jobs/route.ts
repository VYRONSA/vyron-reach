import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { createDevelopmentJob, getDevelopmentJobsForProject } from '@/lib/dev/runtime/runtimeEngine'
import type { CreateJobInput } from '@/lib/dev/runtime/runtimeTypes'

export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const slug = request.nextUrl.searchParams.get('project')
  if (!slug) return NextResponse.json({ error: 'Missing project query param' }, { status: 400 })

  return NextResponse.json({ jobs: getDevelopmentJobsForProject(slug) })
}

export async function POST(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const body = (await request.json().catch(() => null)) as Partial<CreateJobInput> | null
  if (!body || !body.projectSlug || !body.prompt) {
    return NextResponse.json({ error: 'projectSlug and prompt are required' }, { status: 400 })
  }

  const job = createDevelopmentJob({
    projectSlug: body.projectSlug,
    milestoneId: body.milestoneId ?? '',
    batchId: body.batchId ?? '',
    objective: body.objective ?? '',
    prompt: body.prompt,
  })

  return NextResponse.json({ job }, { status: 201 })
}
