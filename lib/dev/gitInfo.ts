import fs from 'fs'
import path from 'path'

const UNAVAILABLE = 'Unavailable'

export type GitInfo = {
  branch: string
  commit: string
  fullCommit: string
  commitDate: string
}

export function getGitDir(): string | null {
  const gitDir = path.join(/*turbopackIgnore: true*/ process.cwd(), '.git')
  return fs.existsSync(gitDir) ? gitDir : null
}

/**
 * Resolves a ref (e.g. "refs/heads/main") to a commit SHA — loose ref file
 * first, packed-refs fallback. Shared by local and remote-tracking branch
 * lookups so the loose/packed resolution logic lives in exactly one place.
 */
export function resolveRef(gitDir: string, refName: string): string | null {
  try {
    const refPath = path.join(gitDir, refName)
    if (fs.existsSync(refPath)) {
      return fs.readFileSync(refPath, 'utf8').trim()
    }
    const packedPath = path.join(gitDir, 'packed-refs')
    if (fs.existsSync(packedPath)) {
      const line = fs
        .readFileSync(packedPath, 'utf8')
        .split('\n')
        .find(l => l.endsWith(' ' + refName))
      if (line) return line.split(' ')[0]
    }
    return null
  } catch {
    return null
  }
}

/**
 * Reads branch/commit info directly from the .git directory (loose refs
 * only, with a packed-refs fallback). No child_process, no shelling out.
 * Any failure degrades to "Unavailable" per spec.
 */
export function getGitInfo(): GitInfo {
  try {
    const gitDir = getGitDir()
    if (!gitDir) return { branch: UNAVAILABLE, commit: UNAVAILABLE, fullCommit: UNAVAILABLE, commitDate: UNAVAILABLE }

    const headPath = path.join(gitDir, 'HEAD')
    if (!fs.existsSync(headPath)) {
      return { branch: UNAVAILABLE, commit: UNAVAILABLE, fullCommit: UNAVAILABLE, commitDate: UNAVAILABLE }
    }
    const head = fs.readFileSync(headPath, 'utf8').trim()

    let branch = UNAVAILABLE
    let refName: string | null = null
    if (head.startsWith('ref:')) {
      refName = head.slice(4).trim()
      branch = refName.replace(/^refs\/heads\//, '')
    } else if (/^[0-9a-f]{40}$/i.test(head)) {
      branch = 'detached HEAD'
    }

    let commitSha: string | null = null
    let refMtime: Date | null = null

    if (refName) {
      commitSha = resolveRef(gitDir, refName)
      const refPath = path.join(gitDir, refName)
      if (fs.existsSync(refPath)) refMtime = fs.statSync(refPath).mtime
    } else if (/^[0-9a-f]{40}$/i.test(head)) {
      commitSha = head
      refMtime = fs.statSync(headPath).mtime
    }

    return {
      branch,
      commit: commitSha ? commitSha.slice(0, 7) : UNAVAILABLE,
      fullCommit: commitSha ?? UNAVAILABLE,
      commitDate: refMtime ? refMtime.toISOString() : UNAVAILABLE,
    }
  } catch {
    return { branch: UNAVAILABLE, commit: UNAVAILABLE, fullCommit: UNAVAILABLE, commitDate: UNAVAILABLE }
  }
}
