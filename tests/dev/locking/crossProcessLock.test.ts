import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, type IsolatedDataDir } from '../support/testHarness'

/**
 * Real multi-process concurrency stress test for lib/dev/fileLock.ts —
 * the primitive every lock in the app (directorLock.ts's loop ownership,
 * fileJsonStore.ts's updateJsonStore) is built from. This spawns genuine
 * separate OS processes (not just concurrent async calls within one Node
 * event loop, which can never truly interleave with each other) all
 * hammering the same counter file through the real, unmodified
 * withFileLock/atomicWriteFileSync exports. See lockStressWorker.ts.
 */

const WORKER = path.join(__dirname, '..', 'support', 'lockStressWorker.ts')

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function runWorker(targetFile: string, increments: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--no-warnings', '--experimental-strip-types', WORKER, targetFile, String(increments)], {
      stdio: ['ignore', 'ignore', 'pipe'],
    })
    let stderr = ''
    child.stderr.on('data', chunk => { stderr += chunk.toString() })
    child.on('exit', code => {
      if (code === 0) resolve()
      else reject(new Error(`worker exited with code ${code}: ${stderr}`))
    })
    child.on('error', reject)
  })
}

describe('Locking — concurrent writes across real OS processes', () => {
  it('loses zero increments across many concurrent processes hammering the same file', async () => {
    const target = path.join(isolated.dir, 'stress-counter.json')
    const processCount = 5
    const incrementsPerProcess = 15

    await Promise.all(Array.from({ length: processCount }, () => runWorker(target, incrementsPerProcess)))

    const final = JSON.parse(fs.readFileSync(target, 'utf-8')) as { count: number }
    expect(final.count).toBe(processCount * incrementsPerProcess)
  }, 30000)

  it('never leaves the target file corrupted or partially written under concurrent access', async () => {
    const target = path.join(isolated.dir, 'stress-integrity.json')
    await Promise.all(Array.from({ length: 4 }, () => runWorker(target, 10)))

    // The file must parse as valid JSON with the exact shape every writer produces.
    const raw = fs.readFileSync(target, 'utf-8')
    expect(() => JSON.parse(raw)).not.toThrow()
    const parsed = JSON.parse(raw) as { count: number }
    expect(typeof parsed.count).toBe('number')
    expect(parsed.count).toBe(40)

    // No orphaned lock or temp files left behind once every process exits.
    const leftovers = fs.readdirSync(isolated.dir).filter(f => f.includes('.lock') || f.includes('.tmp-'))
    expect(leftovers).toEqual([])
  }, 30000)
})

describe('Locking — concurrent reads during writes', () => {
  it('a reader racing a writer only ever observes a fully-formed value, never a torn write', async () => {
    const target = path.join(isolated.dir, 'read-race.json')
    fs.writeFileSync(target, JSON.stringify({ count: 0 }))

    const writer = runWorker(target, 30)
    const readSamples: number[] = []
    const stopReadingAt = Date.now() + 200
    while (Date.now() < stopReadingAt) {
      try {
        const parsed = JSON.parse(fs.readFileSync(target, 'utf-8')) as { count: number }
        readSamples.push(parsed.count)
      } catch {
        // A read landing exactly between unlink-old/rename-new is not possible
        // with write-then-rename, so any parse failure here is a real bug.
        readSamples.push(NaN)
      }
    }
    await writer

    expect(readSamples.every(n => !Number.isNaN(n))).toBe(true)
  }, 30000)
})
