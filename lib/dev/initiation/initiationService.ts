import { randomUUID } from 'node:crypto'
import * as planningStateService from '../planningState/planningStateService'
import { publish } from '../events/eventBus'
import { raiseNotification } from '../notifications/notificationService'
import { recordTimelineEvent } from '../knowledge/knowledgeService'
import { insertInitiationRequest, getInitiationRequest, listInitiationRequests, updateInitiationRequest } from './initiationStore'
import { appendInitiationEvent } from './initiationEventStore'
import { computeProgrammeFingerprint, validateProgrammeCandidate } from './initiationGenerationValidation'
import { findUnresolvedHighRisks, listRiskGateDecisions } from './riskGate'
import type {
  InitiationEventType,
  InitiationRequest,
  InitiationStatus,
  GeneratedPlanCandidate,
  ProvisionResult,
  ReviewValidationResult,
  KnowledgeDiscoverySummary,
} from './initiationTypes'
import type { Project } from '../planningState/planningStateTypes'

/**
 * Project Initiation's state machine and only writer (Version 1.0). Every
 * mutating export here goes through applyTransition — a compare-and-swap
 * on `status` inside initiationStore.ts's file lock — so two concurrent
 * requests racing to advance the same InitiationRequest can never both
 * succeed silently. See the approved plan
 * (C:\Users\humres\.claude\plans\eager-bubbling-trinket.md) for the full
 * Draft -> Generating -> Review -> Approved -> Provisioning -> Provisioned
 * diagram this file implements.
 */

export const MAX_GENERATION_ATTEMPTS = 5

function nowISO(): string {
  return new Date().toISOString()
}

export class InitiationNotFoundError extends Error {
  constructor(id: string) {
    super(`InitiationRequest '${id}' not found.`)
    this.name = 'InitiationNotFoundError'
  }
}

export class InitiationConflictError extends Error {
  constructor(
    public readonly id: string,
    public readonly actualStatus: InitiationStatus,
    public readonly allowed: InitiationStatus[]
  ) {
    super(`InitiationRequest '${id}' is '${actualStatus}', expected one of: ${allowed.join(', ')}.`)
    this.name = 'InitiationConflictError'
  }
}

export class InitiationAttemptLimitError extends Error {
  constructor(id: string, limit: number) {
    super(`InitiationRequest '${id}' has reached the generation attempt limit (${limit}). Edit the directive text before retrying.`)
    this.name = 'InitiationAttemptLimitError'
  }
}

/** Raised when createInitiation's project-slug reservation loses the atomic race in planningStateService.createProject — surfaced in this module's own error vocabulary since no InitiationRequest exists yet at this point (there is no `id` to attach a conflict to). */
export class InitiationSlugTakenError extends Error {
  constructor(public readonly slug: string) {
    super(`Project slug '${slug}' already exists.`)
    this.name = 'InitiationSlugTakenError'
  }
}

/**
 * Raised whenever a mandatory validation checkpoint (Approval,
 * Provisioning) is not satisfied: the programme itself fails the
 * validator, or — at Provisioning — the version that was actually
 * approved no longer matches the version about to be committed. This is
 * the enforcement mechanism behind "validation is the single source of
 * truth": every path that would otherwise skip straight to a state
 * transition is blocked here first.
 */
export class InitiationValidationError extends Error {
  constructor(id: string, reason: string) {
    super(`InitiationRequest '${id}' failed mandatory validation: ${reason}`)
    this.name = 'InitiationValidationError'
  }
}

/**
 * Raised by beginProvisioning when one or more High-severity risks in
 * the reviewed programme have no covering 'Accept Risk' decision — the
 * actual enforcement mechanism behind "Executive approval must not
 * permit progression into Provisioning while unresolved High or Critical
 * risks remain." See riskGate.ts's findUnresolvedHighRisks.
 */
