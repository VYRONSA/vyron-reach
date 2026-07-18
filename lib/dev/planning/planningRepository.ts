import fs from 'node:fs'
import path from 'node:path'
import type { ApprovalStatus, PlanningHistoryRecord } from './planningTypes'

/**
 * Server-side, file-backed history of every generated plan — same
 * pattern as assessmentRepository.ts/operationsHistoryStorage.ts. This
 * is the only storage the Planning Engine touches: a plan record and
 * its later approval/execution outcome, append-only for the plan
 * itself, updated in place only for the approval/execution fields a
 * later step legitimately fills in. Never writes to milestonesStorage,
 * batchesStorage, or queueStorage — approving a plan here does not
 * create real project work by itself.
 */
const STORE_DIR = path.join(process.cwd(), '.vyron-dev')
const STORE_FILE = path.join(STORE_DIR, 'planning-history.json')
const MAX_HISTORY_PER_PROJECT = 200

function ensureStore(): void {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true })
  if (!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, '[]', 'utf-8')
}

function readAll(): PlanningHistoryRecord[] {
  ensureStore()
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8')) as PlanningHistoryRecord[]
  } catch {
    return []
  }
}

function writeAll(records: PlanningHistoryRecord[]): void {
  ensureStore()
  fs.writeFileSync(STORE_FILE, JSON.stringify(records, null, 2), 'utf-8')
}

export function readPlanningHistory(projectSlug?: string): PlanningHistoryRecord[] {
  const all = readAll()
  return projectSlug ? all.filter(r => r.projectSlug === projectSlug) : all
}

export function latestPlanningRecord(projectSlug: string): PlanningHistoryRecord | null {
  const history = readPlanningHistory(projectSlug)
  return [...history].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))[0] ?? null
}

/** Idempotent on id — re-posting the same plan (a retried request) never duplicates it. */
export function appendPlanningRecord(record: PlanningHistoryRecord): void {
  const all = readAll()
  if (all.some(r => r.id === record.id)) return

  const forProject = all.filter(r => r.projectSlug === record.projectSlug)
  const others = all.filter(r => r.projectSlug !== record.projectSlug)
  const trimmed = [record, ...forProject].slice(0, MAX_HISTORY_PER_PROJECT)
  writeAll([...trimmed, ...others])
}

/** The only mutation this store allows — filling in an approval or execution outcome for a plan that already exists. Returns null if the record isn't found (never creates one). */
export function updatePlanningRecord(
  id: string,
  patch: Partial<Pick<PlanningHistoryRecord, 'approvalResult' | 'executionResult' | 'actualDurationHours' | 'success' | 'varianceHours'>> & {
    approvalStatus?: ApprovalStatus
  }
): PlanningHistoryRecord | null {
  const all = readAll()
  const idx = all.findIndex(r => r.id === id)
  if (idx === -1) return null

  const { approvalStatus, ...recordPatch } = patch
  const updatedPlan = approvalStatus ? { ...all[idx].plan, approvalStatus } : all[idx].plan
  all[idx] = { ...all[idx], ...recordPatch, plan: updatedPlan }
  writeAll(all)
  return all[idx]
}
