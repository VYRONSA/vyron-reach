import fs from 'fs'
import path from 'path'

const UNAVAILABLE = 'Unavailable'

export type GitInfo = {
  branch: string
  commit: string
  commitDate: string
}

function readGitDir() {
  const gitDir = path.join(/*turbopackIgnore: true*/ process.cwd(), '.git')
  return fs.existsSync(gitDir) ? gitDir : null
}

/**
 * Reads branch/commit info directly from the .git directory (loose refs
 * only, with a packed-refs fallback). No child_process, no shelling out.
 * Any failure degrades to "Unavailable" per spec.
 */
export function getGitInfo(): GitInfo {
  try {
    const gitDir = readGitDir()
    if (!gitDir) return { branch: UNAVAILABLE, commit: UNAVAILABLE, commitDate: UNAVAILABLE }

    const headPath = path.join(gitDir, 'HEAD')
    if (!fs.existsSync(headPath)) {
      return { branch: UNAVAILABLE, commit: UNAVAILABLE, commitDate: UNAVAILABLE }
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
      const refPath = path.join(gitDir, refName)
      if (fs.existsSync(refPath)) {
        commitSha = fs.readFileSync(refPath, 'utf8').trim()
        refMtime = fs.statSync(refPath).mtime
      } else {
        const packedPath = path.join(gitDir, 'packed-refs')
        if (fs.existsSync(packedPath)) {
          const line = fs
            .readFileSync(packedPath, 'utf8')
            .split('\n')
            .find(l => l.endsWith(' ' + refName))
          if (line) commitSha = line.split(' ')[0]
        }
      }
    } else if (/^[0-9a-f]{40}$/i.test(head)) {
      commitSha = head
      refMtime = fs.statSync(headPath).mtime
    }

    return {
      branch,
      commit: commitSha ? commitSha.slice(0, 7) : UNAVAILABLE,
      commitDate: refMtime ? refMtime.toISOString() : UNAVAILABLE,
    }
  } catch {
    return { branch: UNAVAILABLE, commit: UNAVAILABLE, commitDate: UNAVAILABLE }
  }
}

export function getWorkingTreeStatus(): 'Clean' | 'Modified' | typeof UNAVAILABLE {
  // Working-tree cleanliness requires enumerating tracked-file hashes, which
  // isn't safely doable without git itself. Rather than guess, report Unavailable.
  return UNAVAILABLE
}