export class InitiationRiskGateRequiredError extends Error {
  constructor(
    id: string,
    public readonly unresolvedRisks: { tempId: string; title: string }[]
  ) {
    super(
      `InitiationRequest '${id}' has ${unresolvedRisks.length} unresolved High-severity risk(s) requiring an Executive Risk Gate decision before provisioning: ${unresolvedRisks.map(r => r.title).join(', ')}`
    )
    this.name = 'InitiationRiskGateRequiredError'
  }
}

/** Raised by riskGateService.ts's submitRiskGateDecision for a malformed decision submission (missing reason, unknown decision type, a riskTempId that doesn't resolve, or targeting a non-High risk). */
export class InitiationRiskGateInputError extends Error {
  constructor(id: string, reason: string) {
    super(`InitiationRequest '${id}': invalid Risk Gate decision — ${reason}`)
    this.name = 'InitiationRiskGateInputError'
  }
}

/** Raised by executiveControlService.ts's submitExecutiveControlDecision for a malformed decision submission (missing reason, unknown decision type, or submitted while the record isn't Provisioned). */
export class InitiationExecutiveControlInputError extends Error {
  constructor(id: string, reason: string) {
    super(`InitiationRequest '${id}': invalid Executive Control decision — ${reason}`)
    this.name = 'InitiationExecutiveControlInputError'
  }
}

/** Maps this module's own error types to an HTTP status/message — a single place every API route can call from its catch block rather than each re-implementing instanceof checks for every error class this module defines. Returns null for anything else, so the route can rethrow/500 as usual. */
export function describeInitiationError(err: unknown): { status: number; error: string } | null {
  if (err instanceof InitiationNotFoundError) return { status: 404, error: err.message }
  if (err instanceof InitiationConflictError) return { status: 409, error: err.message }
  if (err instanceof InitiationAttemptLimitError) return { status: 409, error: err.message }
  if (err instanceof InitiationValidationError) return { status: 409, error: err.message }
  if (err instanceof InitiationSlugTakenError) return { status: 409, error: err.message }
  if (err instanceof InitiationRiskGateRequiredError) return { status: 409, error: err.message }
  if (err instanceof InitiationRiskGateInputError) return { status: 400, error: err.message }
  if (err instanceof InitiationExecutiveControlInputError) return { status: 400, error: err.message }
  return null
}

function recordEvent(initiationId: string, project: string, type: InitiationEventType, detail: string, actor: string): void {
  appendInitiationEvent({ id: randomUUID(), initiationId, project, type, detail, actor, timestamp: nowISO() })
}

function publishInitiationEvent(request: InitiationRequest, type: string): void {
  publish({ category: 'Project Initiation', project: request.project, type, payload: { initiationId: request.id, status: request.status } })
}

/**
 * The one place a status transition is actually applied. Throws
 * InitiationConflictError/InitiationNotFoundError rather than returning a
 * sentinel, so every caller (API routes, initiationGenerationService.ts,
 * initiationProvisioningService.ts) gets identical handling via one
 * try/catch — the same 409-on-conflict shape the existing handoff route
 * already uses for the same class of problem.
 */
function applyTransition(
  id: string,
  allowedFrom: InitiationStatus[],
  patch: (current: InitiationRequest) => Partial<InitiationRequest>
): InitiationRequest {
  const result = updateInitiationRequest(id, current => {
    if (!allowedFrom.includes(current.status)) return null
    return { ...current, ...patch(current), updatedAt: nowISO() }
  })
  if (result) return result

  const current = getInitiationRequest(id)
  if (!current) throw new InitiationNotFoundError(id)
  throw new InitiationConflictError(id, current.status, allowedFrom)
}

// ---- Reads ----

export function getInitiation(id: string): InitiationRequest | null {
  return getInitiationRequest(id)
}

export function listInitiations(project?: string): InitiationRequest[] {
  return listInitiationRequests(project)
}

// ---- Draft ----

export type CreateInitiationInput = {
  projectSlug: string
  projectName: string
  projectCategory: string
  directiveTitle: string
  directiveText: string
  submittedBy: string
}

