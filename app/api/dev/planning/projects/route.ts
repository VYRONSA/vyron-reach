import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import {
  listProjects,
  createProject,
  isProjectSlugTaken,
  ProjectSlugTakenError,
  type PlanningProjectInput,
} from '@/lib/dev/planningState/planningStateService'

export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  return NextResponse.json({ projects: listProjects() })
}

export async function POST(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const body = (await request.json().catch(() => null)) as Partial<PlanningProjectInput> | null
  if (!body?.slug || !body.name) {
    return NextResponse.json({ error: 'slug and name are required' }, { status: 400 })
  }
  // Advisory fast path only — avoids the write attempt for the common
  // non-colliding case. The actual guarantee comes from createProject()
  // itself, which reserves the slug atomically and is the only thing
  // that can reject a race this check misses.
  if (isProjectSlugTaken(body.slug)) {
    return NextResponse.json({ error: `Project slug '${body.slug}' already exists` }, { status: 409 })
  }

  try {
    const project = createProject({
      slug: body.slug,
      name: body.name,
      description: body.description ?? '',
      category: body.category ?? '',
      status: body.status ?? 'planning',
      progress: body.progress ?? 0,
      color: body.color ?? '',
      icon: body.icon ?? '',
    })
    return NextResponse.json({ project }, { status: 201 })
  } catch (err) {
    if (err instanceof ProjectSlugTakenError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }
    throw err
  }
}
