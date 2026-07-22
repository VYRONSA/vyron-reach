import {
  getPlanningProjectsMap,
  getPlanningProject,
  putPlanningProject,
  reservePlanningProject,
  getPlanningMilestones,
  putPlanningMilestones,
  getPlanningBatches,
  putPlanningBatches,
  getPlanningDecisions,
  putPlanningDecisions,
  getPlanningRisks,
  putPlanningRisks,
  getPlanningTechnicalDebt,
  putPlanningTechnicalDebt,
  getPlanningRoadmapLists,
  putPlanningRoadmapLists,
  getPlanningDependencies,
  putPlanningDependencies,
  getPlanningMetadata,
  putPlanningMetadata,
} from './planningStateStore'
import { publish } from '../events/eventBus'
import { paginate, inDateRange, buildSearchIndex, searchWithIndex } from '../query/queryHelpers'
import type { PageRequest, PageResult, DateRangeFilter } from '../query/queryTypes'
import type {
  Project,
  ProjectStatus,
  Milestone,
  MilestoneStatus,
  Batch,
  BatchStatus,
  Decision,
  DecisionStatus,
  Risk,
  RiskLevel,
  RiskStatus,
  TechnicalDebt,
  DebtPriority,
  DebtStatus,
  ProjectListItem,
  ProjectListKind,
  PlanningDependency,
  PlanningDependencyNodeType,
  PlanningMetadata,
  PlanningState,
  RoadmapLists,
} from './planningStateTypes'

/**
 * The Durable Planning Service — the ONLY writer for server-owned
 * planning state (Version 2.0, Milestone 1.1). Every mutating function
 * here reproduces the invariant-enforcement the Version 1.0 localStorage
 * modules performed on every write (see batchesStorage.ts's
 * enforcePlanningState / milestonesStorage.ts's syncMilestoneStatus /
 * deriveMilestoneStatus) — not just CRUD — so "Project Current Batch must
 * always equal Active Batch," "only one Active batch per project," and
 * "milestone status derives from batch completion" continue to hold for
 * server-owned data exactly as they did for localStorage-owned data. This
 * is what keeps Execution Identity valid across the migration: batch/
 * milestone ids and Batch.updatedAt semantics are preserved untouched.
 */