/**
 * Reserves the project slug immediately (planningStateService.createProject,
 * status 'planning') and creates a Draft InitiationRequest against it — the
 * core design decision from the approved plan: generation/review/approval
 * all happen against a real, already-existing project shell, which is also
 * what makes the Scheduler's existing hasAvailableWork() gate (zero
 * batches until Provisioning) sufficient with no new guard code anywhere
 * else. createProject() itself reserves the slug atomically (check and
 * insert inside one file lock — see planningStateStore.ts's
 * reservePlanningProject); the caller may still perform its own
 * isProjectSlugTaken() pre-check for a fast, no-write-attempt UX path
 * (the same split of responsibility POST /api/dev/planning/projects
 * already uses), but that pre-check is advisory only. A collision that
 * slips past it — two concurrent submissions of the same slug — is
 * caught here instead, by catching createProject()'s
 * ProjectSlugTakenError and re-throwing it in this module's own error
 * vocabulary (no InitiationRequest exists yet to attach a conflict to).
 */
export function createInitiation(input: CreateInitiationInput): InitiationRequest {
  let project: Project
  try {
    project = planningStateService.createProject({
      slug: input.projectSlug,
      name: input.projectName,
      description: input.directiveText,
      category: input.projectCategory,
      status: 'planning',
      progress: 0,
      color: '',
      icon: '',
    })
  } catch (err) {
    if (err instanceof planningStateService.ProjectSlugTakenError) {
      throw new InitiationSlugTakenError(err.slug)
    }
    throw err
  }

  const now = nowISO()
  const record: InitiationRequest = {
    id: randomUUID(),
    project: project.slug,
    directiveTitle: input.directiveTitle.trim(),
    directiveText: input.directiveText,
    submittedBy: input.submittedBy,
    status: 'Draft',
    generationModel: null,
    generationAttempts: 0,
    lastGenerationError: null,
    knowledgeDiscovery: null,
    generatedProgramme: null,
    reviewedProgramme: null,
    reviewNotes: '',
    reviewValidation: null,
    approvedBy: null,
    approvedAt: null,
    approvedProgrammeFingerprint: null,
    provisionResult: null,
    provisioningError: null,
    cancelledBy: null,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now,
  }
  insertInitiationRequest(record)
  recordEvent(record.id, record.project, 'Submitted', `Executive Directive "${record.directiveTitle}" submitted for project "${project.slug}".`, input.submittedBy)
  publishInitiationEvent(record, 'submitted')
  void raiseNotification({
    type: 'Project Initiation Submitted',
    project: record.project,
    title: 'Executive Directive submitted',
    message: `"${record.directiveTitle}" was submitted and is ready to generate an engineering programme.`,
    severity: 'Info',
    metadata: { initiationId: record.id },
  })
  return record
}

/** Draft (or GenerationFailed, before retrying) only: editing the directive text/title. */
export function updateDirective(id: string, patch: { directiveTitle?: string; directiveText?: string }): InitiationRequest {
  return applyTransition(id, ['Draft', 'GenerationFailed'], () => ({
    ...(patch.directiveTitle !== undefined ? { directiveTitle: patch.directiveTitle.trim() } : {}),
    ...(patch.directiveText !== undefined ? { directiveText: patch.directiveText } : {}),
  }))
}

/**
 * Review-only: editing the human working copy. generatedProgramme (the
 * raw LLM output) is never touched here — see the type's own doc
 * comment. Any change to `reviewedProgramme` unconditionally resets
 * `reviewValidation` to null: the previous validation result described a
 * version of the programme that no longer exists, so it can no longer be
 * used to satisfy Approval's or Provisioning's mandatory checkpoint.
 * `reviewNotes`-only edits do not invalidate — the validator never reads
 * that field.
 */
