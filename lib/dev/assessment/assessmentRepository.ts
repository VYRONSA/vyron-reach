import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import { ENGINEERING_ASSESSMENT_HISTORY_FILE } from '../assessmentStoreFilenames'
import type { AssessmentSnapshot } from './assessmentTypes'

/**
 * Server-side, file-backed history of Assessment Snapshots — same
 * pattern as operationsHistoryStorage.ts/runtimeStorage.ts. Every
 * assessment run becomes historical data, append-only, never
 * overwritten or edited; this is the only storage the Assessment
 * Engine touches, and it never writes anywhere else (no project files,
 * no repository, no milestones/batches/tasks).
 *
 * PRA-P1-003 remediation: the filename is imported from
 * assessmentStoreFilenames.ts (the one shared source of truth for it,
 * so it can never silently drift back into colliding with the
 * Director's own assessment store).
 *
 * PRA-P1-004 remediation: reads/writes now go through fileJsonStore.ts's
 * readJsonStore/updateJsonStore — the same locked primitive every other
 * store in the codebase uses — instead of raw fs.readFileSync/
 * writeFileSync. Previously, two concurrent appendAssessmentSnapshot
 * calls (two browser tabs, or the Assessment panel racing the Planning
 * Centre's own background assessment) could interleave their own
 * read-modify-write cycles and silently lose one side's snapshot;
 * updateJsonStore holds a real cross-process file lock across the whole
 * read-mutate-write cycle so that can no longer happen.
 */
const MAX_HISTORY_PER_PROJECT = 200

export function readAssessmentHistory(projectSlug?: string): AssessmentSnapshot[] {
  const history = readJsonStore<AssessmentSnapshot[]>(ENGINEERING_ASSESSMENT_HISTORY_FILE, [])
  return projectSlug ? history.filter(h => h.projectSlug === projectSlug) : history
}

/**
 * Idempotent on id — re-posting the same snapshot (e.g. a retried
 * request) never duplicates it. Runs inside updateJsonStore's file lock
 * so two concurrent appends can never interleave and lose one side's
 * snapshot (PRA-P1-004).
 *
 * PRA-P1-005 remediation: returns whether this call actually wrote a new
 * snapshot (true) or found an id already recorded and left the store
 * untouched (false), so the caller (POST /api/dev/assessment) can tell a
 * genuine first-time persist apart from a no-op replay instead of always
 * reporting success regardless of which happened. This is a second line
 * of defense, not the primary fix — the primary fix is
 * buildAssessmentSnapshot's id no longer being millisecond-resolution
 * only (see assessmentEngine.ts), so two genuinely distinct snapshots
 * essentially cannot collide in the first place; this return value just
 * makes the rare case (or a genuine retried request) observable rather
 * than silently indistinguishable from success either way.
 */
export function appendAssessmentSnapshot(snapshot: AssessmentSnapshot): boolean {
  let wrote = false
  updateJsonStore<AssessmentSnapshot[]>(ENGINEERING_ASSESSMENT_HISTORY_FILE, [], all => {
    if (all.some(s => s.id === snapshot.id)) return all
    wrote = true

    const forProject = all.filter(s => s.projectSlug === snapshot.projectSlug)
    const others = all.filter(s => s.projectSlug !== snapshot.projectSlug)
    const trimmedForProject = [snapshot, ...forProject].slice(0, MAX_HISTORY_PER_PROJECT)
    return [...trimmedForProject, ...others]
  })
  return wrote
}

export function latestAssessmentSnapshot(projectSlug: string): AssessmentSnapshot | null {
  const history = readAssessmentHistory(projectSlug)
  return [...history].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))[0] ?? null
}
