import { randomUUID } from 'node:crypto'
import { readJsonStore, updateJsonStore } from '../fileJsonStore'
import { paginate, inDateRange } from '../../query/queryHelpers'
import { DIRECTOR_ASSESSMENT_HISTORY_FILE } from '../../assessmentStoreFilenames'
import type { PageRequest, PageResult, DateRangeFilter } from '../../query/queryTypes'
import type { EngineeringAssessment, EngineeringHealth } from './assessmentTypes'

/**
 * File-backed persistence for assessment history — on the same atomic
 * primitives every other durable store uses (readJsonStore/
 * updateJsonStore, themselves on fileLock.ts's write-then-rename +
 * cross-process mutex). No new persistence mechanism, no cap: "Assessment
 * history must survive restart" and permanent engineering records are
 * never truncated, matching the Knowledge Service's own stores.
 *
 * The log entry wrapper (id/timestamp) is expected, ordinary metadata for
 * an append-only history record — same pattern as every Knowledge
 * Service domain. What must be byte-identical run-over-run against
 * identical state is the nested `assessment` payload itself, never this
 * wrapper.
 */

/** PRA-P1-003: renamed away from the plain 'assessment-history.json' this used to share with lib/dev/assessment/assessmentRepository.ts. */
const FILE = DIRECTOR_ASSESSMENT_HISTORY_FILE

export type AssessmentHistoryEntry = {
  id: string
  project: string
  timestamp: string
  assessment: EngineeringAssessment
}

export function appendAssessment(assessment: EngineeringAssessment): AssessmentHistoryEntry {
  const entry: AssessmentHistoryEntry = {
    id: randomUUID(),
    project: assessment.project,
    timestamp: new Date().toISOString(),
    assessment,
  }
  updateJsonStore<AssessmentHistoryEntry[]>(FILE, [], entries => [entry, ...entries])
  return entry
}

export function listAssessmentHistory(project: string): AssessmentHistoryEntry[] {
  return readJsonStore<AssessmentHistoryEntry[]>(FILE, []).filter(e => e.project === project)
}

export function latestAssessment(project: string): AssessmentHistoryEntry | null {
  return listAssessmentHistory(project)[0] ?? null
}

/**
 * Enterprise Scalability (Version 2.0 Phase 5, Milestone 5.2) — paginated/
 * filtered access to Assessment History. Like the Knowledge Service's
 * domains, this doc-commented above as "no cap... a permanent
 * engineering record" — no archiving, only server-side pagination so a
 * long-running project's full history is never loaded in one response.
 */
export type AssessmentQueryFilter = { health?: EngineeringHealth; dateRange?: DateRangeFilter }

export function queryAssessmentHistory(project: string, filter: AssessmentQueryFilter = {}, page: PageRequest = {}): PageResult<AssessmentHistoryEntry> {
  let items = listAssessmentHistory(project)
  if (filter.health) items = items.filter(e => e.assessment.engineeringHealth === filter.health)
  if (filter.dateRange) items = items.filter(e => inDateRange(e.timestamp, filter.dateRange))
  return paginate(items, page)
}
