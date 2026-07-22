import path from 'node:path'
import { spawn, type ChildProcess } from 'node:child_process'
import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, waitFor, type IsolatedDataDir } from '../support/testHarness'
import { acquireLoopOwnership, releaseLoopOwnership } from '../../../lib/dev/director/directorLock'
import { isProcessAlive } from '../../../lib/dev/runtime/processLiveness'

/**
 * PRA-P1-023 remediation — the audit's own gap: existing tests proved the
 * lock primitive's correctness under real multi-process load
 * (crossProcessLock.test.ts) and proved the stale-lock reclaim decision
 * logic against a synthetic dead pid (directorLock.test.ts,
 * recoveryBootstrap.test.ts) — but nothing had ever actually spawned a
 * real OS process, had it acquire directorLock.ts's real loop-ownership
 * lock, killed that real process, and then verified a second call
 * reclaims it. This is that test.
 */

const WORKER = path.join(__dirname, '..', 'support', 'directorLockHolderWorker.mjs')

let isolated: IsolatedDataDir
let child: ChildProcess | null = null

beforeEach(() => {
  isolated = useIsolatedDataDir()
  child = null
})

afterEach(() => {
  if (child && !child.killed) child.kill('SIGKILL')
  isolated.cleanup()
})

function spawnLockHolder(project: string): Promise<{ child: ChildProcess; pid: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [WORKER, project], {
      env: { ...process.env, VYRON_DEV_DATA_DIR: isolated.dir },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let settled = false
    proc.stdout.on('data', chunk => {
      stdout += chunk.toString()
      const match = stdout.match(/LOCK_ACQUIRED pid=(\d+)/)
      if (match && !settled) {
        settled = true
        resolve({ child: proc, pid: Number(match[1]) })
      }
    })
    proc.stderr.on('data', chunk => { stderr += chunk.toString() })
    proc.on('exit', code => {
      if (!settled) reject(new Error(`worker exited before acquiring the lock (code ${code}): ${stderr}`))
    })
    proc.on('error', reject)
  })
}

describe('Director loop ownership — stale-lock reclaim from a genuinely killed process (PRA-P1-023)', () => {
  it('refuses acquisition while the real holding process is alive, then reclaims once that real process is killed', async () => {
    const project = uniqueSlug()

    const { child: holder, pid } = await spawnLockHolder(project)
    child = holder

    // While the real child is alive, this process must be refused — the
    // exact "a live holder already owns this project's loop" path.
    expect(isProcessAlive(pid)).toBe(true)
    expect(acquireLoopOwnership(project)).toBeNull()

    // Kill the real process holding the lock — not a synthetic dead-pid
    // file, an actual process torn down by the OS.
    holder.kill('SIGKILL')
    await waitFor(() => !isProcessAlive(pid), { message: 'the killed worker process was never reaped' })

    // The lock file is still on disk (the killed process never released
    // it) — this call must detect the recorded pid is genuinely dead and
    // reclaim it, the one thing no existing test had proven end-to-end.
    const reclaimed = acquireLoopOwnership(project)
    expect(reclaimed).not.toBeNull()

    releaseLoopOwnership(project, reclaimed!)
  }, 15000)

  it('a second real reclaim attempt after the first succeeds only gets refused (only one reclaimer can win)', async () => {
    const project = uniqueSlug()
    const { child: holder, pid } = await spawnLockHolder(project)
    child = holder

    holder.kill('SIGKILL')
    await waitFor(() => !isProcessAlive(pid))

    const first = acquireLoopOwnership(project)
    expect(first).not.toBeNull()
    const second = acquireLoopOwnership(project)
    expect(second).toBeNull()

    releaseLoopOwnership(project, first!)
  }, 15000)
})