export function updateReview(id: string, patch: { reviewedProgramme?: GeneratedPlanCandidate; reviewNotes?: string }): InitiationRequest {
  const result = applyTransition(id, ['Review'], () => ({
    ...(patch.reviewedProgramme !== undefined ? { reviewedProgramme: patch.reviewedProgramme, reviewValidation: null } : {}),
    ...(patch.reviewNotes !== undefined ? { reviewNotes: patch.reviewNotes } : {}),
  }))
  recordEvent(id, result.project, 'ReviewEdited', 'Reviewed programme edited.', result.submittedBy)
  publishInitiationEvent(result, 'review-edited')
  return result
}

/**
 * Explicit, Review-only re-validation of the current reviewedProgramme —
 * lets a reviewer check "does my edited draft still pass?" without
 * committing to Approve. Approval and Provisioning each run this exact
 * same check again themselves (inside their own atomic transition, to
 * close the gap between "validated here" and "approved/provisioned a
 * moment later"), so calling this first is a convenience, never a
 * substitute for their own enforcement.
 */
export function validateReview(id: string): InitiationRequest {
  const result = applyTransition(id, ['Review'], current => {
    const programme = current.reviewedProgramme
    if (!programme) throw new InitiationValidationError(id, 'No reviewed programme exists to validate.')
    const fingerprint = computeProgrammeFingerprint(programme)
    const validation = validateProgrammeCandidate(programme)
    const reviewValidation: ReviewValidationResult = {
      fingerprint,
      validatedAt: nowISO(),
      valid: validation.valid,
      reason: validation.valid ? null : validation.reason,
    }
    return { reviewValidation }
  })
  if (result.reviewValidation?.valid) {
    recordEvent(id, result.project, 'ReviewValidated', 'Reviewed programme passed validation.', result.submittedBy)
    publishInitiationEvent(result, 'review-validated')
  } else {
    recordEvent(id, result.project, 'ReviewValidationFailed', result.reviewValidation?.reason ?? 'Validation failed.', result.submittedBy)
    publishInitiationEvent(result, 'review-validation-failed')
  }
  return result
}

const CANCELLABLE: InitiationStatus[] = ['Draft', 'Generating', 'GenerationFailed', 'Review', 'Approved', 'Provisioning', 'ProvisioningFailed']

/** Archives (never hard-deletes) the reserved project — matches the codebase's non-destructive bias (archive/restore pairs exist for every other entity; hard delete is the exception, not the rule). */
export function cancelInitiation(id: string, actor: string): InitiationRequest {
  const result = applyTransition(id, CANCELLABLE, () => ({
    status: 'Cancelled',
    cancelledBy: actor,
    cancelledAt: nowISO(),
  }))
  planningStateService.updateProject(result.project, { archived: true })
  recordEvent(id, result.project, 'Cancelled', `Cancelled by ${actor}.`, actor)
  publishInitiationEvent(result, 'cancelled')
  return result
}

// ---- Generation ----
// initiationGenerationService.ts owns the actual LLM call/prompt/validation
// and drives these three transition primitives around it.

/** Draft/GenerationFailed (the normal path), or Review — a reviewer who doesn't want the current draft programme can discard it and ask for a fresh one, same attempt-capped budget. */
export function beginGeneration(id: string): InitiationRequest {
  const current = getInitiationRequest(id)
  if (!current) throw new InitiationNotFoundError(id)
  if (current.generationAttempts >= MAX_GENERATION_ATTEMPTS) throw new InitiationAttemptLimitError(id, MAX_GENERATION_ATTEMPTS)

  const result = applyTransition(id, ['Draft', 'GenerationFailed', 'Review'], c => ({
    status: 'Generating',
    generationAttempts: c.generationAttempts + 1,
    lastGenerationError: null,
  }))
  recordEvent(id, result.project, 'GenerationStarted', `Generation attempt ${result.generationAttempts}.`, result.submittedBy)
  publishInitiationEvent(result, 'generation-started')
  return result
}

