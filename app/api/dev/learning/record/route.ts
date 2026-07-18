import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { processExecutionForLearning } from '@/lib/dev/learning/learningEngine'
import { appendExecutionRecord, appendDNAEntry, appendMemoryEntry, readDNAProfile, readExecutionRecords } from '@/lib/dev/learning/learningStorage'
import type { ExecutionLearningRecord } from '@/lib/dev/learning/learningTypes'

/**
 * Persists one execution's learning record and evolves that product's
 * Engineering DNA and Engineering Memory from it. The record itself is
 * built client-side (Mission Control already has the Job/Handover/
 * Report/Strategy/Workforce data assembled) and posted here fully
 * formed — this route only persists it and runs the pure extraction
 * functions server-side, since only the server can write to the
 * file-backed stores.
 */
export async function POST(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const record = (await request.json().catch(() => null)) as ExecutionLearningRecord | null
  if (!record || !record.id || !record.projectSlug) {
    return NextResponse.json({ error: 'A valid ExecutionLearningRecord is required' }, { status: 400 })
  }

  const priorRecords = readExecutionRecords()
  const existingDNAProfile = readDNAProfile(record.projectSlug)
  const update = processExecutionForLearning(record, existingDNAProfile, priorRecords)

  appendExecutionRecord(update.record)
  for (const entry of update.newDNAEntries) appendDNAEntry(entry)
  if (update.newMemoryEntry) appendMemoryEntry(update.newMemoryEntry)

  return NextResponse.json({
    newDNAEntries: update.newDNAEntries,
    newMemoryEntry: update.newMemoryEntry,
    patternsAfter: update.patternsAfter,
  })
}
