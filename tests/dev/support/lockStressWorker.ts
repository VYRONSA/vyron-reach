/**
 * A real, separate OS process used by tests/dev/locking/crossProcessLock.test.ts
 * to stress-test the actual production locking primitives
 * (lib/dev/fileLock.ts's withFileLock/atomicWriteFileSync) under genuine
 * multi-process concurrency — something a single Node process's event loop
 * cannot honestly simulate, since synchronous calls within one process can
 * never truly interleave with each other. Only fileLock.ts is invoked here
 * (not fileJsonStore.ts) because fileLock.ts has no further relative
 * imports of its own, which is what lets `node --experimental-strip-types`
 * load it directly with no bundler. Run as:
 *   node --experimental-strip-types lockStressWorker.ts <targetFile> <increments>
 */
import fs from 'node:fs'
import { withFileLock, atomicWriteFileSync } from '../../../lib/dev/fileLock.ts'

const [, , targetFile, incrementsArg] = process.argv
const increments = Number(incrementsArg)

function readCount(): number {
  try {
    const raw = fs.readFileSync(targetFile, 'utf-8')
    const parsed = JSON.parse(raw) as { count: number }
    return parsed.count
  } catch {
    return 0
  }
}

for (let i = 0; i < increments; i++) {
  withFileLock(targetFile, () => {
    const current = readCount()
    atomicWriteFileSync(targetFile, JSON.stringify({ count: current + 1 }))
  })
}