/**
 * Records what Knowledge Discovery found for the current generation
 * attempt (see initiationGenerationService.ts's runGeneration) —
 * deliberately bypasses applyTransition's status CAS, same reasoning as
 * recordHandoffWarning below: this is audit/informational data, not a
 * state transition, and must be settable regardless of exactly which
 * status the record is in the instant discovery finishes (it always
 * happens while 'Generating', but nothing about its correctness depends
 * on enforcing that).
 */
export function recordKnowledgeDiscovery(id: string, summary: KnowledgeDiscoverySummary): InitiationRequest | null {
  const result = updateInitiationRequest(id, current => ({ ...current, knowledgeDiscovery: summary, updatedAt: nowISO() }))
  if (result) {
    recordEvent(
      id,
      result.project,
      'KnowledgeDiscoveryCompleted',
      `Consulted ${summary.sourcesConsulted} source(s); found ${summary.itemsFound} relevant item(s); ${summary.gaps.length} gap(s).`,
      result.submittedBy
    )
    publishInitiationEvent(result, 'knowledge-discovery-completed')
  }
  return result
}

export function completeGeneration(id: string, programme: GeneratedPlanCandidate, model: string): InitiationRequest {
  const result = applyTransition(id, ['Generating'], () => ({
    status: 'Review',
    generationModel: model,
    generatedProgramme: programme,
    reviewedProgramme: structuredClone(programme),
    // Cleared unconditionally: on the normal Draft path this is already ''
    // and on a Review -> regenerate path any prior notes described a
    // programme that no longer exists.
    reviewNotes: '',
    // The generation path (initiationGenerationService.ts) only ever
    // calls completeGeneration with a programme that has already passed
    // validateGeneratedPlan — seeding reviewValidation here as "already
    // valid" reflects that fact immediately, rather than showing an
    // untouched draft as "not yet validated" until a reviewer takes an
    // extra action. Any subsequent edit still resets this to null as
    // usual (updateReview).
    reviewValidation: { fingerprint: computeProgrammeFingerprint(programme), validatedAt: nowISO(), valid: true, reason: null },
  }))
  recordEvent(
    id,
    result.project,
    'GenerationSucceeded',
    `Generated ${programme.milestones.length} milestones, ${programme.batches.length} batches, ${programme.risks.length} risks.`,
    result.submittedBy
  )
  publishInitiationEvent(result, 'generation-succeeded')
  return result
}

export function failGeneration(id: string, reason: string): InitiationRequest {
  const result = applyTransition(id, ['Generating'], () => ({
    status: 'GenerationFailed',
    lastGenerationError: reason,
  }))
  recordEvent(id, result.project, 'GenerationFailed', reason, result.submittedBy)
  publishInitiationEvent(result, 'generation-failed')
  return result
}

// ---- Review & Approval ----

/**
 * Review -> Approved, gated by mandatory re-validation. The check runs
 * inside the same atomic transition that flips the status — not against
 * whatever `reviewValidation` happens to already say — so there is no
 * window between "checked" and "approved" for a concurrent edit to slip
 * through (the same reasoning `beginProvisioning` below applies to its
 * own checkpoint). A programme that fails validation is never approved;
 * the record stays in Review and the caller receives the exact reason.
 */
export function approveInitiation(id: string, actor: string): InitiationRequest {
  const result = applyTransition(id, ['Review'], current => {
    const programme = current.reviewedProgramme
    if (!programme) throw new InitiationValidationError(id, 'No reviewed programme exists to approve.')
    const fingerprint = computeProgrammeFingerprint(programme)
    const validation = validateProgrammeCandidate(programme)
    if (!validation.valid) {
      throw new InitiationValidationError(id, `the programme does not pass validation and cannot be approved (${validation.reason})`)
    }
    const reviewValidation: ReviewValidationResult = { fingerprint, validatedAt: nowISO(), valid: true, reason: null }
    return {
      status: 'Approved',
      approvedBy: actor,
      approvedAt: nowISO(),
      reviewValidation,
      approvedProgrammeFingerprint: fingerprint,
    }
  })
  recordEvent(id, result.project, 'Approved', `Approved by ${actor}.`, actor)
  publishInitiationEvent(result, 'approved')
  void raiseNotification({
    type: 'Project Initiation Approved',
    project: result.project,
    title: 'Engineering programme approved',
    message: `"${result.directiveTitle}" was approved by ${actor} and is ready to provision.`,
    severity: 'Info',
    metadata: { initiationId: result.id },
  })
  recordTimelineEvent({
    project: result.project,
    source: 'Manual',
    category: 'Business Decision',
    title: 'Initiation approved',
    detail: `Executive Directive "${result.directiveTitle}" approved by ${actor}.`,
  })
  return result
}

