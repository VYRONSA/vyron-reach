import { execFile } from 'node:child_process'

/**
 * `git diff --stat` scoped to a given working directory. Server-only.
 * Never fabricated — resolves to null if git isn't available or the
 * command fails for any reason, rather than guessing. Shared by the
 * Execution Runtime (captured after each Claude run) and Git Intelligence
 * findings (captured on demand) so the same subprocess call isn't
 * duplicated in two places.
 */
export function captureGitDiffSummary(cwd: string): Promise<string | null> {
  return new Promise(resolve => {
    execFile('git', ['diff', '--stat'], { cwd, timeout: 10_000 }, (err, stdout) => {
      if (err) {
        resolve(null)
        return
      }
      const trimmed = stdout.trim()
      resolve(trimmed || null)
    })
  })
}

/**
 * `git diff --name-only` — the real, ground-truth list of files this
 * batch actually changed (uncommitted working-tree changes vs HEAD),
 * for anything that needs to decide what to do based on which files
 * changed (see lib/dev/director/qualityAssurance/qualityAssuranceService.ts's
 * determineApplicability) rather than trusting the AI worker's own
 * self-reported file list, which is prose it chose to write, not a
 * verified fact. Resolves to an empty array if git is unavailable or
 * the command fails, never fabricated.
 */
export function captureChangedFilePaths(cwd: string): Promise<string[]> {
  return new Promise(resolve => {
    execFile('git', ['diff', '--name-only'], { cwd, timeout: 10_000 }, (err, stdout) => {
      if (err) {
        resolve([])
        return
      }
      resolve(stdout.trim() ? stdout.trim().split('\n').map(l => l.trim()).filter(Boolean) : [])
    })
  })
}
