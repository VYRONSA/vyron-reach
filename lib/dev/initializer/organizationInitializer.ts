import { readLocal, writeLocal } from '../localStore'
import type { Project } from '../projectsData'
import { initializeRoadmap } from './roadmapInitializer'
import { initializeBatches } from './batchInitializer'
import { initializeQueue } from './queueInitializer'
import type { EngineeringOrganizationAudit, EngineeringOrganizationState, InitializerStepResult } from './initializerTypes'

const KEY = 'vyron-dev-engineering-org-v1'
const MAX_AUDIT_HISTORY = 20

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  const body = await res.json()
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`)
  return body as T
}

function readStates(): Record<string, EngineeringOrganizationState> {
  return readLocal<Record<string, EngineeringOrganizationState>>(KEY, {})
}

function writeState(state: EngineeringOrganizationState): void {
  const states = readStates()
  states[state.projectSlug] = state
  writeLocal(KEY, states)
}

/** The single source of truth Mission Control / the Executive Command Centre read to show "Engineering Organization: Ready" instead of "Unknown". */
export function getEngineeringOrganizationState(projectSlug: string): EngineeringOrganizationState {
  return (
    readStates()[projectSlug] ?? {
      projectSlug,
      engineeringReady: false,
      initializedAt: null,
      initializedBy: null,
      lastAudit: null,
      auditHistory: [],
    }
  )
}

export function isEngineeringReady(projectSlug: string): boolean {
  return getEngineeringOrganizationState(projectSlug).engineeringReady
}

/**
 * The Engineering Organization Initializer's single entry point — "a
 * newly created product should become engineering-ready with a single
 * action." Runs the Roadmap (Phases + Milestones) and Batches locally
 * against localStorage, confirms the Queue, then makes one server round
 * trip for DNA + Learning (the only two file-backed pieces). Every step
 * is independently idempotent (each initializer skips what already
 * exists), so calling this a second time never duplicates data even if
 * the caller doesn't check `isEngineeringReady` first — that's what
 * satisfies "running Initialize twice must never duplicate data" at the
 * source, rather than relying on a single top-level guard that could
 * itself get out of sync with reality.
 */
export async function initializeEngineeringOrganization(
  project: Project,
  initiatedBy: string
): Promise<{ state: EngineeringOrganizationState; audit: EngineeringOrganizationAudit }> {
  const startedAt = new Date().toISOString()
  const startedAtMs = Date.now()

  const { phaseResult, milestoneResult, milestones } = initializeRoadmap(project.slug)
  const batchResult = initializeBatches(project.slug, milestones)
  const queueResult = initializeQueue(project.slug)

  const { dnaResult, learningResult } = await fetchJson<{ dnaResult: InitializerStepResult; learningResult: InitializerStepResult }>(
    '/api/dev/initializer',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectSlug: project.slug, productName: project.name, category: project.category }),
    }
  )

  const completedAt = new Date().toISOString()
  const audit: EngineeringOrganizationAudit = {
    projectSlug: project.slug,
    initializedBy: initiatedBy,
    startedAt,
    completedAt,
    durationMs: Date.now() - startedAtMs,
    steps: [phaseResult, milestoneResult, batchResult, queueResult, learningResult, dnaResult],
  }

  const previous = getEngineeringOrganizationState(project.slug)
  const state: EngineeringOrganizationState = {
    projectSlug: project.slug,
    engineeringReady: true,
    initializedAt: previous.initializedAt ?? completedAt,
    initializedBy: previous.initializedBy ?? initiatedBy,
    lastAudit: audit,
    auditHistory: [audit, ...previous.auditHistory].slice(0, MAX_AUDIT_HISTORY),
  }
  writeState(state)

  return { state, audit }
}
