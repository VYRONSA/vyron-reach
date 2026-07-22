import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { currentDevActor } from '@/lib/dev/auth'
import { isProjectSlugTaken } from '@/lib/dev/planningState/planningStateService'
import { createInitiation, describeInitiationError, listInitiations } from '@/lib/dev/initiation/initiationService'

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function suggestSlug(name: string): string {
  const base = slugify(name) || 'project'
  let candidate = base
  let n = 2
  while (isProjectSlugTaken(candidate)) {
    candidate = `${base}-${n}`
    n += 1
  }
  return candidate
}

export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }
  const project = request.nextUrl.searchParams.get('project') ?? undefined
  return NextResponse.json({ initiations: listInitiations(project) })
}

type CreateBody = { directiveTitle?: string; directiveText?: string; projectSlug?: string; projectCategory?: string }

/**
 * Creates a Draft InitiationRequest — which also immediately reserves the
 * project slug (see initiationService.createInitiation's doc comment for
 * why). If `projectSlug` isn't supplied, one is derived from the
 * directive title, same convention as projectsData.ts's suggestSlug.
 */
export async function POST(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const body = (await request.json().catch(() => null)) as CreateBody | null
  if (!body?.directiveTitle?.trim() || !body.directiveText?.trim()) {
    return NextResponse.json({ error: 'directiveTitle and directiveText are required' }, { status: 400 })
  }

  const projectSlug = body.projectSlug?.trim() ? slugify(body.projectSlug) : suggestSlug(body.directiveTitle)
  if (!projectSlug) {
    return NextResponse.json({ error: 'Could not derive a valid project slug from the directive title.' }, { status: 400 })
  }
  // Advisory fast path only, same as POST /api/dev/planning/projects — the
  // actual guarantee against a duplicate slug comes from
  // createInitiation() -> planningStateService.createProject()'s atomic
  // reservation below, which is what a race that slips past this
  // unlocked read is caught by instead.
  if (isProjectSlugTaken(projectSlug)) {
    return NextResponse.json({ error: `Project slug '${projectSlug}' already exists.` }, { status: 409 })
  }

  try {
    const initiation = createInitiation({
      projectSlug,
      projectName: body.directiveTitle.trim(),
      projectCategory: body.projectCategory?.trim() ?? '',
      directiveTitle: body.directiveTitle.trim(),
      directiveText: body.directiveText,
      submittedBy: currentDevActor(),
    })
    return NextResponse.json({ initiation }, { status: 201 })
  } catch (err) {
    const described = describeInitiationError(err)
    if (described) return NextResponse.json({ error: described.error }, { status: described.status })
    throw err
  }
}
