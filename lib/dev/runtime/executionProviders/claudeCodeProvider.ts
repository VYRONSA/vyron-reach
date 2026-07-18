import { spawn, type ChildProcess } from 'node:child_process'
import { validateClaudeOutput } from '../runtimeValidation'
import { parseClaudeReport } from '../../developmentCompletionEngine'
import { captureGitDiffSummary } from '../../gitDiffCapture'
import type { DevelopmentJob, RuntimePhase } from '../runtimeTypes'
import type { ExecutionProvider, ExecutionProviderHandlers } from './types'

/** 15 minutes — a generous ceiling for one batch-sized implementation task, not a guess at Claude's own limits. */
const RUNTIME_TIMEOUT_MS = 15 * 60 * 1000

const activeProcesses = new Map<string, ChildProcess>()

/**
 * Maps a tool_use event's tool name (and, for Bash, its command text) to
 * one of the Live Execution phases — best-effort inference from Claude's
 * own streamed events, never a guess presented as certain: an
 * unrecognized tool just falls back to the generic 'Executing' phase
 * rather than a wrong specific one.
 */
function phaseForToolUse(name: unknown, input: unknown): RuntimePhase {
  if (typeof name !== 'string') return 'Executing'
  if (name === 'Read' || name === 'Glob' || name === 'Grep') return 'Reading Files'
  if (name === 'Write' || name === 'Edit' || name === 'NotebookEdit') return 'Writing Code'
  if (name === 'Bash') {
    const command = typeof input === 'object' && input !== null && 'command' in input ? String((input as { command: unknown }).command ?? '') : ''
    const lower = command.toLowerCase()
    if (lower.includes('tsc')) return 'Running TypeScript'
    if (lower.includes('build')) return 'Running Build'
    if (lower.includes('test') || lower.includes('validate')) return 'Running Validation'
  }
  return 'Executing'
}

/**
 * Parses one line of `--output-format stream-json` output. Returns the
 * inferred phase if this line was a recognizable assistant tool_use event,
 * or the raw JSON text of the line if it was the final `result` event
 * (which has the exact same shape validateClaudeOutput already expects
 * from buffered `--output-format json` mode, so it's reused unchanged
 * rather than re-implemented). Never throws — a line that isn't valid
 * JSON, or doesn't match either shape, is simply ignored.
 */
function parseStreamLine(line: string): { phase?: RuntimePhase; resultLine?: string } {
  const trimmed = line.trim()
  if (!trimmed) return {}
  let event: unknown
  try {
    event = JSON.parse(trimmed)
  } catch {
    return {}
  }
  if (typeof event !== 'object' || event === null) return {}
  const record = event as Record<string, unknown>

  if (record.type === 'result') {
    return { resultLine: trimmed }
  }

  if (record.type === 'assistant' && typeof record.message === 'object' && record.message !== null) {
    const content = (record.message as Record<string, unknown>).content
    if (Array.isArray(content)) {
      for (const block of content) {
        if (block && typeof block === 'object' && (block as Record<string, unknown>).type === 'tool_use') {
          const toolBlock = block as Record<string, unknown>
          return { phase: phaseForToolUse(toolBlock.name, toolBlock.input) }
        }
      }
    }
  }

  return {}
}

/**
 * Spawns Claude Code as a child process scoped to this repository's
 * working directory, and drives the job through Running → Validating →
 * Completed/Failed as the process progresses. Uses `--output-format
 * stream-json --verbose` (line-delimited events as they happen) instead
 * of buffered `--output-format json` so the job's currentPhase can be
 * updated live from Claude's own tool_use events (Live Execution); the
 * final `result`-type line carries the exact same fields the buffered
 * mode's single JSON blob did, so it's validated by the same
 * validateClaudeOutput — nothing about the actual completion/validation
 * contract changed, only when information becomes visible.
 *
 * If a prior attempt's Claude session id is supplied (a Retry after a
 * Rejected/Cancelled job that got far enough to receive one), `--resume`
 * continues that session instead of starting cold.
 *
 * The prompt is passed as a discrete argv entry (spawn with an args
 * array, shell: false) specifically so it is never interpreted by a
 * shell — arbitrary prompt text must not become shell syntax.
 */
