import fs from 'node:fs'
import path from 'node:path'
import { atomicWriteFileSync, withFileLock } from '../fileLock'
import { canTransition } from './executionStateMachine'
import type { DevelopmentJob } from './runtimeTypes'

/**
 * Server-side, file-backed job store. This is deliberately NOT the
 * localStorage pattern every other store in VYRON DEV uses — a background
 * Node process spawning `claude` has no browser/window to write to, and a
 * job must keep progressing even if no browser tab is open to watch it.
 * Lives outside .next/ so a build doesn't wipe it; gitignored since job
 * history is local runtime state, not project data.
 *
 * saveJob/updateJob run their whole read-modify-write cycle inside
 * withFileLock so two concurrent writers (e.g. the Director loop and a
 * manual runtime action, or — before the loop-ownership fix — two racing
 * loop instances) can never interleave and silently drop each other's
 * job record; writes themselves are atomic (write-then-rename), so a
 * reader never observes a partial file either.
 *
 * updateJob additionally enforces the Execution State Machine
 * (executionStateMachine.ts) on every status-changing write, not just the
 * call sites that happen to check it themselves — this is what makes a
 * job's lifecycle monotonic: once a status has no legal outgoing
 * transition (Completed/Failed/Cancelled/Rejected all have an empty
 * transition list), no later write can ever move it away from that value
 * again, no matter which code path produced the write or how stale the
 * data it was computed from was. This is the fix for the exact race that
 * let orphan-detection reconciliation downgrade an already-Completed job
 * back to Failed using a stale Running/Validating read.
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
  atomicWriteFileSync(STORE_FILE, JSON.stringify(jobs, null, 2))
}

export function getJob(id: string): DevelopmentJob | null {
  return readJobs().find(j => j.id === id) ?? null
}

export function saveJob(job: DevelopmentJob): void {
  withFileLock(STORE_FILE, () => {
    const jobs = readJobs()
    jobs.unshift(job)
    writeJobs(jobs)
  })
}

export function updateJob(id: string, patch: Partial<DevelopmentJob>): DevelopmentJob | null {
  return withFileLock(STORE_FILE, () => {
    const jobs = readJobs()
    const idx = jobs.findIndex(j => j.id === id)
    if (idx === -1) return null
    const current = jobs[idx]

    // The current status is read fresh, inside the same lock that will
    // perform the write — this is what makes the check race-proof, not
    // just correct-on-average. If the job has already moved on to a
    // status this patch's status doesn't legally follow (most commonly:
    // it already reached Completed/Failed/Cancelled/Rejected via a
    // different, legitimate write since whoever built this patch last
    // read it), the whole patch is discarded, not just the status field —
    // a bundle like { status: 'Failed', error: '...' } is one coherent
    // fact about a transition that either happened or didn't; applying
    // only some of its fields would leave the record self-contradictory
    // (e.g. status: Completed but error: "interrupted").
    if (patch.status && patch.status !== current.status && !canTransition(current.status, patch.status)) {
      return current
    }

    jobs[idx] = { ...current, ...patch }
    writeJobs(jobs)
    return jobs[idx]
  })
}

export function listJobsForProject(slug: string): DevelopmentJob[] {
  return readJobs().filter(j => j.projectSlug === slug)
}
