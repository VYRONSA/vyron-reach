import { randomUUID } from 'node:crypto'
import { readJsonStore, updateJsonStore } from '../fileJsonStore'
import { publish } from '../../events/eventBus'
import { paginate, inDateRange, buildSearchIndex, searchWithIndex } from '../../query/queryHelpers'
import type { PageRequest, PageResult, DateRangeFilter } from '../../query/queryTypes'
import type { WorkforceTask, WorkerRole } from './workforceTypes'

/**
 * Durable record of every task the Director has ever created and
 * assigned — on the same atomic fileJsonStore primitives every other
 * durable store in this app uses. Append-only, uncapped: a permanent
 * record of "what work was assigned to which role, under which frozen
 * context," not an operational log. This is also what
 * conflictResolution.ts reads to find recently-completed tasks whose
 * file changes might overlap with a new one.
 */

const FILE = 'workforce-tasks.json'

export type CreateWorkforceTaskInput = Omit<WorkforceTask, 'id' | 'createdAt' | 'runtimeJobId' | 'filesChanged'>

export function createWorkforceTask(input: CreateWorkforceTaskInput): WorkforceTask {
  const task: WorkforceTask = { ...input, id: randomUUID(), runtimeJobId: null, filesChanged: null, createdAt: new Date().toISOString() }
  updateJsonStore<WorkforceTask[]>(FILE, [], tasks => [task, ...tasks])
  publish({ category: 'Worker Assignment', project: task.project, type: 'task-assigned', payload: { taskId: task.id, role: task.requiredRole, batchId: task.batchId } })
  return task
}

export function attachRuntimeJobId(taskId: string, runtimeJobId: string): WorkforceTask | null {
  return patchTask(taskId, { runtimeJobId })
}

export function recordWorkforceTaskCompletion(taskId: string, filesChanged: WorkforceTask['filesChanged']): WorkforceTask | null {
  const result = patchTask(taskId, { filesChanged })
  if (result) publish({ category: 'Worker Completion', project: result.project, type: 'task-completed', payload: { taskId: result.id, role: result.requiredRole, batchId: result.batchId } })
  return result
}

function patchTask(taskId: string, patch: Partial<Omit<WorkforceTask, 'id'>>): WorkforceTask | null {
  let result: WorkforceTask | null = null
  updateJsonStore<WorkforceTask[]>(FILE, [], tasks => {
    const idx = tasks.findIndex(t => t.id === taskId)
    if (idx === -1) return tasks
    const next = [...tasks]
    result = { ...tasks[idx], ...patch }
    next[idx] = result
    return next
  })
  return result
}

export function listWorkforceTasks(project: string): WorkforceTask[] {
  return readJsonStore<WorkforceTask[]>(FILE, []).filter(t => t.project === project)
}

/** Most recent tasks first, already limited to a fixed window — used by conflictResolution.ts so overlap detection never scans a project's entire task history. */
export function recentWorkforceTasks(project: string, limit: number): WorkforceTask[] {
  return listWorkforceTasks(project).slice(0, limit)
}

/**
 * Enterprise Scalability (Version 2.0 Phase 5, Milestone 5.2) — paginated/
 * filtered/searched Worker History. Like the Knowledge Service's domains,
 * this store's own header comment above already declares it "Append-
 * only, uncapped... a permanent record," so — same reasoning as
 * knowledgeStore.ts and assessmentStore.ts — this gets pagination/
 * filtering/search, not archiving.
 */
export type WorkforceTaskQueryFilter = { role?: WorkerRole; completed?: boolean; dateRange?: DateRangeFilter; search?: string }

export function queryWorkforceTasks(project: string, filter: WorkforceTaskQueryFilter = {}, page: PageRequest = {}): PageResult<WorkforceTask> {
  let items = listWorkforceTasks(project)
  if (filter.role) items = items.filter(t => t.requiredRole === filter.role)
  if (filter.completed !== undefined) items = items.filter(t => (t.filesChanged !== null) === filter.completed)
  if (filter.dateRange) items = items.filter(t => inDateRange(t.createdAt, filter.dateRange))
  if (filter.search) {
    const index = buildSearchIndex(items, t => `${t.requiredRole} ${t.phase} ${t.batchId}`)
    items = searchWithIndex(items, index, filter.search)
  }
  return paginate(items, page)
}