async function run(job: DevelopmentJob, handlers: ExecutionProviderHandlers): Promise<void> {
  const { updateJob, getJob } = handlers
  const startedAt = new Date().toISOString()
  updateJob({ status: 'Running', startedAt, currentPhase: 'Launching Claude' })
  const start = Date.now()

  await new Promise<void>(resolve => {
    let stdout = ''
    let stderr = ''
    let lineBuffer = ''
    let resultLine: string | null = null
    let timedOut = false

    const args = ['-p', job.prompt, '--output-format', 'stream-json', '--verbose']
    if (job.resumedSessionId) args.push('--resume', job.resumedSessionId)

    const child = spawn('claude', args, {
      cwd: process.cwd(),
      shell: false,
    })
    activeProcesses.set(job.id, child)
    updateJob({ pid: child.pid ?? null })

    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
    }, RUNTIME_TIMEOUT_MS)

    child.stdout.on('data', chunk => {
      const text = chunk.toString()
      stdout += text
      lineBuffer += text
      const lines = lineBuffer.split('\n')
      lineBuffer = lines.pop() ?? ''
      for (const line of lines) {
        const parsed = parseStreamLine(line)
        if (parsed.resultLine) resultLine = parsed.resultLine
        if (parsed.phase) updateJob({ currentPhase: parsed.phase })
      }
    })
    child.stderr.on('data', chunk => {
      stderr += chunk.toString()
    })

    child.on('error', err => {
      clearTimeout(timer)
      activeProcesses.delete(job.id)
      updateJob({
        status: 'Failed',
        completedAt: new Date().toISOString(),
        duration: Date.now() - start,
        stderr,
        error: `Failed to launch the claude CLI: ${err.message}. Is it installed and on PATH?`,
      })
      resolve()
    })

    child.on('close', async code => {
      clearTimeout(timer)
      activeProcesses.delete(job.id)
      const duration = Date.now() - start

      // A final partial line (no trailing newline) can still hold the result event.
      if (!resultLine && lineBuffer.trim()) {
        const parsed = parseStreamLine(lineBuffer)
        if (parsed.resultLine) resultLine = parsed.resultLine
      }

      if (getJob()?.status === 'Cancelled') {
        resolve()
        return
      }

      if (timedOut) {
        updateJob({
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
        updateJob({
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

      updateJob({ status: 'Validating', currentPhase: 'Running Validation', exitCode: code, rawOutput: stdout, stderr })
      // Defensive fallback: if the stream never produced a distinguishable
      // result event, fall back to treating the whole buffered stdout as a
      // single JSON blob — costs nothing, and covers the case where this
      // CLI version's stream-json output didn't match the assumed shape.
      const validation = validateClaudeOutput(resultLine ?? stdout)

      if (!validation.valid) {
        updateJob({
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
      const gitDiffSummary = await captureGitDiffSummary(process.cwd())

      updateJob({
        status: 'Completed',
        completedAt: new Date().toISOString(),
        duration,
        currentPhase: null,
        claudeSessionId: output.sessionId,
        claudeUuid: output.uuid,
        cost: output.costUsd,
        usage: output.usage,
        result: output.resultText,
        buildStatus: parsed.buildStatus,
        typescriptStatus: parsed.typescriptStatus,
        gitDiffSummary,
      })
      resolve()
    })
  })
}

function kill(jobId: string): boolean {
  const child = activeProcesses.get(jobId)
  if (!child) return false
  child.kill('SIGTERM')
  activeProcesses.delete(jobId)
  return true
}

export const claudeCodeProvider: ExecutionProvider = {
  id: 'claude-code',
  displayName: 'Claude Code',
  isAvailable: () => true,
  run,
  kill,
}