function nowISO(): string {
  return new Date().toISOString()
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function randomId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ---- Planning Metadata / Versioning ----

function defaultMetadata(slug: string): PlanningMetadata {
  const now = nowISO()
  return { project: slug, planningVersion: 0, migratedFromLocalStorage: false, migratedAt: null, createdAt: now, updatedAt: now }
}

function ensureMetadata(slug: string): PlanningMetadata {
  return getPlanningMetadata(slug) ?? defaultMetadata(slug)
}

/**
 * Called exactly once per public mutating call, after all of that call's
 * writes have landed — which makes it the single choke point for
 * publishing 'Planning Changes' events too: every one of this service's
 * ~20 create/update/delete functions (projects, milestones, batches,
 * decisions, risks, technical debt, roadmap items, dependencies) already
 * calls this, so hooking the Event Service here covers all of them
 * without touching each one individually.
 */
function bumpPlanningVersion(slug: string): PlanningMetadata {
  const current = ensureMetadata(slug)
  const next: PlanningMetadata = { ...current, planningVersion: current.planningVersion + 1, updatedAt: nowISO() }
  const result = putPlanningMetadata(slug, next)
  publish({ category: 'Planning Changes', project: slug, type: 'planning-version-bumped', payload: { planningVersion: result.planningVersion } })
  return result
}

export function getMetadata(slug: string): PlanningMetadata | null {
  return getPlanningMetadata(slug)
}

// ---- Projects ----

export type PlanningProjectInput = {
  name: string
  slug: string
  description: string
  category: string
  status: ProjectStatus
  progress: number
  color: string
  icon: string
}

export function listProjects(): Project[] {
  return Object.values(getPlanningProjectsMap())
}

export function getProject(slug: string): Project | null {
  return getPlanningProject(slug)
}

/**
 * Advisory only — a plain, unlocked read for UX purposes (live-typing
 * feedback, an early exit before even attempting a write). It is NOT what
 * makes slugs unique: two callers can both see `false` here for the same
 * slug an instant apart. createProject() below is the actual atomic
 * authority; this function existing and returning `false` is never a
 * guarantee that a subsequent createProject() call will succeed.
 */
export function isProjectSlugTaken(slug: string): boolean {
  return getPlanningProject(slug) !== null
}

/** Thrown by createProject() when `slug` is already reserved — the atomic rejection every caller must handle, distinct from (and authoritative over) an isProjectSlugTaken() pre-check that may have raced. */
export class ProjectSlugTakenError extends Error {
  constructor(
    public readonly slug: string,
    public readonly existing: Project
  ) {
    super(`Project slug '${slug}' already exists.`)
    this.name = 'ProjectSlugTakenError'
  }
}

/**
 * Reserves `input.slug` and creates the Project record as a single atomic
 * operation (see planningStateStore.ts's reservePlanningProject) — the
 * check ("is this slug free?") and the act ("create the project") happen
 * inside the same cross-process file lock, so two concurrent calls for
 * the same slug can never both succeed. Throws ProjectSlugTakenError
 * (never silently overwrites or returns the other caller's record) if
 * the slug lost the race; every caller must handle that rejection
 * explicitly rather than relying on a prior isProjectSlugTaken() read.
 */
export function createProject(input: PlanningProjectInput): Project {
  const now = nowISO()
  const record: Project = {
    slug: input.slug.trim(),
    name: input.name.trim(),
    tagline: '',
    description: input.description,
    category: input.category,
    status: input.status,
    progress: input.progress,
    color: input.color,
    icon: input.icon,
    archived: false,
    createdAt: now,
    lastUpdated: now,
    notes: '',
    recentActivity: [],
  }
  const reservation = reservePlanningProject(record)
  if (!reservation.ok) throw new ProjectSlugTakenError(record.slug, reservation.existing)
  putPlanningMetadata(record.slug, defaultMetadata(record.slug))
  bumpPlanningVersion(record.slug)
  return record
}

export function updateProject(slug: string, patch: Partial<Omit<Project, 'slug'>>): Project | null {
  const current = getPlanningProject(slug)
  if (!current) return null
  const updated: Project = { ...current, ...patch, lastUpdated: nowISO() }
  putPlanningProject(updated)
  bumpPlanningVersion(slug) // also publishes the general 'Planning Changes' event
  if (patch.status !== undefined && patch.status !== current.status) {
    publish({ category: 'Project Status', project: slug, type: 'project-status-changed', payload: { status: patch.status } })
  }
  return updated
}

// ---- Milestones ----

export type PlanningMilestoneInput = {
  title: string
  description: string
  phase: string
  startDate: string
  targetDate: string
  progress: number
  status: MilestoneStatus
  sequence?: number
}

export function listMilestones(slug: string): Milestone[] {
  return getPlanningMilestones(slug)
}

export function createMilestone(slug: string, input: PlanningMilestoneInput): Milestone {
  const now = nowISO()
  const record: Milestone = {
    id: randomId('milestone'),
    project: slug,
    title: input.title.trim(),
    description: input.description,
    phase: input.phase,
    startDate: input.startDate,
    targetDate: input.targetDate,
    progress: input.progress,
    status: input.status,
    archived: false,
    sequence: input.sequence ?? Number.MAX_SAFE_INTEGER,
    createdAt: now,
    updatedAt: now,
  }
  putPlanningMilestones(slug, [record, ...getPlanningMilestones(slug)])
  bumpPlanningVersion(slug)
  return record
}

export function updateMilestone(slug: string, id: string, patch: Partial<Omit<Milestone, 'id' | 'project' | 'createdAt'>>): Milestone | null {
  const items = getPlanningMilestones(slug)
  let updated: Milestone | null = null
  const next = items.map(m => {
    if (m.id !== id) return m
    updated = { ...m, ...patch, updatedAt: nowISO() }
    return updated
  })
  if (!updated) return null
  putPlanningMilestones(slug, next)
  bumpPlanningVersion(slug)
  return updated
}

export function archiveMilestone(slug: string, id: string): Milestone | null {
  return updateMilestone(slug, id, { archived: true })
}

export function restoreMilestone(slug: string, id: string): Milestone | null {
  return updateMilestone(slug, id, { archived: false })
}

export function deleteMilestone(slug: string, id: string): void {
  putPlanningMilestones(slug, getPlanningMilestones(slug).filter(m => m.id !== id))
  bumpPlanningVersion(slug)
}

/** Ported from milestonesStorage.ts's deriveMilestoneStatus — pure, identical rule set. */
function deriveMilestoneStatus(batchStatuses: BatchStatus[], currentStatus: MilestoneStatus): MilestoneStatus {
  if (batchStatuses.length === 0) return currentStatus
  if (batchStatuses.every(s => s === 'Complete')) return 'Complete'
  if (currentStatus === 'At Risk') return 'At Risk'
  return batchStatuses.some(s => s === 'Active' || s === 'Complete') ? 'In Progress' : 'Upcoming'
}

/** Ported from milestonesStorage.ts's syncMilestoneStatus, scoped to one project's already-loaded milestone array (no separate read/write per call — the caller persists the returned array once). */
function syncMilestoneStatusInPlace(milestones: Milestone[], milestoneId: string, batchStatuses: BatchStatus[]): Milestone[] {
  return milestones.map(m => {
    if (m.id !== milestoneId) return m
    const derived = deriveMilestoneStatus(batchStatuses, m.status)
    return derived === m.status ? m : { ...m, status: derived, updatedAt: nowISO() }
  })
}

// ---- Batches ----

export type PlanningBatchInput = {
  batchNumber: string
  milestone: string
  objective: string
  summary: string
  completedTasks: string
  lessonsLearned: string
  claudePrompt: string
  completionDate: string
  status: BatchStatus
  sequence?: number
}

export function listBatches(slug: string): Batch[] {
  return getPlanningBatches(slug)
}

export function batchesForMilestone(slug: string, milestoneId: string): Batch[] {
  return getPlanningBatches(slug).filter(b => b.milestone === milestoneId)
}

/**
 * Ported from batchesStorage.ts's enforcePlanningState, scoped directly to
 * one project's own batches/milestones arrays (the server store already
 * partitions by slug, so no projectSlugForBatch resolution is needed —
 * every batch passed in already belongs to `slug`). Same rules: only one
 * Active batch per project; a demoted-to-zero-Active project auto-
 * promotes the next queued batch by sequence; milestone status is synced
 * from the resulting batch statuses.
 */
function enforcePlanningStateFor(slug: string, justActivatedId?: string): void {
  const items = [...getPlanningBatches(slug)].sort((a, b) => a.sequence - b.sequence)
  const activeBatches = items.filter(b => b.status === 'Active')

  let working = getPlanningBatches(slug)

  if (activeBatches.length > 1) {
    const keep = activeBatches.find(b => b.id === justActivatedId) ?? activeBatches[0]
    const demote = new Set(activeBatches.filter(b => b.id !== keep.id).map(b => b.id))
    working = working.map(b => (demote.has(b.id) ? { ...b, status: 'Queued' as BatchStatus, updatedAt: nowISO() } : b))
  } else if (activeBatches.length === 0) {
    const next = items.find(b => b.status !== 'Complete')
    if (next) working = working.map(b => (b.id === next.id ? { ...b, status: 'Active' as BatchStatus, updatedAt: nowISO() } : b))
  }

  putPlanningBatches(slug, working)

  const milestoneIds = new Set(working.map(b => b.milestone).filter(Boolean))
  let milestones = getPlanningMilestones(slug)
  for (const milestoneId of milestoneIds) {
    const statuses = working.filter(b => b.milestone === milestoneId).map(b => b.status)
    milestones = syncMilestoneStatusInPlace(milestones, milestoneId, statuses)
  }
  putPlanningMilestones(slug, milestones)
}

export function createBatch(slug: string, input: PlanningBatchInput): Batch {
  const now = nowISO()
  const record: Batch = {
    id: randomId('batch'),
    batchNumber: input.batchNumber.trim(),
    milestone: input.milestone,
    objective: input.objective,
    summary: input.summary,
    completedTasks: input.completedTasks,
    lessonsLearned: input.lessonsLearned,
    claudePrompt: input.claudePrompt,
    completionDate: input.completionDate,
    status: input.status,
    archived: false,
    sequence: input.sequence ?? Number.MAX_SAFE_INTEGER,
    createdAt: now,
    updatedAt: now,
  }
  putPlanningBatches(slug, [record, ...getPlanningBatches(slug)])
  enforcePlanningStateFor(slug, record.status === 'Active' ? record.id : undefined)
  bumpPlanningVersion(slug) // also publishes the general 'Planning Changes' event
  // A more specific signal than the generic bump above — "Features
  // Planned" (Production Validation 2.1, Milestone 2.1.1) needs to know
  // WHICH mutation happened, not just that planning state changed
  // somehow; bumpPlanningVersion alone can't distinguish that.
  publish({ category: 'Planning Changes', project: slug, type: 'batch-created', payload: { batchId: record.id, batchNumber: record.batchNumber } })
  return record
}

export function updateBatch(slug: string, id: string, patch: Partial<Omit<Batch, 'id' | 'createdAt'>>): Batch | null {
  const items = getPlanningBatches(slug)
  if (!items.some(b => b.id === id)) return null

  const effectivePatch =
    patch.status === 'Complete' && !patch.completionDate ? { ...patch, completionDate: todayISO() } : patch

  const next = items.map(b => (b.id === id ? { ...b, ...effectivePatch, updatedAt: nowISO() } : b))
  putPlanningBatches(slug, next)
  enforcePlanningStateFor(slug, patch.status === 'Active' ? id : undefined)
  bumpPlanningVersion(slug) // also publishes the general 'Planning Changes' event
  const updated = getPlanningBatches(slug).find(b => b.id === id) ?? null
  // "Features Delivered" (Production Validation 2.1, Milestone 2.1.1) —
  // a specific signal for the one status transition that means "this
  // unit of work is actually done," distinct from every other batch edit.
  if (updated && patch.status === 'Complete') {
    publish({ category: 'Planning Changes', project: slug, type: 'batch-completed', payload: { batchId: updated.id, batchNumber: updated.batchNumber } })
  }
  return updated
}

export function archiveBatch(slug: string, id: string): Batch | null {
  return updateBatch(slug, id, { archived: true })
}

export function restoreBatch(slug: string, id: string): Batch | null {
  return updateBatch(slug, id, { archived: false })
}

export function completeBatch(slug: string, id: string): Batch | null {
  return updateBatch(slug, id, { status: 'Complete', completionDate: todayISO() })
}

export function deleteBatch(slug: string, id: string): void {
  putPlanningBatches(slug, getPlanningBatches(slug).filter(b => b.id !== id))
  bumpPlanningVersion(slug)
}

/** The server-side "Current Batch" — same contract as batchesStorage.ts's getCurrentBatchForProject: self-heals via enforcePlanningStateFor on every read, so it never disagrees with the Active-batch invariant. */
export function getCurrentBatchForProject(slug: string): Batch | null {
  enforcePlanningStateFor(slug)
  return getPlanningBatches(slug).find(b => b.status === 'Active') ?? null
}

// ---- Decisions ----

export type PlanningDecisionInput = {
  decision: string
  reason: string
  alternatives: string
  approvedDate: string
  status: DecisionStatus
  relatedMilestone?: string
  relatedBatch?: string
  relatedJournalEntry?: string
  relatedPrompt?: string
}

export function listDecisions(slug: string): Decision[] {
  return getPlanningDecisions(slug)
}

export function createDecision(slug: string, input: PlanningDecisionInput): Decision {
  const now = nowISO()
  const record: Decision = {
    id: randomId('decision'),
    decision: input.decision.trim(),
    reason: input.reason,
    alternatives: input.alternatives,
    approvedDate: input.approvedDate,
    status: input.status,
    relatedProject: slug,
    relatedMilestone: input.relatedMilestone ?? '',
    relatedBatch: input.relatedBatch ?? '',
    relatedJournalEntry: input.relatedJournalEntry ?? '',
    relatedPrompt: input.relatedPrompt ?? '',
    createdAt: now,
    updatedAt: now,
  }
  putPlanningDecisions(slug, [record, ...getPlanningDecisions(slug)])
  bumpPlanningVersion(slug)
  return record
}

export function updateDecision(slug: string, id: string, patch: Partial<Omit<Decision, 'id' | 'relatedProject' | 'createdAt'>>): Decision | null {
  const items = getPlanningDecisions(slug)
  let updated: Decision | null = null
  const next = items.map(d => {
    if (d.id !== id) return d
    updated = { ...d, ...patch, updatedAt: nowISO() }
    return updated
  })
  if (!updated) return null
  putPlanningDecisions(slug, next)
  bumpPlanningVersion(slug)
  return updated
}

export function deleteDecision(slug: string, id: string): void {
  putPlanningDecisions(slug, getPlanningDecisions(slug).filter(d => d.id !== id))
  bumpPlanningVersion(slug)
}

// ---- Risks ----

export type PlanningRiskInput = {
  title: string
  description: string
  relatedMilestone?: string
  severity: RiskLevel
  probability: RiskLevel
  mitigation: string
  owner: string
  status: RiskStatus
}

export function listRisks(slug: string): Risk[] {
  return getPlanningRisks(slug)
}

export function createRisk(slug: string, input: PlanningRiskInput): Risk {
  const now = nowISO()
  const record: Risk = {
    id: randomId('risk'),
    title: input.title.trim(),
    description: input.description,
    project: slug,
    relatedMilestone: input.relatedMilestone ?? '',
    severity: input.severity,
    probability: input.probability,
    mitigation: input.mitigation,
    owner: input.owner,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  }
  putPlanningRisks(slug, [record, ...getPlanningRisks(slug)])
  bumpPlanningVersion(slug)
  return record
}

export function updateRisk(slug: string, id: string, patch: Partial<Omit<Risk, 'id' | 'project' | 'createdAt'>>): Risk | null {
  const items = getPlanningRisks(slug)
  let updated: Risk | null = null
  const next = items.map(r => {
    if (r.id !== id) return r
    updated = { ...r, ...patch, updatedAt: nowISO() }
    return updated
  })
  if (!updated) return null
  putPlanningRisks(slug, next)
  bumpPlanningVersion(slug)
  return updated
}

export function deleteRisk(slug: string, id: string): void {
  putPlanningRisks(slug, getPlanningRisks(slug).filter(r => r.id !== id))
  bumpPlanningVersion(slug)
}

// ---- Technical Debt ----

export type PlanningTechnicalDebtInput = {
  title: string
  description: string
  relatedBatch?: string
  priority: DebtPriority
  estimatedEffort: string
  createdDate: string
  resolvedDate: string
  status: DebtStatus
}

export function listTechnicalDebt(slug: string): TechnicalDebt[] {
  return getPlanningTechnicalDebt(slug)
}

export function createTechnicalDebt(slug: string, input: PlanningTechnicalDebtInput): TechnicalDebt {
  const now = nowISO()
  const record: TechnicalDebt = {
    id: randomId('debt'),
    title: input.title.trim(),
    description: input.description,
    project: slug,
    relatedBatch: input.relatedBatch ?? '',
    priority: input.priority,
    estimatedEffort: input.estimatedEffort,
    createdDate: input.createdDate,
    resolvedDate: input.resolvedDate,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  }
  putPlanningTechnicalDebt(slug, [record, ...getPlanningTechnicalDebt(slug)])
  bumpPlanningVersion(slug)
  return record
}

export function updateTechnicalDebt(
  slug: string,
  id: string,
  patch: Partial<Omit<TechnicalDebt, 'id' | 'project' | 'createdAt'>>
): TechnicalDebt | null {
  const items = getPlanningTechnicalDebt(slug)
  let updated: TechnicalDebt | null = null
  const next = items.map(d => {
    if (d.id !== id) return d
    updated = { ...d, ...patch, updatedAt: nowISO() }
    return updated
  })
  if (!updated) return null
  putPlanningTechnicalDebt(slug, next)
  bumpPlanningVersion(slug) // also publishes the general 'Planning Changes' event
  // "Technical debt resolved" (Production Validation 2.1, Milestone
  // 2.1.1) — a specific signal distinct from every other debt edit.
  // "Technical debt created" already has its own specific signal for
  // free: knowledgeService.ts's recordTechnicalDebt already publishes
  // 'Knowledge Updates' with payload.timelineCategory === 'Technical
  // Debt' — no producer change needed on that side.
  if (patch.status === 'Resolved') {
    const resolved = next.find(d => d.id === id)
    if (resolved) publish({ category: 'Planning Changes', project: slug, type: 'technical-debt-resolved', payload: { debtId: resolved.id, title: resolved.title } })
  }
  return updated
}

export function deleteTechnicalDebt(slug: string, id: string): void {
  putPlanningTechnicalDebt(slug, getPlanningTechnicalDebt(slug).filter(d => d.id !== id))
  bumpPlanningVersion(slug)
}

// ---- Roadmap / Upcoming ----

export function getRoadmapLists(slug: string) {
  return getPlanningRoadmapLists(slug)
}

export function addRoadmapItem(
  slug: string,
  kind: ProjectListKind,
  input: { title: string; detail: string; status: string }
): ProjectListItem {
  const now = nowISO()
  const item: ProjectListItem = {
    id: randomId(kind),
    title: input.title.trim(),
    detail: input.detail.trim(),
    status: input.status,
    createdAt: now,
    updatedAt: now,
  }
  const lists = getPlanningRoadmapLists(slug)
  putPlanningRoadmapLists(slug, { ...lists, [kind]: [item, ...lists[kind]] })
  bumpPlanningVersion(slug)
  return item
}

export function updateRoadmapItem(
  slug: string,
  kind: ProjectListKind,
  id: string,
  patch: Partial<Pick<ProjectListItem, 'title' | 'detail' | 'status'>>
): ProjectListItem | null {
  const lists = getPlanningRoadmapLists(slug)
  let updated: ProjectListItem | null = null
  const items = lists[kind].map(item => {
    if (item.id !== id) return item
    updated = { ...item, ...patch, updatedAt: nowISO() }
    return updated
  })
  if (!updated) return null
  putPlanningRoadmapLists(slug, { ...lists, [kind]: items })
  bumpPlanningVersion(slug)
  return updated
}

export function deleteRoadmapItem(slug: string, kind: ProjectListKind, id: string): void {
  const lists = getPlanningRoadmapLists(slug)
  putPlanningRoadmapLists(slug, { ...lists, [kind]: lists[kind].filter(item => item.id !== id) })
  bumpPlanningVersion(slug)
}

// ---- Dependencies ----

export type PlanningDependencyInput = {
  fromType: PlanningDependencyNodeType
  fromId: string
  toType: PlanningDependencyNodeType
  toId: string
  note?: string
}

export function listDependencies(slug: string): PlanningDependency[] {
  return getPlanningDependencies(slug)
}

export function addDependency(slug: string, input: PlanningDependencyInput): PlanningDependency {
  const now = nowISO()
  const record: PlanningDependency = {
    id: randomId('dependency'),
    project: slug,
    fromType: input.fromType,
    fromId: input.fromId,
    toType: input.toType,
    toId: input.toId,
    note: input.note ?? '',
    createdAt: now,
    updatedAt: now,
  }
  putPlanningDependencies(slug, [record, ...getPlanningDependencies(slug)])
  bumpPlanningVersion(slug)
  return record
}

export function removeDependency(slug: string, id: string): void {
  putPlanningDependencies(slug, getPlanningDependencies(slug).filter(d => d.id !== id))
  bumpPlanningVersion(slug)
}

// ---- Full bundle ----

// ---- Bulk reads (client cache hydration) ----

export function listAllMilestones(): Milestone[] {
  return listProjects().flatMap(p => getPlanningMilestones(p.slug))
}

export function listAllBatches(): Batch[] {
  return listProjects().flatMap(p => getPlanningBatches(p.slug))
}

export function listAllDecisions(): Decision[] {
  return listProjects().flatMap(p => getPlanningDecisions(p.slug))
}

export function listAllRisks(): Risk[] {
  return listProjects().flatMap(p => getPlanningRisks(p.slug))
}

export function listAllTechnicalDebt(): TechnicalDebt[] {
  return listProjects().flatMap(p => getPlanningTechnicalDebt(p.slug))
}

export function listAllRoadmapLists(): Record<string, RoadmapLists> {
  const result: Record<string, RoadmapLists> = {}
  for (const p of listProjects()) result[p.slug] = getPlanningRoadmapLists(p.slug)
  return result
}

// ---- Enterprise Scalability (Version 2.0 Phase 5, Milestone 5.2): Planning History pagination/filtering/search ----
// Planning entities are current mutable state, not an operational log
// (see this file's own header comment vs. the Knowledge Service's
// permanent-record domains) — no archiving here, only server-side
// pagination/filtering/search over the same live lists listDecisions/
// listRisks/listTechnicalDebt already return in full.

export type DecisionQueryFilter = { status?: DecisionStatus; dateRange?: DateRangeFilter; search?: string }

export function queryDecisions(slug: string, filter: DecisionQueryFilter = {}, page: PageRequest = {}): PageResult<Decision> {
  let items = listDecisions(slug)
  if (filter.status) items = items.filter(d => d.status === filter.status)
  if (filter.dateRange) items = items.filter(d => inDateRange(d.createdAt, filter.dateRange))
  if (filter.search) {
    const index = buildSearchIndex(items, d => `${d.decision} ${d.reason} ${d.alternatives}`)
    items = searchWithIndex(items, index, filter.search)
  }
  return paginate(items, page)
}

export type RiskQueryFilter = { status?: RiskStatus; severity?: RiskLevel; dateRange?: DateRangeFilter; search?: string }

export function queryRisks(slug: string, filter: RiskQueryFilter = {}, page: PageRequest = {}): PageResult<Risk> {
  let items = listRisks(slug)
  if (filter.status) items = items.filter(r => r.status === filter.status)
  if (filter.severity) items = items.filter(r => r.severity === filter.severity)
  if (filter.dateRange) items = items.filter(r => inDateRange(r.createdAt, filter.dateRange))
  if (filter.search) {
    const index = buildSearchIndex(items, r => `${r.title} ${r.description}`)
    items = searchWithIndex(items, index, filter.search)
  }
  return paginate(items, page)
}

export type TechnicalDebtQueryFilter = { status?: DebtStatus; priority?: DebtPriority; dateRange?: DateRangeFilter; search?: string }

export function queryTechnicalDebt(slug: string, filter: TechnicalDebtQueryFilter = {}, page: PageRequest = {}): PageResult<TechnicalDebt> {
  let items = listTechnicalDebt(slug)
  if (filter.status) items = items.filter(d => d.status === filter.status)
  if (filter.priority) items = items.filter(d => d.priority === filter.priority)
  if (filter.dateRange) items = items.filter(d => inDateRange(d.createdAt, filter.dateRange))
  if (filter.search) {
    const index = buildSearchIndex(items, d => `${d.title} ${d.description}`)
    items = searchWithIndex(items, index, filter.search)
  }
  return paginate(items, page)
}

export function getPlanningState(slug: string): PlanningState | null {
  const project = getPlanningProject(slug)
  if (!project) return null
  const roadmapLists = getPlanningRoadmapLists(slug)
  return {
    project,
    milestones: getPlanningMilestones(slug),
    batches: getPlanningBatches(slug),
    decisions: getPlanningDecisions(slug),
    risks: getPlanningRisks(slug),
    technicalDebt: getPlanningTechnicalDebt(slug),
    roadmap: roadmapLists.roadmap,
    upcoming: roadmapLists.upcoming,
    dependencies: getPlanningDependencies(slug),
    metadata: ensureMetadata(slug),
  }
}
