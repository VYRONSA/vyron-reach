import { readLocal, writeLocal } from './localStore'

export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done'

export type Task = {
  id: string
  title: string
  project: string // project slug, or '' for unassigned
  priority: TaskPriority
  status: TaskStatus
  notes: string
  createdAt: string
  updatedAt: string
}

const QUEUE_KEY = 'vyron-dev-queue-v1'

export function getTasks(): Task[] {
  return readLocal<Task[]>(QUEUE_KEY, [])
}

function saveTasks(tasks: Task[]) {
  writeLocal(QUEUE_KEY, tasks)
}

export function createTask(input: {
  title: string
  project: string
  priority: TaskPriority
  notes?: string
}): Task {
  const now = new Date().toISOString()
  const task: Task = {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: input.title.trim(),
    project: input.project,
    priority: input.priority,
    status: 'todo',
    notes: input.notes?.trim() ?? '',
    createdAt: now,
    updatedAt: now,
  }
  const tasks = getTasks()
  tasks.unshift(task)
  saveTasks(tasks)
  return task
}

export function updateTask(id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>): void {
  const tasks = getTasks().map(t => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t))
  saveTasks(tasks)
}

export function deleteTask(id: string): void {
  saveTasks(getTasks().filter(t => t.id !== id))
}

export function toggleTaskComplete(id: string): void {
  const tasks = getTasks().map(t =>
    t.id === id ? { ...t, status: (t.status === 'done' ? 'todo' : 'done') as TaskStatus, updatedAt: new Date().toISOString() } : t
  )
  saveTasks(tasks)
}

export function tasksForProject(slug: string): Task[] {
  return getTasks().filter(t => t.project === slug)
}

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To do',
  'in-progress': 'In progress',
  blocked: 'Blocked',
  done: 'Done',
}
