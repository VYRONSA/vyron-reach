import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

/**
 * Test isolation for the VYRON DEV Core Engine suite. Every store under
 * lib/dev/ resolves its data directory through getVyronDevDataDir()
 * (lib/dev/vyronDevDataDir.ts), which reads process.env.VYRON_DEV_DATA_DIR
 * fresh on every call — this harness points that at a brand-new temp
 * directory before each test and removes it after, so no test can ever
 * read or write the real .vyron-dev/ at the repo root.
 */

const REAL_DATA_DIR_MARKER = path.join(process.cwd(), '.vyron-dev')

export type IsolatedDataDir = {
  dir: string
  cleanup: () => void
}

/** Call at the top of a test/beforeEach — returns the temp dir and a cleanup function, and points VYRON_DEV_DATA_DIR at it for the duration. */
export function useIsolatedDataDir(): IsolatedDataDir {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vyron-dev-test-'))
  process.env.VYRON_DEV_DATA_DIR = dir

  // Belt-and-braces: fail loudly rather than silently touching real data if
  // something computed the wrong path.
  if (path.resolve(dir) === path.resolve(REAL_DATA_DIR_MARKER)) {
    throw new Error('Test isolation failure: VYRON_DEV_DATA_DIR resolved to the real .vyron-dev directory')
  }

  return {
    dir,
    cleanup: () => {
      delete process.env.VYRON_DEV_DATA_DIR
      fs.rmSync(dir, { recursive: true, force: true })
    },
  }
}

/** A fresh project slug per test/call, so parallel tests in the same file never collide on the same partition key even when they share one isolated dir. */
export function uniqueSlug(prefix = 'proj'): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`
}

export type WaitForOptions = { timeoutMs?: number; intervalMs?: number; message?: string }

/** Polls `predicate` until it returns true, or throws after timeoutMs — the one allowed form of "waiting" for the fire-and-forget async paths (startServerDirector/pauseServerDirector/resumeServerDirector all return void and finish their work on later microtasks/ticks). Not a timing hack in the forbidden sense: it never asserts a specific duration, only an eventual condition, bounded by a generous ceiling so a genuine bug fails fast instead of hanging. */
export async function waitFor(predicate: () => boolean, options: WaitForOptions = {}): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 2000
  const intervalMs = options.intervalMs ?? 10
  const deadline = Date.now() + timeoutMs
  for (;;) {
    if (predicate()) return
    if (Date.now() > deadline) throw new Error(options.message ?? `waitFor: condition not met within ${timeoutMs}ms`)
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }
}
