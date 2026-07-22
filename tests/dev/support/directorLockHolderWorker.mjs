// A real, separate OS process used by
// tests/dev/locking/directorLockRealProcess.test.ts (PRA-P1-023) to prove
// directorLock.ts reclaims a lock left behind by a genuinely killed
// process — not just a synthetic dead-pid file (see directorLock.test.ts/
// recoveryBootstrap.test.ts, which only ever fabricate a dead pid by
// writing a lock file directly).
//
// Plain JavaScript, not TypeScript: directorLock.ts's own relative
// imports (../fileLock, ../runtime/processLiveness, ../vyronDevDataDir)
// are extensionless, which Node's native ESM loader cannot resolve even
// under --experimental-strip-types (that flag only strips types, it does
// not add bundler-style extension resolution) — unlike
// lockStressWorker.ts's target (fileLock.ts), which has no further
// relative imports of its own. Rather than fight the module loader, this
// worker recreates directorLock.ts's own lock file format exactly
// (lockDir = <dataDir>/director-locks, contents =
// {owner, pid, acquiredAt}, atomic creation via the same `wx` flag
// tryCreateExclusive uses) using only this real process's own genuine
// pid. What is actually under test is the PARENT process's call to the
// real, unmodified acquireLoopOwnership reclaiming this lock once this
// real pid is dead — not how the lock file was originally created.
//
// Run as: node directorLockHolderWorker.mjs <project>
import fs from 'node:fs'
import path from 'node:path'

const [, , project] = process.argv
const dataDir = process.env.VYRON_DEV_DATA_DIR
if (!dataDir) {
  console.error('VYRON_DEV_DATA_DIR is required.')
  process.exit(1)
}

const lockDir = path.join(dataDir, 'director-locks')
fs.mkdirSync(lockDir, { recursive: true })
const lockFile = path.join(lockDir, `${project}.lock`)
const payload = JSON.stringify({ owner: `worker-${process.pid}`, pid: process.pid, acquiredAt: new Date().toISOString() })

try {
  fs.writeFileSync(lockFile, payload, { flag: 'wx' })
} catch (err) {
  console.error(`Failed to acquire loop ownership — already held: ${err.message}`)
  process.exit(1)
}

console.log(`LOCK_ACQUIRED pid=${process.pid}`)

// Block forever (until the parent test kills this process) — deliberately never releases.
setInterval(() => {}, 60_000)
