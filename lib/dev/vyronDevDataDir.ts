import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * Resolves the .vyron-dev data directory every store in VYRON DEV
 * persists to. Two override mechanisms, checked in order:
 *
 *  1. An active simulation context (see runWithIsolatedDataDir below) —
 *     Production Validation 2.1 Milestone 2.1.3's Simulation Service
 *     runs real, unmodified service functions against a throwaway
 *     directory. AsyncLocalStorage scopes this per async call chain, not
 *     process-globally: a concurrent request outside a simulation's
 *     `run()` callback never observes the override, even interleaved on
 *     the same event loop — this is what makes it safe to run a
 *     simulation in the same live process that's also serving real
 *     dashboard traffic against the real directory. A process-global
 *     mutable variable (the naive alternative) could not make that
 *     guarantee.
 *  2. process.env.VYRON_DEV_DATA_DIR — read fresh on every call (never
 *     cached), so the automated test suite (tests/dev/**, see
 *     tests/dev/support/testHarness.ts) can redirect every store to an
 *     isolated temporary directory per test.
 *
 * Unset/inactive in every real deployment absent an active simulation —
 * falls back to the exact same path Version 1.0 always used, so this
 * remains a pure testability/simulation seam with zero behavior change
 * for ordinary production request handling.
 */
const simulationDataDir = new AsyncLocalStorage<string>()

export function getVyronDevDataDir(): string {
  const override = simulationDataDir.getStore()
  if (override) return override
  return process.env.VYRON_DEV_DATA_DIR || path.join(process.cwd(), '.vyron-dev')
}

/**
 * Runs `fn` with every store in this app (and everything else that goes
 * through getVyronDevDataDir, which is all of them) scoped to `dataDir`
 * instead of the real data directory — for the duration of `fn`'s full
 * async chain, including timers/callbacks it schedules, per
 * AsyncLocalStorage's documented propagation guarantee. Nested calls are
 * supported (the innermost `dataDir` wins for its own scope, exactly the
 * ordinary AsyncLocalStorage.run() nesting behavior) but Milestone
 * 2.1.3's Simulation Service never nests these itself.
 */
export function runWithIsolatedDataDir<T>(dataDir: string, fn: () => T): T {
  return simulationDataDir.run(dataDir, fn)
}
