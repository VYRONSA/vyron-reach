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