// ---- Executive Risk Gate ----
// riskGateService.ts owns the actual decision-input validation and drives
// these two primitives around it: recordRiskGateAcceptance (Accept Risk —
// no status change, the gate simply becomes satisfied for that risk) and
// returnApprovedToReview (Mitigate Risk / Reject Programme — both send
// the whole record back to Review, per the requirement that a mitigated
// or rejected programme "returns to Review" rather than being partially
// advanced).

/**
 * Doesn't change InitiationRequest.status itself (the decision lives in
 * the permanent riskGate.ts store; this only touches updatedAt) — but
 * unlike recordKnowledgeDiscovery/recordHandoffWarning, which are
 * genuinely status-independent audit notes, an Accept Risk decision is a
 * governance act that should only ever apply to an initiation that is
 * still 'Approved'.
 *
 * PRA-P1-013 remediation: this used to bypass applyTransition's status
 * CAS entirely (a raw updateInitiationRequest with no status check), the
 * one Risk Gate decision type that didn't re-verify status at the moment
 * of recording — unlike its sibling returnApprovedToReview (Mitigate
 * Risk / Reject Programme), which gates on `['Approved']`. That gap let
 * an Accept-Risk decision be recorded against an initiation cancelled
 * moments earlier (submitRiskGateDecision's own top-of-function status
 * check is a real but separate TOCTOU race, not a substitute for this).
 * Now uses the exact same CAS, via an empty patch — the status itself
 * never changes, only updatedAt, but the write only happens at all while
 * still 'Approved'.
 */
export function recordRiskGateAcceptance(id: string, detail: string, actor: string): InitiationRequest {
  const result = applyTransition(id, ['Approved'], () => ({}))
  recordEvent(id, result.project, 'RiskGateDecisionRecorded', detail, actor)
  publishInitiationEvent(result, 'risk-gate-decision-recorded')
  return result
}

/**
 * Approved -> Review, for a Mitigate Risk or Reject Programme Executive
 * Risk Gate decision. Clears approvedBy/approvedAt/approvedProgrammeFingerprint
 * — the programme is no longer in an approved state, so those fields
 * should read exactly as they would before any approval ever happened,
 * not as stale leftovers pointing at a decision that no longer holds.
 * reviewValidation is left untouched: the programme content itself
 * hasn't changed yet just by virtue of this transition, only once a
 * reviewer actually edits it (updateReview) does the existing "any
 * modification invalidates" rule (Version 1.0's mandatory validation
 * checkpoint) kick in — which is exactly the mechanism that satisfies
 * "Mitigated risks must require re-validation before Provisioning."
 */
export function returnApprovedToReview(id: string, actor: string, detail: string): InitiationRequest {
  const result = applyTransition(id, ['Approved'], () => ({
    status: 'Review',
    approvedBy: null,
    approvedAt: null,
    approvedProgrammeFingerprint: null,
  }))
  recordEvent(id, result.project, 'RiskGateDecisionRecorded', detail, actor)
  recordEvent(id, result.project, 'ReturnedToReview', detail, actor)
  publishInitiationEvent(result, 'returned-to-review')
  return result
}

// ---- Provisioning ----
// initiationProvisioningService.ts owns the actual Planning Service
// writes (milestones/batches/risks/dependencies) and drives these
// transition primitives around it. It does NOT hand off into autonomous
// execution — see the Executive Go / Hold Control section below.

