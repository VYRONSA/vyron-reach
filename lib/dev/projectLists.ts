import { getPlanningCache, applyRoadmapListsUpsert, scheduleServerWrite, callApi, randomPlanningId, nowISO } from './planningState/planningClientCache'

export type ProjectListKind = 'roadmap' | 'upcoming'

export type ProjectListItem = {
  id: string
  title: string
  detail: string
  status: string
  createdAt: string
  updatedAt: string
}

export const PROJECT_LIST_CONFIG: Record<
  ProjectListKind,
  { label: string; detailLabel: string; detailPlaceholder: string; statusOptions: string[] }
> = {
  roadmap: {
    label: 'Roadmap',
    detailLabel: 'Timeframe',
    detailPlaceholder: 'e.g. Q3 2026',
    statusOptions: ['Planned', 'In progress', 'Done'],
  },
  upcoming: {
    label: 'Upcoming Work',
    detailLabel: 'Notes',
    detailPlaceholder: 'Brief context',
    statusOptions: ['Planned', 'Next', 'Later'],
  },
}

/** Reads the browser's in-memory Planning cache — never localStorage. See lib/dev/planningState/planningClientCache.ts. */
export function getProjectList(projectSlug: string, kind: ProjectListKind): ProjectListItem[] {
  return getPlanningCache().roadmapLists[projectSlug]?.[kind] ?? []
}

export function addProjectListItem(
  projectSlug: string,
  kind: ProjectListKind,
  input: { title: string; detail: string; status: string }
): ProjectListItem {
  const now = nowISO()
  const item: ProjectListItem = {
    id: randomPlanningId(kind),
    title: input.title.trim(),
    detail: input.detail.trim(),
    status: input.status,
    createdAt: now,
    updatedAt: now,
  }
  applyRoadmapListsUpsert(projectSlug, kind, [item, ...getProjectList(projectSlug, kind)])
  scheduleServerWrite(() =>
    callApi(`/api/dev/planning/projects/${projectSlug}/roadmap`, {
      method: 'POST',
      body: JSON.stringify({ kind, title: item.title, detail: item.detail, status: item.status }),
    })
  )
  return item
}

export function updateProjectListItem(
  projectSlug: string,
  kind: ProjectListKind,
  id: string,
  patch: Partial<Pick<ProjectListItem, 'title' | 'detail' | 'status'>>
) {
  const items = getProjectList(projectSlug, kind).map(item => (item.id === id ? { ...item, ...patch, updatedAt: nowISO() } : item))
  applyRoadmapListsUpsert(projectSlug, kind, items)
  scheduleServerWrite(() =>
    callApi(`/api/dev/planning/projects/${projectSlug}/roadmap/${id}`, { method: 'PATCH', body: JSON.stringify({ kind, ...patch }) })
  )
}

export function deleteProjectListItem(projectSlug: string, kind: ProjectListKind, id: string) {
  applyRoadmapListsUpsert(
    projectSlug,
    kind,
    getProjectList(projectSlug, kind).filter(item => item.id !== id)
  )
  scheduleServerWrite(() => callApi(`/api/dev/planning/projects/${projectSlug}/roadmap/${id}?kind=${kind}`, { method: 'DELETE' }))
}
