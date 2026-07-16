import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { getGitDir, getGitInfo, resolveRef } from './gitInfo'

const UNAVAILABLE = 'Unavailable'

export type GitWorkingTreeStatus = 'Clean' | 'Modified' | 'Unknown'

export type GitIntelligence = {
  repositoryAvailable: boolean
  branch: string
  commitHash: string
  commitMessage: string
  commitDate: string
  filesChanged: number | null
  filesAdded: number | null
  filesDeleted: number | null
  filesModified: number | null
  aheadBehind: { ahead: number; behind: number } | null
  workingTreeStatus: GitWorkingTreeStatus
}

type IndexEntry = { size: number; path: string }

/**
 * Parses .git/index (format version 2/3) directly from disk — no git
 * binary, no child_process. Bails to null on anything unexpected (bad
 * signature, unsupported version, a read past the buffer) rather than
 * guessing; a wrong "clean" reading is worse than an honest "Unknown" one.
 */
function parseGitIndex(gitDir: string): IndexEntry[] | null {
  try {
    const indexPath = path.join(gitDir, 'index')
    if (!fs.existsSync(indexPath)) return null
    const buf = fs.readFileSync(indexPath)
    if (buf.length < 12 || buf.toString('ascii', 0, 4) !== 'DIRC') return null
    const version = buf.readUInt32BE(4)
    if (version !== 2 && version !== 3) return null
    const entryCount = buf.readUInt32BE(8)

    const entries: IndexEntry[] = []
    let offset = 12
    for (let i = 0; i < entryCount; i++) {
      const entryStart = offset
      if (offset + 62 > buf.length) return null
      const size = buf.readUInt32BE(offset + 36)
      const flags = buf.readUInt16BE(offset + 60)
      const extended = (flags & 0x4000) !== 0
      let nameOffset = offset + 62
      if (extended) {
        if (version < 3) return null
        nameOffset += 2
      }
      const nameLenFlag = flags & 0x0fff
      let nameEnd: number
      if (nameLenFlag < 0xfff) {
        nameEnd = nameOffset + nameLenFlag
        if (nameEnd > buf.length) return null
      } else {
        nameEnd = buf.indexOf(0, nameOffset)
        if (nameEnd === -1) return null
      }
      const name = buf.toString('utf8', nameOffset, nameEnd)
      const entryLen = nameEnd - entryStart + 1
      const padded = Math.ceil(entryLen / 8) * 8
      offset = entryStart + padded
      entries.push({ size, path: name })
    }
    return entries
  } catch {
    return null
  }
}

/**
 * Compares the index against the working tree by file size only — not
 * mtime, since filesystem timestamp precision/granularity is unreliable
 * across platforms and a false "modified" is worse than occasionally
 * missing a same-size content edit. Only reports on already-tracked
 * files; untracked (new) files aren't enumerated here, since that needs
 * .gitignore-aware directory walking and a wrong count (e.g. surfacing
 * node_modules) would be actively misleading — see filesAdded below.
 */
function diffIndexAgainstWorkingTree(repoRoot: string, entries: IndexEntry[]): { modified: number; deleted: number } {
  let modified = 0
  let deleted = 0
  for (const entry of entries) {
    try {
      const stat = fs.statSync(path.join(repoRoot, entry.path))
      if (stat.size !== entry.size) modified += 1
    } catch {
      deleted += 1
    }
  }
  return { modified, deleted }
}

/**
 * Reads a commit's subject line by inflating its loose object file
 * (zlib is a Node core module — still no shelling out). Only loose
 * objects are readable this way; once a commit is packed (via git gc)
 * reading it would require a packfile/delta parser, which this
 * intentionally does not implement — it degrades to Unavailable instead.
 */
function readCommitMessage(gitDir: string, fullSha: string): string {
  try {
    if (!fullSha || fullSha === UNAVAILABLE || !/^[0-9a-f]{40}$/i.test(fullSha)) return UNAVAILABLE
    const objectPath = path.join(gitDir, 'objects', fullSha.slice(0, 2), fullSha.slice(2))
    if (!fs.existsSync(objectPath)) return UNAVAILABLE
    const inflated = zlib.inflateSync(fs.readFileSync(objectPath)).toString('utf8')
    const headerEnd = inflated.indexOf('\0')
    if (headerEnd === -1) return UNAVAILABLE
    const body = inflated.slice(headerEnd + 1)
    const messageStart = body.indexOf('\n\n')
    if (messageStart === -1) return UNAVAILABLE
    const subject = body.slice(messageStart + 2).split('\n')[0].trim()
    return subject || UNAVAILABLE
  } catch {
    return UNAVAILABLE
  }
}

/**
 * Ahead/behind requires walking commit history, which (like the commit
 * message above) isn't safely doable without a packfile parser once
 * history is packed. Only the trivial, always-safe case is resolved:
 * local HEAD and the cached remote-tracking ref point at the same
 * commit. No network operations are performed — this is a local
 * comparison against whatever origin/<branch> was set to as of the
 * last fetch, never a live fetch.
 */
function computeAheadBehind(gitDir: string, branch: string, localFullSha: string): { ahead: number; behind: number } | null {
  if (branch === UNAVAILABLE || localFullSha === UNAVAILABLE) return null
  const remoteSha = resolveRef(gitDir, `refs/remotes/origin/${branch}`)
  if (!remoteSha) return null
  if (remoteSha === localFullSha) return { ahead: 0, behind: 0 }
  return null
}

/**
 * The Git Intelligence Engine — pure, deterministic, stateless, and
 * read-only. Reads directly from the local .git directory (refs, the
 * index, loose objects) via fs/zlib only; never shells out, never
 * modifies Git state, never commits, checks out, or pushes. Any value
 * that can't be safely determined this way degrades to "Unavailable" /
 * null / "Unknown" rather than being guessed.
 *
 * Server-only (touches fs) — call from a Server Component and pass the
 * result down as a plain prop, same as systemInfo.ts's buildStatus/
 * typescriptStatus. Future batches (commit recommendations, etc.) should
 * consume this engine's output rather than reading .git themselves.
 */
export function getGitIntelligence(): GitIntelligence {
  const gitDir = getGitDir()

  if (!gitDir) {
    return {
      repositoryAvailable: false,
      branch: UNAVAILABLE,
      commitHash: UNAVAILABLE,
      commitMessage: UNAVAILABLE,
      commitDate: UNAVAILABLE,
      filesChanged: null,
      filesAdded: null,
      filesDeleted: null,
      filesModified: null,
      aheadBehind: null,
      workingTreeStatus: 'Unknown',
    }
  }

  const info = getGitInfo()
  const commitMessage = readCommitMessage(gitDir, info.fullCommit)
  const entries = parseGitIndex(gitDir)
  const repoRoot = path.dirname(gitDir)
  const diff = entries ? diffIndexAgainstWorkingTree(repoRoot, entries) : null

  const filesModified = diff?.modified ?? null
  const filesDeleted = diff?.deleted ?? null
  const filesChanged = diff ? diff.modified + diff.deleted : null
  const workingTreeStatus: GitWorkingTreeStatus = diff === null ? 'Unknown' : filesChanged === 0 ? 'Clean' : 'Modified'

  return {
    repositoryAvailable: true,
    branch: info.branch,
    commitHash: info.commit,
    commitMessage,
    commitDate: info.commitDate,
    filesChanged,
    filesAdded: null,
    filesDeleted,
    filesModified,
    aheadBehind: computeAheadBehind(gitDir, info.branch, info.fullCommit),
    workingTreeStatus,
  }
}