/**
 * Approved/ProvisioningFailed/Provisioning -> Provisioning, gated by three
 * checks run inside the same atomic transition:
 *  1. The current reviewedProgramme still passes the validator — nothing
 *     can edit it once Approved today, but this is the defense-in-depth
 *     backstop against any future or indirect path that could.
 *  2. Its fingerprint still matches approvedProgrammeFingerprint — the
 *     exact version a human actually approved, not merely "a version
 *     that happens to currently validate." A mismatch means the approved
 *     version and the about-to-be-committed version have diverged, and
 *     provisioning refuses rather than guessing which one was intended.
 *  3. The Executive Risk Gate: every High-severity risk in the programme
 *     must have a covering 'Accept Risk' decision (riskGate.ts) before
 *     Provisioning is allowed to proceed at all — this is the actual
 *     enforcement of "Executive approval must not permit progression
 *     into Provisioning while unresolved High or Critical risks remain."
 *     A risk with no decision, or one only ever Mitigated/Rejected (which
 *     route the whole record back to Review instead — see
 *     returnApprovedToReview), blocks here.
 * Any failure leaves the record exactly where it was; nothing is written
 * to the Planning Service.
 *
 * PRA-P1-015 remediation: 'Provisioning' is included in allowedFrom so a
 * crash or timeout mid-provisionProgramme (initiationProvisioningService.ts)
 * — which previously left the record permanently stuck, since no source
 * status accepted a retry — can be resumed by simply calling this again.
 * This re-enters the same status (not a new one), re-runs the same three
 * checks above (idempotent), and preserves whatever provisionResult was
 * already persisted (this patch never touches that field), so
 * provisionProgramme's own per-tempId skip logic picks up exactly where
 * it left off instead of duplicating already-committed
 * milestones/batches/risks/dependencies.
 */
export function beginProvisioning(id: string): InitiationRequest {
  const result = applyTransition(id, ['Approved', 'ProvisioningFailed', 'Provisioning'], current => {
    const programme = current.reviewedProgramme
    if (!programme) throw new InitiationValidationError(id, 'No reviewed programme exists to provision.')
    const fingerprint = computeProgrammeFingerprint(programme)
    const validation = validateProgrammeCandidate(programme)
    if (!validation.valid) {
      throw new InitiationValidationError(id, `the approved programme no longer passes validation and cannot be provisioned (${validation.reason})`)
    }
    if (current.approvedProgrammeFingerprint !== fingerprint) {
      throw new InitiationValidationError(id, 'the reviewed programme has changed since it was approved — re-approve the current version before provisioning')
    }
    const unresolved = findUnresolvedHighRisks(programme.risks, listRiskGateDecisions(id))
    if (unresolved.length > 0) {
      throw new InitiationRiskGateRequiredError(id, unresolved.map(r => ({ tempId: r.tempId, title: r.title })))
    }
    const reviewValidation: ReviewValidationResult = { fingerprint, validatedAt: nowISO(), valid: true, reason: null }
    return {
      status: 'Provisioning',
      provisioningError: null,
      reviewValidation,
    }
  })
  recordEvent(id, result.project, 'ProvisioningStarted', 'Provisioning started.', result.submittedBy)
  publishInitiationEvent(result, 'provisioning-started')
  return result
}

/**
 * Merges into the existing provisionResult rather than replacing it, so a
 * crash mid-provisioning leaves behind exactly what was actually
 * committed — the resumability initiationProvisioningService.ts's retry
 * path relies on (skip anything whose tempId already has a real id here).
 */
