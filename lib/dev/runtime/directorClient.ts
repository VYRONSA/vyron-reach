import type { DirectorRuntimeStatus, EngineeringInboxItem } from '../director/directorRuntimeTypes'
import type { RaiseNotificationInput } from '../notifications/notificationTypes'
import type { CreateInboxItemInput } from '../director/engineeringInboxStore'
import type { HandoffInput } from '../director/executionSnapshotTypes'

/**
 * Thin fetch wrappers over the Director's API surface — this is the ONLY
 * way the browser ever touches execution. Every function here is a
 * read (status/history/inbox) or a single state-transition request
 * (start/pause/resume/cancel/resolve/dismiss); the actual orchestration
 * loop lives entirely server-side in serverExecutionLoop.ts and knows
 * nothing about whether any of these calls ever happen.
 */

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  const body = await res.json()
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`)
  return body as T
}

export async function getDirectorStatus(project: string): Promise<DirectorRuntimeStatus> {
  const { status } = await fetchJson<{ status: DirectorRuntimeStatus }>(`/api/dev/director/status?project=${encodeURIComponent(project)}`)
  return status
}

/** Every project's status at once — the Global Engineering Inbox's cross-project view needs this to know which state each item's project is currently in. */
export async function listAllDirectorStatuses(): Promise<DirectorRuntimeStatus[]> {
  const { statuses } = await fetchJson<{ statuses: DirectorRuntimeStatus[] }>('/api/dev/director/status')
  return statuses
}

export async function patchDirectorStatus(project: string, patch: Partial<Omit<DirectorRuntimeStatus, 'project'>>): Promise<DirectorRuntimeStatus> {
  const { status } = await fetchJson<{ status: DirectorRuntimeStatus }>('/api/dev/director/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, patch }),
  })
  return status
}

export async function appendDirectorHistory(project: string, event: string, batchId: string | null, detail: string): Promise<void> {
  await fetchJson('/api/dev/director/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, event, batchId, detail }),
  })
}

export async function createEngineeringInboxItem(input: CreateInboxItemInput): Promise<EngineeringInboxItem> {
  const { item } = await fetchJson<{ item: EngineeringInboxItem }>('/api/dev/director/inbox', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return item
}

export async function listEngineeringInbox(project?: string, status?: EngineeringInboxItem['status']): Promise<EngineeringInboxItem[]> {
  const params = new URLSearchParams()
  if (project) params.set('project', project)
  if (status) params.set('status', status)
  const { items } = await fetchJson<{ items: EngineeringInboxItem[] }>(`/api/dev/director/inbox?${params.toString()}`)
  return items
}

export async function resolveEngineeringInboxItem(id: string, note?: string): Promise<EngineeringInboxItem> {
  const { item } = await fetchJson<{ item: EngineeringInboxItem }>(`/api/dev/director/inbox/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'resolve', note }),
  })
  return item
}

export async function dismissEngineeringInboxItem(id: string, note?: string): Promise<EngineeringInboxItem> {
  const { item } = await fetchJson<{ item: EngineeringInboxItem }>(`/api/dev/director/inbox/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'dismiss', note }),
  })
  return item
}

export async function markEngineeringInboxItemRead(id: string): Promise<EngineeringInboxItem> {
  const { item } = await fetchJson<{ item: EngineeringInboxItem }>(`/api/dev/director/inbox/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'read' }),
  })
  return item
}

export async function raiseDirectorNotification(input: RaiseNotificationInput): Promise<void> {
  await fetchJson('/api/dev/director/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

/** START DEVELOPMENT — the browser's one hand-off to the server. Everything after this is server-owned; see serverExecutionLoop.ts. */
export async function startDirector(project: string, handoff: HandoffInput): Promise<DirectorRuntimeStatus> {
  const { status } = await fetchJson<{ status: DirectorRuntimeStatus }>(`/api/dev/director/${encodeURIComponent(project)}/handoff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(handoff),
  })
  return status
}

export async function cancelDirector(project: string): Promise<DirectorRuntimeStatus> {
  const { status } = await fetchJson<{ status: DirectorRuntimeStatus }>(`/api/dev/director/${encodeURIComponent(project)}/cancel`, { method: 'POST' })
  return status
}

export async function pauseDirector(project: string): Promise<DirectorRuntimeStatus> {
  const { status } = await fetchJson<{ status: DirectorRuntimeStatus }>(`/api/dev/director/${encodeURIComponent(project)}/pause`, { method: 'POST' })
  return status
}

export async function resumeDirector(project: string): Promise<DirectorRuntimeStatus> {
  const { status } = await fetchJson<{ status: DirectorRuntimeStatus }>(`/api/dev/director/${encodeURIComponent(project)}/resume`, { method: 'POST' })
  return status
}
