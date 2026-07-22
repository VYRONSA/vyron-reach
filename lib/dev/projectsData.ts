import { getPlanningCache, hydratePlanningCache, applyProjectUpsert, scheduleServerWrite, callApi, nowISO } from './planningState/planningClientCache'

export type ProjectStatus = 'active' | 'paused' | 'planning' | 'complete'

export type Project = {
  slug: string
  name: string
  tagline: string
  description: string
  category: string
  status: ProjectStatus
  /**
   * Starting progress for a brand-new project with no milestones yet —
   * once milestones exist, Project Intelligence derives progress from
   * them instead (getMilestoneProgress) and this becomes a fallback
   * only. Current Phase and Current Milestone are NOT stored here:
   * they're derived entirely from the project's milestones (see
   * getProjectIntelligence), which is now the single source of truth
   * for both — a manually re-typed "phase" string can't drift out of
   * sync with reality the way a derived one can't.
   */
  progress: number
  color: string
  icon: string
  archived: boolean
  lastUpdated: string
  notes: string
  recentActivity: { label: string; time: string }[]
  /** '' for the original seed products (their real creation predates this field) — the Development Event Engine only emits a "Project Created" event when this is genuinely known, rather than guessing. */
  createdAt: string
}

/**
 * Build-time-safe slug list for generateStaticParams (no Planning Service
 * access at build time — this is a static list, unrelated to runtime
 * project data). Kept as the original seed set for pre-rendering only;
 * every runtime read goes through getProjects()/getProjectBySlug()
 * instead, which are now backed by the Planning Service (Version 2.0
 * Milestone 1.1) rather than localStorage.
 */
export const SEED_PROJECT_SLUGS: string[] = ['vyron-dev', 'reach', 'core', 'cost', 'pay', 'farm', 'child-compass', 'surf4cars']

/**
 * Reads the current project list from the browser's in-memory Planning
 * cache (lib/dev/planningState/planningClientCache.ts) — populated via a
 * one-time bulk fetch from the Planning Service, never from
 * localStorage. The cache may be empty before the portal's
 * PlanningHydrationGate finishes its first hydration; every consumer
 * mounted inside that gate always sees real data on its first read.
 */
export function getProjects(): Project[] {
  return getPlanningCache().projects
}

export function getProjectBySlug(slug: string): Project | undefined {
  return getProjects().find(p => p.slug === slug)
}

export function getProjectName(slug: string, fallback = 'Unassigned'): string {
  return getProjectBySlug(slug)?.name ?? fallback
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function isSlugTaken(slug: string): boolean {
  return getProjects().some(p => p.slug === slug)
}

export function suggestSlug(name: string): string {
  const base = slugify(name) || 'project'
  let candidate = base
  let n = 2
  while (isSlugTaken(candidate)) {
    candidate = `${base}-${n}`
    n += 1
  }
  return candidate
}

export type ProjectInput = {
  name: string
  slug: string
  description: string
  category: string
  status: ProjectStatus
  progress: number
  color: string
  icon: string
}

/**
 * Creates the project optimistically in the local cache (so the caller's
 * synchronous return value and any immediate re-read of getProjects()
 * reflect it right away) and fires the real request to the Planning
 * Service in the background. The Planning Service is the only writer of
 * record — this optimistic record is superseded by the server's
 * authoritative response within one round trip via refreshPlanningCache.
 */
export function createProject(input: ProjectInput): Project {
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
  applyProjectUpsert(record)
  scheduleServerWrite(() =>
    callApi('/api/dev/planning/projects', {
      method: 'POST',
      body: JSON.stringify({
        slug: record.slug,
        name: record.name,
        description: record.description,
        category: record.category,
        status: record.status,
        progress: record.progress,
        color: record.color,
        icon: record.icon,
      }),
    })
  )
  return record
}

export function updateProject(slug: string, patch: Partial<Omit<Project, 'slug'>>): void {
  const current = getProjectBySlug(slug)
  if (!current) return
  const updated: Project = { ...current, ...patch, lastUpdated: nowISO() }
  applyProjectUpsert(updated)
  scheduleServerWrite(() =>
    callApi(`/api/dev/planning/projects/${slug}`, { method: 'PATCH', body: JSON.stringify(patch) })
  )
}

export function archiveProject(slug: string) {
  updateProject(slug, { archived: true })
}

export function restoreProject(slug: string) {
  updateProject(slug, { archived: false })
}

export function setProjectStatus(slug: string, status: ProjectStatus) {
  updateProject(slug, { status })
}

export const STATUS_TONE: Record<ProjectStatus, 'success' | 'warning' | 'neutral' | 'info'> = {
  active: 'success',
  paused: 'warning',
  planning: 'neutral',
  complete: 'info',
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  planning: 'Planning',
  complete: 'Complete',
}

/** Re-exported so callers that want to force an early hydration (e.g. the portal's PlanningHydrationGate) don't need to import the cache module directly. */
export { hydratePlanningCache }
