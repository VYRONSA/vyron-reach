import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { queryRelevantKnowledge } from '@/lib/dev/learning/knowledgeEngine'
import { readDNAProfile, readExecutionRecords, readMemoryEntries } from '@/lib/dev/learning/learningStorage'

/**
 * The Knowledge Engine's query endpoint — called before every execution
 * so the Planning Engine can inject relevant history into the Runtime
 * Context. Read-only; never writes anything.
 */
export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const project = request.nextUrl.searchParams.get('project')
  const taskText = request.nextUrl.searchParams.get('taskText') ?? ''
  if (!project) return NextResponse.json({ error: 'project is required' }, { status: 400 })

  const allRecords = readExecutionRecords()
  const dnaProfile = readDNAProfile(project)
  const memoryEntries = readMemoryEntries()

  const knowledge = queryRelevantKnowledge(taskText, project, allRecords, dnaProfile, memoryEntries)
  return NextResponse.json({ knowledge })
}
