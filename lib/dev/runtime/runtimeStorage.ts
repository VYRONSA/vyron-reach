import fs from 'node:fs'
import path from 'node:path'
import type { DevelopmentJob } from './runtimeTypes'

/**
 * Server-side, file-backed job store. This is deliberately NOT the
 * localStorage pattern every other store in VYRON DEV uses — a background
 * Node process spawning `claude` has no browser/window to write to, and a
 * job must keep progressing even if no browser tab is open to watch it.
 * Lives outside .next/ so a build doesn't wipe it; gitignored since job
 * history is local runtime state, not project data.
 */
const STORE_DIR = path.join(process.cwd(), '.vyron-dev')
const STORE_FILE = path.join(STORE_DIR, 'runtime-jobs.json')

function ensureStore(): void {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true })
  if (!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, '[]', 'utf-8')
}

export function readJobs(): DevelopmentJob[] {
  ensureStore()
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8')
    return JSON.parse(raw) as DevelopmentJob[]
  } catch {
    return []
  }
}

function writeJobs(jobs: DevelopmentJob[]): void {
  ensureStore()
  fs.writeFileSync(STORE_FILE, JSON.stringify(jobs, null, 2), 'utf-8')
}

export function getJob(id: string): DevelopmentJob | null {
  return readJobs().find(j => j.id === id) ?? null
}

export function saveJob(job: DevelopmentJob): void {
  const jobs = readJobs()
  jobs.unshift(job)
  writeJobs(jobs)
}

export function updateJob(id: string, patch: Partial<DevelopmentJob>): DevelopmentJob | null {
  const jobs = readJobs()
  const idx = jobs.findIndex(j => j.id === id)
  if (idx === -1) return null
  jobs[idx] = { ...jobs[idx], ...patch }
  writeJobs(jobs)
  return jobs[idx]
}

export function listJobsForProject(slug: string): DevelopmentJob[] {
  return readJobs().filter(j => j.projectSlug === slug)
}
