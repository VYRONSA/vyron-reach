import { spawn, type ChildProcess } from 'node:child_process'
import { getJob, updateJob } from './runtimeStorage'
import { validateClaudeOutput } from './runtimeValidation'
import { parseClaudeReport } from '../developmentCompletionEngine'
import type { DevelopmentJob } from './runtimeTypes'

/** 15 minutes — a generous ceiling for one batch-sized implementation task, not a guess at Claude's own limits. */
const RUNTIME_TIMEOUT_MS = 15 * 60 * 1000

const activeProcesses = new Map<string, ChildProcess>()

/** Best-effort kill for a job still in flight — used by the Cancel action. No-op if the job already finished. */
export function killDevelopmentJob(jobId: string): boolean {
  const child = activeProcesses.get(jobId)
  if (!child) return false
  child.kill('SIGTERM')
  activeProcesses.delete(jobId)
  return true
}

/**
 * Spawns `claude -p <prompt> --output-format json` as a child process
 * scoped to this repository's working directory, and drives the job
 * through Running → Validating → Completed/Failed as the process
 * progresses. The prompt is passed as a discrete argv entry (spawn with an
 * args array, shell: false) specifically so it is never interpreted by a
 * shell — arbitrary prompt text must not become shell syntax.
 */
export async function executeDevelopmentJob(job: DevelopmentJob): Promise<void> {
  const startedAt = new Date().toISOString()
  updateJob(job.id, { status: 'Running', startedAt })
  const start = Date.now()

  await new Promise<void>(resolve => {
    let stdout = ''
    let stderr = ''
    let timedOut = false

    const child = spawn('claude', ['-p', job.prompt, '--output-format', 'json'], {
      cwd: process.cwd(),
      shell: false,
    })
    activeProcesses.set(job.id, child)

    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
    }, RUNTIME_TIMEOUT_MS)

    child.stdout.on('data', chunk => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', chunk => {
      stderr += chunk.toString()
    })

    child.on('error', err => {
      clearTimeout(timer)
      activeProcesses.delete(job.id)
      updateJob(job.id, {
        status: 'Failed',
        completedAt: new Date().toISOString(),
        duration: Date.now() - start,
        stderr,
        error: `Failed to launch the claude CLI: ${err.message}. Is it installed and on PATH?`,
      })
      resolve()
    })

    child.on('close', code => {
      clearTimeout(timer)
      activeProcesses.delete(job.id)
      const duration = Date.now() - start

      if (getJob(job.id)?.status === 'Cancelled') {
        resolve()
        return
      }

      if (timedOut) {
        updateJob(job.id, {
          status: 'Failed',
          completedAt: new Date().toISOString(),
          duration,
          exitCode: code,
          rawOutput: stdout || null,
          stderr,
          error: `Timed out after ${RUNTIME_TIMEOUT_MS / 1000}s.`,
        })
        resolve()
        return
      }

      if (code !== 0) {
        updateJob(job.id, {
          status: 'Failed',
          completedAt: new Date().toISOString(),
          duration,
          exitCode: code,
          rawOutput: stdout || null,
          stderr,
          error: stderr.trim() || `claude exited with code ${code}.`,
        })
        resolve()
        return
      }

      updateJob(job.id, { status: 'Validating', exitCode: code, rawOutput: stdout, stderr })
      const validation = validateClaudeOutput(stdout)

      if (!validation.valid) {
        updateJob(job.id, {
          status: 'Failed',
          completedAt: new Date().toISOString(),
          duration,
          error: validation.reason,
        })
        resolve()
        return
      }

      const { output } = validation
      const parsed = parseClaudeReport(output.resultText)

      updateJob(job.id, {
        status: 'Completed',
        completedAt: new Date().toISOString(),
        duration,
        claudeSessionId: output.sessionId,
        claudeUuid: output.uuid,
        cost: output.costUsd,
        usage: output.usage,
        result: output.resultText,
        buildStatus: parsed.buildStatus,
        typescriptStatus: parsed.typescriptStatus,
      })
      resolve()
    })
  })
}
