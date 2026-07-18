import { execFile } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import type { ContinuousValidationResult, RollbackPoint } from './operationsTypes'

const VALIDATION_TIMEOUT_MS = 5 * 60 * 1000
const MAX_OUTPUT_BYTES = 10 * 1024 * 1024

function run(cmd: string, args: string[], cwd: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise(resolve => {
    // shell: true is required here for npm/npx to resolve on Windows — safe because cmd/args are fixed literals below, never interpolated user input.
    execFile(cmd, args, { cwd, timeout: VALIDATION_TIMEOUT_MS, maxBuffer: MAX_OUTPUT_BYTES, shell: true }, (err, stdout, stderr) => {
      const code = typeof err?.code === 'number' ? err.code : err ? 1 : 0
      resolve({ code, stdout: stdout ?? '', stderr: stderr ?? '' })
    })
  })
}

/**
 * The Continuous Validation Engine's subprocess half — actually runs
 * `npm run build` and `npx tsc --noEmit`, the exact two commands this
 * project's own batch workflow has run after every single change, and
 * writes the result to lib/dev/lastValidation.json, the same file Build
 * Intelligence already trusts. This is a real, costly operation (a full
 * build), not a status re-read — server-only, gated identically to the
 * rest of the runtime.
 */
export async function runContinuousValidation(cwd: string): Promise<ContinuousValidationResult> {
  const start = Date.now()
  const buildResult = await run('npm', ['run', 'build'], cwd)
  const tscResult = await run('npx', ['tsc', '--noEmit'], cwd)
  const durationMs = Date.now() - start

  const buildStatus: 'Passing' | 'Failing' = buildResult.code === 0 ? 'Passing' : 'Failing'
  const typescriptStatus: 'Passing' | 'Failing' = tscResult.code === 0 ? 'Passing' : 'Failing'
  const checkedAt = new Date().toISOString()

  try {
    const validationPath = path.join(cwd, 'lib', 'dev', 'lastValidation.json')
    fs.writeFileSync(
      validationPath,
      JSON.stringify({ typescript: typescriptStatus.toLowerCase(), build: buildStatus.toLowerCase(), checkedAt }, null, 2)
    )
  } catch {
    // best-effort persistence — the validation result is still returned even if the write fails
  }

  return {
    buildStatus,
    typescriptStatus,
    durationMs,
    checkedAt,
    buildOutput: (buildResult.stdout + buildResult.stderr).slice(-4000),
    typescriptOutput: (tscResult.stdout + tscResult.stderr).slice(-4000),
  }
}

/** Real `git log`, not fabricated rollback points — resolves to an empty array if git is unavailable. */
export function captureRecentCommits(cwd: string, limit = 5): Promise<RollbackPoint[]> {
  return new Promise(resolve => {
    execFile('git', ['log', `-${limit}`, '--pretty=format:%H|%s|%aI'], { cwd, timeout: 10_000 }, (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve([])
        return
      }
      const points = stdout
        .trim()
        .split('\n')
        .map(line => {
          const [hash, message, date] = line.split('|')
          return { hash: hash?.slice(0, 12) ?? '', message: message ?? '', date: date ?? '' }
        })
        .filter(p => p.hash)
      resolve(points)
    })
  })
}