export function recordProvisionProgress(id: string, partial: Partial<ProvisionResult>): InitiationRequest {
  return applyTransition(id, ['Provisioning'], current => {
    const base: ProvisionResult = current.provisionResult ?? { milestoneIdByTempId: {}, batchIdByTempId: {}, riskIds: [], dependencyIds: [] }
    return {
      provisionResult: {
        milestoneIdByTempId: { ...base.milestoneIdByTempId, ...(partial.milestoneIdByTempId ?? {}) },
        batchIdByTempId: { ...base.batchIdByTempId, ...(partial.batchIdByTempId ?? {}) },
        riskIds: partial.riskIds ?? base.riskIds,
        dependencyIds: partial.dependencyIds ?? base.dependencyIds,
      },
    }
  })
}

export function completeProvisioning(id: string): InitiationRequest {
  const result = applyTransition(id, ['Provisioning'], () => ({ status: 'Provisioned' }))
  recordEvent(id, result.project, 'Provisioned', 'Provisioning completed; real milestones/batches created.', result.submittedBy)
  publishInitiationEvent(result, 'provisioned')
  void raiseNotification({
    type: 'Project Initiation Provisioned',
    project: result.project,
    title: 'Programme provisioned',
    message: `"${result.directiveTitle}" was provisioned and is awaiting an Executive Go/Hold decision before autonomous execution can start.`,
    severity: 'Info',
    metadata: { initiationId: result.id },
  })
  recordTimelineEvent({
    project: result.project,
    source: 'Manual',
    category: 'Business Decision',
    title: 'Programme provisioned',
    detail: `Executive Directive "${result.directiveTitle}" provisioned into real milestones/batches.`,
  })
  return result
}

export function failProvisioning(id: string, reason: string): InitiationRequest {
  const result = applyTransition(id, ['Provisioning'], () => ({
    status: 'ProvisioningFailed',
    provisioningError: reason,
  }))
  recordEvent(id, result.project, 'ProvisioningFailed', reason, result.submittedBy)
  publishInitiationEvent(result, 'provisioning-failed')
  return result
}

/**
 * Records a non-blocking warning when a handoff attempt fails — either a
 * Go decision's handoff call (executiveControlService.ts) failing, while
 * the decision itself still stands. Deliberately bypasses
 * applyTransition's status CAS since this is informational only and must
 * be settable regardless of which status the record already ended up in.
 */
export function recordHandoffWarning(id: string, message: string): InitiationRequest | null {
  return updateInitiationRequest(id, current => ({ ...current, provisioningError: message, updatedAt: nowISO() }))
}

// ---- Executive Go / Hold Control ----
// executiveControlService.ts owns the actual decision-input validation
// and the handoff call itself (lib/dev/initiation/initiationHandoff.ts);
// this is the one primitive it drives — recording that a decision (Go or
// Hold) happened. Neither decision changes InitiationRequest.status:
// the record stays 'Provisioned' either way, since "provisioned" and
// "autonomous execution has started" are now two genuinely separate
// facts (requirement 4 — Hold "leaves the project fully provisioned").
// The decision itself, and whether execution has actually started, live
// in lib/dev/initiation/executiveControl.ts's permanent store and are
// read fresh from there (and from the Director's own runtime status) —
// never mirrored onto this record, the same choice Priority 4's Risk
// Gate decisions already made.

/**
 * Informational only — bypasses applyTransition's status CAS like
 * recordHandoffWarning, for the same reason: a Go/Hold decision never
 * changes InitiationRequest.status itself. Unlike recordRiskGateAcceptance
 * (PRA-P1-013), this is not a governance gap: 'Provisioned' — the only
 * status a Go/Hold decision is ever recorded against — is not in
 * CANCELLABLE, so there is no "cancelled moments earlier" race for this
 * decision type to guard against (the audit's own Section 7 reviewed and
 * passed this gate on exactly that basis).
 */
export function recordExecutiveControlDecision(id: string, detail: string, actor: string): InitiationRequest | null {
  const result = updateInitiationRequest(id, current => ({ ...current, updatedAt: nowISO() }))
  if (result) {
    recordEvent(id, result.project, 'ExecutiveControlDecisionRecorded', detail, actor)
    publishInitiationEvent(result, 'executive-control-decision-recorded')
  }
  return result
}
