import { readLocal, writeLocal } from './localStore'

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

function keyFor(projectSlug: string, kind: ProjectListKind) {
  return `vyron-dev-project-${kind}-${projectSlug}-v1`
}

export function getProjectList(projectSlug: string, kind: ProjectListKind): ProjectListItem[] {
  return readLocal<ProjectListItem[]>(keyFor(projectSlug, kind), [])
}

function saveProjectList(projectSlug: string, kind: ProjectListKind, items: ProjectListItem[]) {
  writeLocal(keyFor(projectSlug, kind), items)
}

export function addProjectListItem(
  projectSlug: string,
  kind: ProjectListKind,
  input: { title: string; detail: string; status: string }
): ProjectListItem {
  const now = new Date().toISOString()
  const item: ProjectListItem = {
    id: `${kind}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: input.title.trim(),
    detail: input.detail.trim(),
    status: input.status,
    createdAt: now,
    updatedAt: now,
  }
  const items = getProjectList(projectSlug, kind)
  items.unshift(item)
  saveProjectList(projectSlug, kind, items)
  return item
}

export function updateProjectListItem(
  projectSlug: string,
  kind: ProjectListKind,
  id: string,
  patch: Partial<Pick<ProjectListItem, 'title' | 'detail' | 'status'>>
) {
  const items = getProjectList(projectSlug, kind).map(item =>
    item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
  )
  saveProjectList(projectSlug, kind, items)
}

export function deleteProjectListItem(projectSlug: string, kind: ProjectListKind, id: string) {
  saveProjectList(
    projectSlug,
    kind,
    getProjectList(projectSlug, kind).filter(item => item.id !== id)
  )
}
