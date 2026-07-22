import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import { paginate, inDateRange, buildSearchIndex, searchWithIndex } from '../query/queryHelpers'
import type { PageRequest, PageResult, DateRangeFilter } from '../query/queryTypes'
import type { KnowledgeRecordBase } from './knowledgeTypes'

/**
 * File-backed persistence for every Knowledge Service domain — built
 * entirely on the existing atomic primitives (readJsonStore/updateJsonStore
 * from lib/dev/director/fileJsonStore.ts, themselves on fileLock.ts's
 * write-then-rename + cross-process mutex). No new persistence mechanism.
 * One JSON file per domain, each a flat append-only array (newest first),
 * mirroring directorHistoryStore.ts's shape but WITHOUT its MAX_ENTRIES
 * cap — these are permanent engineering records, not a debug log.
 */

export const KNOWLEDGE_FILES = {
  handovers: 'knowledge-handovers.json',
  architectureDecisions: 'knowledge-architecture-decisions.json',
  businessDecisions: 'knowledge-business-decisions.json',
  technicalDebt: 'knowledge-technical-debt.json',
  risks: 'knowledge-risks.json',
  journal: 'knowledge-journal.json',
  milestoneCompletions: 'knowledge-milestone-completions.json',
  batchCompletions: 'knowledge-batch-completions.json',
  verifications: 'knowledge-verifications.json',
  releases: 'knowledge-releases.json',
  incidents: 'knowledge-incidents.json',
  timeline: 'knowledge-timeline.json',
} as const

export type KnowledgeDomain = keyof typeof KNOWLEDGE_FILES

/** Appended under updateJsonStore's file lock — concurrent appends (two batches completing for different projects, or a recovery pass racing a live loop) can never lose one side's record. */
export function appendKnowledgeRecord<T extends KnowledgeRecordBase>(domain: KnowledgeDomain, record: T): T {
  updateJsonStore<T[]>(KNOWLEDGE_FILES[domain], [], records => [record, ...records])
  return record
}

export function listKnowledgeRecords<T extends KnowledgeRecordBase>(domain: KnowledgeDomain, project: string): T[] {
  return readJsonStore<T[]>(KNOWLEDGE_FILES[domain], []).filter(r => r.project === project)
}

export function listAllKnowledgeRecords<T extends KnowledgeRecordBase>(domain: KnowledgeDomain): T[] {
  return readJsonStore<T[]>(KNOWLEDGE_FILES[domain], [])
}

export function countKnowledgeRecords(domain: KnowledgeDomain, project: string): number {
  return listKnowledgeRecords(domain, project).length
}

/**
 * Enterprise Scalability (Version 2.0 Phase 5, Milestone 5.2) — one
 * generic paginated/filtered/searched query, reused across every
 * Knowledge domain (handovers, architecture/business decisions,
 * technical debt, risks, journal, milestone/batch completions, timeline)
 * at once, satisfying both "Timeline" and "Knowledge History" from the
 * pagination requirements with a single function.
 *
 * Deliberately NOT paired with archiving/retention the way the
 * operational stores (Inbox, Notifications, Deliveries) are:
 * knowledgeTypes.ts's own docs are explicit that these are "permanent,
 * append-only engineering records... never capped/truncated," a hard
 * requirement predating this milestone — "extend existing services only"
 * means respecting that invariant, not overriding it. Server-side
 * pagination still fully addresses "large datasets must never be loaded
 * entirely" without moving anything out of the live store.
 */
export type KnowledgeQueryFilter = {
  dateRange?: DateRangeFilter
  /** Indexed against every string field the specific record type has via `extractText`. */
  search?: string
}

export function queryKnowledgeRecords<T extends KnowledgeRecordBase>(
  domain: KnowledgeDomain,
  project: string,
  filter: KnowledgeQueryFilter = {},
  page: PageRequest = {},
  extractText?: (record: T) => string
): PageResult<T> {
  let records = listKnowledgeRecords<T>(domain, project)
  if (filter.dateRange) records = records.filter(r => inDateRange(r.timestamp, filter.dateRange))
  if (filter.search && extractText) {
    const index = buildSearchIndex(records, extractText)
    records = searchWithIndex(records, index, filter.search)
  }
  return paginate(records, page)
}
