import fs from 'node:fs'
import path from 'node:path'
import type { AssessmentSnapshot } from './assessmentTypes'

/**
 * Server-side, file-backed history of Assessment Snapshots — same
 * pattern as operationsHistoryStorage.ts/runtimeStorage.ts. Every
 * assessment run becomes historical data, append-only, never
 * overwritten or edited; this is the only storage the Assessment
 * Engine touches, and it never writes anywhere else (no project files,
 * no repository, no milestones/batches/tasks).
 */
const STORE_DIR = path.join(process.cwd(), '.vyron-dev')
const STORE_FILE = path.join(STORE_DIR, 'assessment-history.json')
const MAX_HISTORY_PER_PROJECT = 200

function ensureStore(): void {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true })
  if (!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, '[]', 'utf-8')
}

export function readAssessmentHistory(projectSlug?: string): AssessmentSnapshot[] {
  ensureStore()
  let history: AssessmentSnapshot[]
  try {
    history = JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8')) as AssessmentSnapshot[]
  } catch {
    return []
  }
  return projectSlug ? history.filter(h => h.projectSlug === projectSlug) : history
}

/** Idempotent on id — re-posting the same snapshot (e.g. a retried request) never duplicates it. */
export function appendAssessmentSnapshot(snapshot: AssessmentSnapshot): void {
  ensureStore()
  const all = readAssessmentHistory()
  if (all.some(s => s.id === snapshot.id)) return

  const forProject = all.filter(s => s.projectSlug === snapshot.projectSlug)
  const others = all.filter(s => s.projectSlug !== snapshot.projectSlug)
  const trimmedForProject = [snapshot, ...forProject].slice(0, MAX_HISTORY_PER_PROJECT)

  fs.writeFileSync(STORE_FILE, JSON.stringify([...trimmedForProject, ...others], null, 2), 'utf-8')
}

export function latestAssessmentSnapshot(projectSlug: string): AssessmentSnapshot | null {
  const history = readAssessmentHistory(projectSlug)
  return [...history].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))[0] ?? null
}
