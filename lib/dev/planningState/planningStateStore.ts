import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import type {
  Project,
  Milestone,
  Batch,
  Decision,
  Risk,
  TechnicalDebt,
  RoadmapLists,
  PlanningDependency,
  PlanningMetadata,
  MigrationStatus,
} from './planningStateTypes'

/**
 * File-backed persistence for the Durable Server Planning State Store —
 * built entirely on the existing Version 1.0 primitives
 * (readJsonStore/writeJsonStore/updateJsonStore from
 * lib/dev/director/fileJsonStore.ts, themselves built on fileLock.ts's
 * atomic write-then-rename and cross-process mutex). No new persistence
 * mechanism is introduced here — one JSON file per entity collection
 * under the same gitignored .vyron-dev/ directory every other Director
 * store already uses, each shaped as a Record keyed by project slug so
 * partitioning matches how every entity is actually queried.
 */

const PROJECTS_FILE = 'planning-projects.json'
const MILESTONES_FILE = 'planning-milestones.json'
const BATCHES_FILE = 'planning-batches.json'
const DECISIONS_FILE = 'planning-decisions.json'
const RISKS_FILE = 'planning-risks.json'
const DEBT_FILE = 'planning-technical-debt.json'
const ROADMAP_FILE = 'planning-roadmap.json'
const DEPENDENCIES_FILE = 'planning-dependencies.json'
const METADATA_FILE = 'planning-metadata.json'
const MIGRATION_FILE = 'planning-migration-status.json'

function readMap<T>(filename: string): Record<string, T> {
  return readJsonStore<Record<string, T>>(filename, {})
}

/** Locked read-modify-write for a single project's slot in a per-slug-keyed store — every write goes through updateJsonStore so concurrent requests for different (or the same) projects can never clobber one another. */
function writeSlot<T>(filename: string, slug: string, value: T): T {
  updateJsonStore<Record<string, T>>(filename, {}, current => ({ ...current, [slug]: value }))
  return value
}

// ---- Projects ----

export function getPlanningProjectsMap(): Record<string, Project> {
  return readMap<Project>(PROJECTS_FILE)
}

export function getPlanningProject(slug: string): Project | null {
  return getPlanningProjectsMap()[slug] ?? null
}

export function putPlanningProject(project: Project): Project {
  return writeSlot(PROJECTS_FILE, project.slug, project)
}

/**
 * Atomic check-and-insert: whether `project.slug` is free and the record
 * gets written are decided inside the SAME updateJsonStore call, which
 * itself runs inside withFileLock's single cross-process mutex — so two
 * concurrent reservations for the same slug can never both see "free."
 * Whichever call's mutate callback runs first wins and its slug slot is
 * filled before the lock is released; the second call observes the
 * now-occupied slot within that same locked read and loses cleanly,
 * returning the winner's record rather than writing anything.
 *
 * This replaces the previous "isProjectSlugTaken() read, then
 * putPlanningProject() write" pattern every caller used to perform as two
 * separate operations — the exact shape of race a check outside the lock
 * can never close, no matter how quickly the write follows the read.
 */
export function reservePlanningProject(project: Project): { ok: true; project: Project } | { ok: false; existing: Project } {
  let result: { ok: true; project: Project } | { ok: false; existing: Project } = { ok: true, project }
  updateJsonStore<Record<string, Project>>(PROJECTS_FILE, {}, current => {
    const existing = current[project.slug]
    if (existing) {
      result = { ok: false, existing }
      return current
    }
    result = { ok: true, project }
    return { ...current, [project.slug]: project }
  })
  return result
}

// ---- Milestones ----

export function getPlanningMilestones(slug: string): Milestone[] {
  return readMap<Milestone[]>(MILESTONES_FILE)[slug] ?? []
}

export function putPlanningMilestones(slug: string, items: Milestone[]): Milestone[] {
  return writeSlot(MILESTONES_FILE, slug, items)
}

// ---- Batches ----

export function getPlanningBatches(slug: string): Batch[] {
  return readMap<Batch[]>(BATCHES_FILE)[slug] ?? []
}

export function putPlanningBatches(slug: string, items: Batch[]): Batch[] {
  return writeSlot(BATCHES_FILE, slug, items)
}

// ---- Decisions ----

export function getPlanningDecisions(slug: string): Decision[] {
  return readMap<Decision[]>(DECISIONS_FILE)[slug] ?? []
}

export function putPlanningDecisions(slug: string, items: Decision[]): Decision[] {
  return writeSlot(DECISIONS_FILE, slug, items)
}

// ---- Risks ----

export function getPlanningRisks(slug: string): Risk[] {
  return readMap<Risk[]>(RISKS_FILE)[slug] ?? []
}

export function putPlanningRisks(slug: string, items: Risk[]): Risk[] {
  return writeSlot(RISKS_FILE, slug, items)
}

// ---- Technical Debt ----

export function getPlanningTechnicalDebt(slug: string): TechnicalDebt[] {
  return readMap<TechnicalDebt[]>(DEBT_FILE)[slug] ?? []
}

export function putPlanningTechnicalDebt(slug: string, items: TechnicalDebt[]): TechnicalDebt[] {
  return writeSlot(DEBT_FILE, slug, items)
}

// ---- Roadmap / Upcoming ----

const EMPTY_ROADMAP: RoadmapLists = { roadmap: [], upcoming: [] }

export function getPlanningRoadmapLists(slug: string): RoadmapLists {
  return readMap<RoadmapLists>(ROADMAP_FILE)[slug] ?? EMPTY_ROADMAP
}

export function putPlanningRoadmapLists(slug: string, lists: RoadmapLists): RoadmapLists {
  return writeSlot(ROADMAP_FILE, slug, lists)
}

// ---- Dependencies ----

export function getPlanningDependencies(slug: string): PlanningDependency[] {
  return readMap<PlanningDependency[]>(DEPENDENCIES_FILE)[slug] ?? []
}

export function putPlanningDependencies(slug: string, items: PlanningDependency[]): PlanningDependency[] {
  return writeSlot(DEPENDENCIES_FILE, slug, items)
}

// ---- Metadata ----

export function getPlanningMetadata(slug: string): PlanningMetadata | null {
  return readMap<PlanningMetadata>(METADATA_FILE)[slug] ?? null
}

export function putPlanningMetadata(slug: string, metadata: PlanningMetadata): PlanningMetadata {
  return writeSlot(METADATA_FILE, slug, metadata)
}

// ---- Migration status (global, not project-scoped) ----

const DEFAULT_MIGRATION_STATUS: MigrationStatus = { migrated: false, migratedAt: null }

export function getMigrationStatus(): MigrationStatus {
  return readJsonStore<MigrationStatus>(MIGRATION_FILE, DEFAULT_MIGRATION_STATUS)
}

export function setMigrationStatus(status: MigrationStatus): void {
  updateJsonStore<MigrationStatus>(MIGRATION_FILE, DEFAULT_MIGRATION_STATUS, () => status)
}
