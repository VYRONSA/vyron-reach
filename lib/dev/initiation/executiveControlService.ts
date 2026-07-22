import { randomUUID } from 'node:crypto'
import * as initiationService from './initiationService'
import { appendExecutiveControlDecision, listExecutiveControlDecisions } from './executiveControl'
import { attemptHandoff, hasExecutionStarted } from './initiationHandoff'
import { isDuplicateDecision } from './decisionDebounce'
import { recordTimelineEvent } from '../knowledge/knowledgeService'
import type { ExecutiveControlDecision, ExecutiveControlDecisionType, InitiationRequest } from './initiationTypes'

/**
 * Executive Go / Hold Control — the mutating orchestrator. Like
 * riskGateService.ts, this depends on initiationService.ts (for reading
 * the current record) and is only ever imported by API routes, never by
 * initiationService.ts itself.
 */

const DECISION_TYPES: ExecutiveControlDecisionType[] = ['Go', 'Hold']

export type SubmitExecutiveControlDecisionInput = {
  executive: string
  decision: ExecutiveControlDecisionType
  reason: string
}

/**
 * Submits one Executive Go/Hold decision — only valid once the
 * InitiationRequest is 'Provisioned' (Provisioning itself no longer
 * attempts a handoff; see initiationProvisioningService.ts). Recorded
 * permanently either way. A 'Go' decision then attempts the actual
 * handoff via the same buildServerHandoff/startServerDirector path every
 * other execution trigger in this app uses — idempotently: if execution
 * has already started (a prior Go, or a project provisioned before this
 * feature existed under the old auto-start behavior), attemptHandoff is
 * a no-op, so replaying Go is always safe. A 'Hold' decision only
 * records itself; nothing about the provisioned project changes, and a
 * later Go on the same InitiationRequest needs no reprovisioning
 * (requirement 7) since the real Planning Service records already exist.
 */
export function submitExecutiveControlDecision(id: string, input: SubmitExecutiveControlDecisionInput): InitiationRequest {
  const current = initiationService.getInitiation(id)
  if (!current) throw new initiationService.InitiationNotFoundError(id)
  if (current.status !== 'Provisioned') {
    throw new initiationService.InitiationConflictError(id, current.status, ['Provisioned'])
  }
  if (!DECISION_TYPES.includes(input.decision)) {
    throw new initiationService.InitiationExecutiveControlInputError(id, `decision must be one of: ${DECISION_TYPES.join(', ')}.`)
  }
  if (!input.reason?.trim()) {
    throw new initiationService.InitiationExecutiveControlInputError(id, 'reason is required.')
  }

  // PRA-P1-014: a double-click or a retried request submitting the exact
  // same Go/Hold decision (type + reason) within a few seconds is treated
  // as the same decision, not a second one — Go's own handoff attempt is
  // already idempotent (see this function's own doc comment), but the
  // permanent decision record itself had no equivalent protection before
  // this, so a replay used to append a second, identical governance
  // record every time.
  const [mostRecent] = listExecutiveControlDecisions(id)
  if (isDuplicateDecision(mostRecent, d => d.decision === input.decision && d.reason === input.reason.trim())) {
    return initiationService.getInitiation(id) ?? current
  }

  const record: ExecutiveControlDecision = {
    id: randomUUID(),
    initiationId: id,
    project: current.project,
    executive: input.executive,
    decidedAt: new Date().toISOString(),
    decision: input.decision,
    reason: input.reason.trim(),
  }
  appendExecutiveControlDecision(record)

  recordTimelineEvent({
    project: current.project,
    source: 'Manual',
    category: 'Business Decision',
    title: `Executive Control: ${input.decision}`,
    detail: `${input.executive}: ${record.reason}`,
  })

  const detail = `${input.decision} decided by ${input.executive}: ${record.reason}`

  if (input.decision === 'Go') {
    const handoffError = attemptHandoff(current.project)
    if (handoffError) {
      initiationService.recordHandoffWarning(id, `Go decided, but autonomous handoff failed: ${handoffError}`)
    }
  }

  return initiationService.recordExecutiveControlDecision(id, detail, input.executive) ?? current
}

/** Everything the Executive Control UI needs: whether execution has actually started (regardless of how), and the full permanent decision history. */
export function getExecutiveControlStatus(id: string): { started: boolean; decisions: ExecutiveControlDecision[] } {
  const current = initiationService.getInitiation(id)
  if (!current) throw new initiationService.InitiationNotFoundError(id)
  return { started: hasExecutionStarted(current.project), decisions: listExecutiveControlDecisions(id) }
}
