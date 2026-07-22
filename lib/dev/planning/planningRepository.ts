import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import { currentDevActor } from '../auth'
import { publish } from '../events/eventBus'
import { applyHumanApprovalDecision } from './planningEngine'
import type { PlanningHistoryRecord } from './planningTypes'

/**
 * Server-side, file-backed history of every generated plan — same
 * pattern as assessmentRepository.ts/operationsHistoryStorage.ts. This
 * is the only storage the Planning Engine touches: a plan record and
 * its later approval/execution outcome, append-only for the plan
 * itself, updated in place only for the approval/execution fields a
 * later step legitimately fills in. Never writes to milestonesStorage,
 * batchesStorage, or queueStorage — approving a plan here does not
 * create real project work by itself.
 *
 * PRA-P1-010 remediation: reads/writes now go through fileJsonStore.ts's
 * readJsonStore/updateJsonStore — the same locked primitive every other
 * store in the codebase uses — instead of raw fs.readFileSync/
 * writeFileSync. Previously, two concurrent writes (two browser tabs, or
 * an approval racing a persisted assessment run) could interleave their
 * own read-modify-write cycles and silently lose one side's write;
 * updateJsonStore holds a real cross-process file lock across the whole
 * read-mutate-write cycle so that can no longer happen.
 */
const STORE_FILE = 'planning-history.json'
const MAX_HISTORY_PER_PROJECT = 200

export function readPlanningHistory(projectSlug?: string): PlanningHistoryRecord[] {
  const all = readJsonStore<PlanningHistoryRecord[]>(STORE_FILE, [])
  return projectSlug ? all.filter(r => r.projectSlug === projectSlug) : all
}

export function latestPlanningRecord(projectSlug: string): PlanningHistoryRecord | null {
  const history = readPlanningHistory(projectSlug)
  return [...history].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))[0] ?? null
}

/** Idempotent on id — re-posting the same plan (a retried request) never duplicates it. Runs inside updateJsonStore's file lock (PRA-P1-010). */
export function appendPlanningRecord(record: PlanningHistoryRecord): void {
  updateJsonStore<PlanningHistoryRecord[]>(STORE_FILE, [], all => {
    if (all.some(r => r.id === record.id)) return all

    const forProject = all.filter(r => r.projectSlug === record.projectSlug)
    const others = all.filter(r => r.projectSlug !== record.projectSlug)
    const trimmed = [record, ...forProject].slice(0, MAX_HISTORY_PER_PROJECT)
    return [...trimmed, ...others]
  })
}

/**
 * Fills in an execution outcome for a plan that already exists — never
 * an approval outcome. approvalResult/plan.approvalStatus are
 * deliberately NOT accepted here; PRA-P1-008 found that this route used
 * to trust a client-supplied approvalStatus with no server-side check,
 * letting a plan reach 'Approved' without ever passing through
 * applyHumanApprovalDecision's 'Director Reviewed' precondition. Recording
 * an approval/rejection now only ever happens through
 * applyApprovalDecision below. Returns null if the record isn't found
 * (never creates one).
 */
export function updatePlanningRecord(
  id: string,
  patch: Partial<Pick<PlanningHistoryRecord, 'executionResult' | 'actualDurationHours' | 'success' | 'varianceHours'>>
): PlanningHistoryRecord | null {
  let result: PlanningHistoryRecord | null = null
  updateJsonStore<PlanningHistoryRecord[]>(STORE_FILE, [], all => {
    const idx = all.findIndex(r => r.id === id)
    if (idx === -1) return all
    const updated = { ...all[idx], ...patch }
    result = updated
    const copy = [...all]
    copy[idx] = updated
    return copy
  })
  return result
}

export type ApprovalDecisionResult = { ok: true; record: PlanningHistoryRecord } | { ok: false; error: string }

/**
 * PRA-P1-008 remediation — the one server-side path that can ever move a
 * plan to 'Approved'/'Rejected'. Re-derives the outcome through
 * applyHumanApprovalDecision (planningEngine.ts) — the single function
 * this whole engine designates as "the only function... allowed to set
 * approvalStatus to Approved or Rejected, and only from Director
 * Reviewed" — against the plan as currently stored here, never against a
 * client-supplied approvalStatus. If the stored plan isn't
 * 'Director Reviewed', applyHumanApprovalDecision is a no-op by its own
 * contract; that is treated as a rejected write (not a silent 200), so a
 * caller can never be misled into thinking a decision took effect when
 * it didn't.
 *
 * PRA-P1-009 remediation: decidedBy/decidedAt are populated from
 * currentDevActor()/the current time at the moment the decision is
 * actually recorded — mirroring ReleaseControlDecision's/
 * RiskGateDecision's attribution, so there is a durable record of who
 * approved or rejected a plan and when, not just that it happened.
 *
 * PRA-P1-010 remediation: the read-check-write cycle now runs entirely
 * inside updateJsonStore's single file lock, so the CAS this function
 * performs (only write if the plan is still 'Director Reviewed' at the
 * moment of writing) can never be split by a concurrent writer the way a
 * separate read-then-write could.
 *
 * PRA-P1-011 remediation: publishes a 'Planning Changes' event on an
 * actual successful write (never on the rejected-decision branch) —
 * previously nothing in this subsystem ever published anything, so
 * Metrics/Certification/the Live Command Centre never learned a plan had
 * been approved or rejected. Published from here (the one function that
 * can ever record the outcome) rather than from the API route, so every
 * caller gets correct eventing automatically instead of each call site
 * needing to remember to publish separately.
 */
export function applyApprovalDecision(id: string, decision: 'Approved' | 'Rejected'): ApprovalDecisionResult {
  let errorMessage: string | null = null
  let recordOut: PlanningHistoryRecord | null = null

  updateJsonStore<PlanningHistoryRecord[]>(STORE_FILE, [], all => {
    const idx = all.findIndex(r => r.id === id)
    if (idx === -1) {
      errorMessage = 'Planning record not found'
      return all
    }

    const current = all[idx]
    const decidedPlan = applyHumanApprovalDecision(current.plan, decision)
    if (decidedPlan.approvalStatus !== decision) {
      errorMessage = `Cannot record '${decision}' — plan is '${current.plan.approvalStatus}', not 'Director Reviewed'.`
      return all
    }

    const updated: PlanningHistoryRecord = {
      ...current,
      plan: decidedPlan,
      approvalResult: decision,
      decidedBy: currentDevActor(),
      decidedAt: new Date().toISOString(),
    }
    recordOut = updated
    const copy = [...all]
    copy[idx] = updated
    return copy
  })

  if (recordOut) {
    const record: PlanningHistoryRecord = recordOut
    publish({
      category: 'Planning Changes',
      project: record.projectSlug,
      type: decision === 'Approved' ? 'plan-approved' : 'plan-rejected',
      payload: { planId: record.plan.id, historyRecordId: record.id, decidedBy: record.decidedBy },
    })
    return { ok: true, record }
  }

  return { ok: false, error: errorMessage ?? 'Failed to record decision.' }
}
