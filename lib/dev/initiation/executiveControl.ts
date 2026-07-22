import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import { getDirectorStatus } from '../director/directorRuntimeStore'
import { listInitiationRequests } from './initiationStore'
import type { ExecutiveControlDecision } from './initiationTypes'

/**
 * Executive Go / Hold Control — storage. Append-only, never mutated or
 * deleted, mirroring riskGate.ts's permanent-governance shape exactly.
 * Multiple decisions can exist for one initiation (Hold now, Go later —
 * requirement 7), so this is a history, not a single mutable field.
 */

const FILE = 'initiation-executive-control-decisions.json'

export function appendExecutiveControlDecision(decision: ExecutiveControlDecision): ExecutiveControlDecision {
  updateJsonStore<ExecutiveControlDecision[]>(FILE, [], current => [decision, ...current])
  return decision
}

export function listExecutiveControlDecisions(initiationId: string): ExecutiveControlDecision[] {
  return readJsonStore<ExecutiveControlDecision[]>(FILE, []).filter(d => d.initiationId === initiationId)
}

/**
 * True if `project` was provisioned through Project Initiation and is
 * still waiting on its first Go decision — the fact the Cross-Project
 * Scheduler (lib/dev/scheduler/) must respect so it never starts a
 * Held-or-undecided project on its own regular cadence (requirement 1:
 * "Provisioning shall no longer automatically start autonomous
 * execution" — which the Scheduler's independent eligibility scan would
 * otherwise still do, immediately, since a freshly-provisioned project
 * has real batches and an Idle Director, exactly what the Scheduler
 * looks for). False for a project with no Initiation history at all
 * (created via the older manual admin form, or predating this
 * subsystem) — the Scheduler's existing behavior for those is untouched,
 * and false once execution has actually started (via Go, or via the
 * pre-Executive-Control auto-start behavior grandfathered projects
 * already went through).
 */
export function isAwaitingExecutiveGoDecision(project: string): boolean {
  if (getDirectorStatus(project).state !== 'Idle') return false
  const provisioned = listInitiationRequests(project).find(i => i.status === 'Provisioned')
  if (!provisioned) return false
  const decisions = listExecutiveControlDecisions(provisioned.id)
  return !decisions.some(d => d.decision === 'Go')
}
