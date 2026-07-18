/**
 * Tests whether a process id is still alive, without sending it a real
 * signal — `process.kill(pid, 0)` is Node's documented cross-platform way
 * to do this (including Windows): it throws ESRCH if the pid doesn't
 * exist, EPERM if it exists but this process lacks permission to signal
 * it (still means "alive"), and succeeds silently otherwise. This is the
 * one mechanism the Execution Engine has for detecting a job whose
 * in-memory process handle was lost to a server restart/crash.
 */
export function isProcessAlive(pid: number | null): boolean {
  if (pid === null) return false
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === 'EPERM'
  }
}
