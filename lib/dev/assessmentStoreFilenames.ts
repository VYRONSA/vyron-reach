/**
 * PRA-P1-003 remediation — the single shared source of truth for the
 * filenames of VYRON DEV's two independent assessment history stores.
 * Before this fix, lib/dev/assessment/assessmentRepository.ts (the
 * read-only Engineering Assessment Engine's own history of
 * AssessmentSnapshot[]) and lib/dev/director/assessment/assessmentStore.ts
 * (the autonomous Director's own history of AssessmentHistoryEntry[]) both
 * independently hardcoded the literal string 'assessment-history.json',
 * which resolved to the exact same absolute path in every non-simulation
 * deployment — each subsystem's write silently clobbered the other's
 * entire history, and a reader of one shape could parse the other's JSON
 * into garbage. Both stores now import their filename from here instead of
 * hardcoding it, so this is the one place a future filename change (or a
 * new store) can collide, and assertAssessmentStoreFilenamesAreDistinct
 * below is checked once at server startup (instrumentation.ts) to catch
 * that immediately rather than as silent data corruption in production.
 */

/** lib/dev/assessment/assessmentRepository.ts — AssessmentSnapshot[] history for the read-only Engineering Assessment Engine. Unchanged filename: this subsystem keeps the original name. */
export const ENGINEERING_ASSESSMENT_HISTORY_FILE: string = 'assessment-history.json'

/** lib/dev/director/assessment/assessmentStore.ts — AssessmentHistoryEntry[] history for the autonomous Director's own assessment service. Renamed away from the collision. */
export const DIRECTOR_ASSESSMENT_HISTORY_FILE: string = 'director-assessment-history.json'

/** Throws immediately (rather than corrupting data later) if the two assessment stores ever end up sharing a filename again. */
export function assertAssessmentStoreFilenamesAreDistinct(): void {
  if (ENGINEERING_ASSESSMENT_HISTORY_FILE === DIRECTOR_ASSESSMENT_HISTORY_FILE) {
    throw new Error(
      `PRA-P1-003 regression: ENGINEERING_ASSESSMENT_HISTORY_FILE and DIRECTOR_ASSESSMENT_HISTORY_FILE both resolve to '${ENGINEERING_ASSESSMENT_HISTORY_FILE}' — these must remain distinct filenames or the two assessment subsystems will silently corrupt each other's history.`
    )
  }
}
