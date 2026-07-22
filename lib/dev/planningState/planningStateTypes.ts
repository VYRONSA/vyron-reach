import type { Project, ProjectStatus } from '../projectsData'
import type { Milestone, MilestoneStatus } from '../milestonesStorage'
import type { Batch, BatchStatus } from '../batchesStorage'
import type { Decision, DecisionStatus } from '../decisionsStorage'
import type { Risk, RiskLevel, RiskStatus } from '../risksStorage'
import type { TechnicalDebt, DebtPriority, DebtStatus } from '../technicalDebtStorage'
import type { ProjectListItem, ProjectListKind } from '../projectLists'

/**
 * Durable Server Planning State Store (Version 2.0, Milestone 1.1) —
 * types only. Distinct from lib/dev/planning/ (the pre-existing AI
 * Engineering Planning Engine that generates EngineeringPlan candidates
 * for approval); this module is the durable home for actual planning
 * data — projects, milestones, batches, decisions, risks, technical debt,
 * roadmap, dependencies. Do not confuse the two.
 *
 * Project/Milestone/Batch/Decision/Risk/TechnicalDebt/ProjectListItem are
 * type-only imports from the existing localStorage-backed modules (the
 * same pattern lib/dev/director/executionSnapshotTypes.ts already uses)
 * so migrated and newly-created data share one identical shape.
 */
export type {
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
}

export type RoadmapLists = Record<ProjectListKind, ProjectListItem[]>

/**
 * An explicit dependency edge between two planning items (milestone or
 * batch, either direction). No equivalent existed in the localStorage
 * layer — Version 1.0 only had implicit ordering via each item's
 * `sequence` field — so this entity starts empty for every migrated
 * project and is populated only by future writes through the Planning
 * Service.
 */
export type PlanningDependencyNodeType = 'milestone' | 'batch'

export type PlanningDependency = {
  id: string
  project: string
  fromType: PlanningDependencyNodeType
  fromId: string
  toType: PlanningDependencyNodeType
  toId: string
  note: string
  createdAt: string
  updatedAt: string
}

/**
 * Per-project planning metadata: schema/version bookkeeping distinct from
 * any one entity collection. `planningVersion` increments on every
 * mutating Planning Service call for that project — the "Planning
 * Version" required by the migration mission, and a cheap way for a
 * future caller to detect "planning changed since I last read it" without
 * diffing every collection.
 */
export type PlanningMetadata = {
  project: string
  planningVersion: number
  migratedFromLocalStorage: boolean
  migratedAt: string | null
  createdAt: string
  updatedAt: string
}

/** The full server-owned planning bundle for one project — what the Planning Service's getPlanningState returns, and what a future presentation-only browser reads instead of localStorage. */
export type PlanningState = {
  project: Project
  milestones: Milestone[]
  batches: Batch[]
  decisions: Decision[]
  risks: Risk[]
  technicalDebt: TechnicalDebt[]
  roadmap: ProjectListItem[]
  upcoming: ProjectListItem[]
  dependencies: PlanningDependency[]
  metadata: PlanningMetadata
}

/** Global, one-time migration gate — not per-project. Set once the browser's localStorage planning universe has been imported; future reads must ignore localStorage regardless of which project they're about. */
export type MigrationStatus = {
  migrated: boolean
  migratedAt: string | null
}

/**
 * Exactly what the browser gathers (once, from every existing localStorage
 * planning module) and POSTs to /api/dev/planning/migrate. Flat
 * collections mirroring each store's own shape — the Planning Service
 * partitions them by project slug on import.
 */
export type PlanningMigrationPayload = {
  projects: Project[]
  milestones: Milestone[]
  batches: Batch[]
  decisions: Decision[]
  risks: Risk[]
  technicalDebt: TechnicalDebt[]
  projectLists: { project: string; kind: ProjectListKind; items: ProjectListItem[] }[]
}

export type PlanningMigrationResult = {
  imported: boolean
  projectsImported: string[]
}
