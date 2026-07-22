import type {
  Project,
  Milestone,
  Batch,
  Decision,
  Risk,
  TechnicalDebt,
  ProjectListKind,
  RoadmapLists,
} from './planningStateTypes'

/**
 * The browser's ONLY representation of planning data — an in-memory,
 * non-persisted cache, always populated from and reconciled against the
 * Planning Service (never localStorage, never an independent source of
 * truth). It exists purely so the ~45 existing components that read
 * planning data via plain synchronous function calls (getMilestones(),
 * getBatches(), etc.) keep working unchanged: those functions now read
 * this cache instead of window.localStorage.
 *
 * Lifecycle: hydratePlanningCache() performs the one bulk fetch
 * (GET /api/dev/planning/state) that populates every collection at once.
 * Every mutation applies an optimistic, client-generated-id update to
 * this cache for immediate UI feedback, fires the real request to the
 * Planning Service, and — once the server responds — calls
 * refreshPlanningCache() to replace the cache wholesale with the
 * server's authoritative (invariant-enforced) result. No invariant
 * enforcement (Active-batch exclusivity, milestone-status derivation,
 * etc.) is reimplemented here; the optimistic guess is always superseded
 * by the real server result within one round trip.
 *
 * On a full page reload this cache resets to empty and is re-hydrated
 * from the server — nothing here survives a reload by itself, which is
 * exactly the point: clearing browser localStorage has zero effect on
 * planning data, because planning data was never there.
 *
 * Deliberately has no 'use client' directive — it's a plain isomorphic
 * utility module (like the localStore.ts it replaces for planning data),
 * not a React component, so it can still be imported by any lib/dev/*.ts
 * "engine" that runs in both client and server contexts. Every function
 * here degrades to a safe no-op when `window` is undefined, exactly
 * matching localStore.ts's readLocal/writeLocal contract.
 */

type PlanningCacheShape = {
  hydrated: boolean
  projects: Project[]
  milestones: Milestone[]
  batches: Batch[]
  decisions: Decision[]
  risks: Risk[]
  technicalDebt: TechnicalDebt[]
  roadmapLists: Record<string, RoadmapLists>
}

const EMPTY_CACHE: PlanningCacheShape = {
  hydrated: false,
  projects: [],
  milestones: [],
  batches: [],
  decisions: [],
  risks: [],
  technicalDebt: [],
  roadmapLists: {},
}

let cache: PlanningCacheShape = EMPTY_CACHE
let hydratePromise: Promise<void> | null = null

export function randomPlanningId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function nowISO(): string {
  return new Date().toISOString()
}

async function callApi<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (typeof window === 'undefined') return null
  try {
    const res = await fetch(path, init ? { headers: { 'Content-Type': 'application/json' }, ...init } : undefined)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export function getPlanningCache(): PlanningCacheShape {
  return cache
}

type BulkState = {
  projects: Project[]
  milestones: Milestone[]
  batches: Batch[]
  decisions: Decision[]
  risks: Risk[]
  technicalDebt: TechnicalDebt[]
  roadmapLists: Record<string, RoadmapLists>
}

/** The one bulk hydration point. Concurrent callers share a single in-flight request. */
export function hydratePlanningCache(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (hydratePromise) return hydratePromise

  hydratePromise = callApi<BulkState>('/api/dev/planning/state').then(data => {
    if (!data) return
    cache = { hydrated: true, ...data }
  })
  return hydratePromise
}

/** The reconciliation step every mutation triggers once the server confirms its (possibly cascading) result — discards the in-flight marker and re-fetches. */
export async function refreshPlanningCache(): Promise<void> {
  hydratePromise = null
  await hydratePlanningCache()
}

// ---- Optimistic local mutation helpers (immediate cache update, no invariant logic) ----
// Every one of these is a no-op when window is undefined — a server-side
// call must never mutate this process's shared module state, the same
// guarantee writeLocal already gave localStorage writes.

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function applyProjectUpsert(project: Project): void {
  if (!isBrowser()) return
  const others = cache.projects.filter(p => p.slug !== project.slug)
  cache = { ...cache, projects: [project, ...others] }
}

export function applyMilestoneUpsert(milestone: Milestone): void {
  if (!isBrowser()) return
  const others = cache.milestones.filter(m => m.id !== milestone.id)
  cache = { ...cache, milestones: [milestone, ...others] }
}

export function applyMilestoneRemoval(id: string): void {
  if (!isBrowser()) return
  cache = { ...cache, milestones: cache.milestones.filter(m => m.id !== id) }
}

export function applyBatchUpsert(batch: Batch): void {
  if (!isBrowser()) return
  const others = cache.batches.filter(b => b.id !== batch.id)
  cache = { ...cache, batches: [batch, ...others] }
}

export function applyBatchRemoval(id: string): void {
  if (!isBrowser()) return
  cache = { ...cache, batches: cache.batches.filter(b => b.id !== id) }
}

export function applyDecisionUpsert(decision: Decision): void {
  if (!isBrowser()) return
  const others = cache.decisions.filter(d => d.id !== decision.id)
  cache = { ...cache, decisions: [decision, ...others] }
}

export function applyDecisionRemoval(id: string): void {
  if (!isBrowser()) return
  cache = { ...cache, decisions: cache.decisions.filter(d => d.id !== id) }
}

export function applyRiskUpsert(risk: Risk): void {
  if (!isBrowser()) return
  const others = cache.risks.filter(r => r.id !== risk.id)
  cache = { ...cache, risks: [risk, ...others] }
}

export function applyRiskRemoval(id: string): void {
  if (!isBrowser()) return
  cache = { ...cache, risks: cache.risks.filter(r => r.id !== id) }
}

export function applyTechnicalDebtUpsert(debt: TechnicalDebt): void {
  if (!isBrowser()) return
  const others = cache.technicalDebt.filter(d => d.id !== debt.id)
  cache = { ...cache, technicalDebt: [debt, ...others] }
}

export function applyTechnicalDebtRemoval(id: string): void {
  if (!isBrowser()) return
  cache = { ...cache, technicalDebt: cache.technicalDebt.filter(d => d.id !== id) }
}

export function applyRoadmapListsUpsert(project: string, kind: ProjectListKind, items: RoadmapLists[ProjectListKind]): void {
  if (!isBrowser()) return
  const current = cache.roadmapLists[project] ?? { roadmap: [], upcoming: [] }
  cache = { ...cache, roadmapLists: { ...cache.roadmapLists, [project]: { ...current, [kind]: items } } }
}

/** Fire the real request in the background, then reconcile the cache from the server's authoritative result. Errors are swallowed here (matching the existing fail-soft localStorage getters' `catch { fallback }` convention) — the next reconciliation or manual refresh will still converge. */
export function scheduleServerWrite(request: () => Promise<unknown>): void {
  void request()
    .catch(() => {})
    .then(() => refreshPlanningCache())
}

export { callApi }
