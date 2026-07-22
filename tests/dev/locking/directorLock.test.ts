import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { acquireLoopOwnership, releaseLoopOwnership } from '../../../lib/dev/director/directorLock'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

describe('Locking — Director loop ownership (exactly one Director loop per project)', () => {
  it('grants ownership to the first caller and refuses every concurrent caller until release', () => {
    const project = uniqueSlug()
    const attempts = 10
    const results = Array.from({ length: attempts }, () => acquireLoopOwnership(project))
    const winners = results.filter((r): r is string => r !== null)
    expect(winners).toHaveLength(1)
    expect(results.filter(r => r === null)).toHaveLength(attempts - 1)
  })

  it('allows re-acquisition only after the legitimate owner releases', () => {
    const project = uniqueSlug()
    const owner = acquireLoopOwnership(project)
    expect(owner).not.toBeNull()
    expect(acquireLoopOwnership(project)).toBeNull()

    releaseLoopOwnership(project, owner!)
    const nextOwner = acquireLoopOwnership(project)
    expect(nextOwner).not.toBeNull()
    expect(nextOwner).not.toBe(owner)
  })

  it('refuses to release when the caller is not the recorded owner (a stale/superseded holder can never clobber a newer lock)', () => {
    const project = uniqueSlug()
    const owner = acquireLoopOwnership(project)
    expect(owner).not.toBeNull()

    releaseLoopOwnership(project, 'not-the-real-owner-token')
    // The lock must still be held — a second acquire attempt must still fail.
    expect(acquireLoopOwnership(project)).toBeNull()

    releaseLoopOwnership(project, owner!)
    expect(acquireLoopOwnership(project)).not.toBeNull()
  })

  it('keeps different projects fully independent — one project holding its lock never blocks another', () => {
    const projectA = uniqueSlug('a')
    const projectB = uniqueSlug('b')
    const ownerA = acquireLoopOwnership(projectA)
    const ownerB = acquireLoopOwnership(projectB)
    expect(ownerA).not.toBeNull()
    expect(ownerB).not.toBeNull()
    expect(ownerA).not.toBe(ownerB)
  })

  it('reclaims a stale lock left by a process that is no longer alive', () => {
    const project = uniqueSlug()
    const lockFile = path.join(isolated.dir, 'director-locks', `${project}.lock`)
    fs.mkdirSync(path.dirname(lockFile), { recursive: true })
    // A pid essentially guaranteed not to be a live process on this machine.
    const deadPid = 999_999_999
    fs.writeFileSync(lockFile, JSON.stringify({ owner: 'ghost', pid: deadPid, acquiredAt: new Date().toISOString() }), 'utf-8')

    const owner = acquireLoopOwnership(project)
    expect(owner).not.toBeNull()
    expect(owner).not.toBe('ghost')
  })

  it('does NOT reclaim a lock held by a still-alive process', () => {
    const project = uniqueSlug()
    const lockFile = path.join(isolated.dir, 'director-locks', `${project}.lock`)
    fs.mkdirSync(path.dirname(lockFile), { recursive: true })
    // This test process's own pid is unquestionably alive.
    fs.writeFileSync(lockFile, JSON.stringify({ owner: 'still-alive', pid: process.pid, acquiredAt: new Date().toISOString() }), 'utf-8')

    expect(acquireLoopOwnership(project)).toBeNull()
  })
})
