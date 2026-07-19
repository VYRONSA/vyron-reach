/**
 * Next.js calls `register()` exactly once when a new server instance is
 * initiated, and waits for it to complete before serving any request —
 * the one hook in this app that is genuinely independent of API route
 * order, the first user request, browser activity, dashboard opening, or
 * any lifecycle endpoint being called. That guarantee is exactly what the
 * Engineering Director's crash recovery needs: previously,
 * recoverActiveDirectorsOnStartup() only ran as a side effect of
 * importing lib/dev/director/serverExecutionLoop.ts, which only happened
 * when one of five specific lifecycle routes (handoff/pause/resume/
 * cancel/inbox-resolve) was hit — a restarted server that only ever
 * received read-only monitoring traffic would never recover an
 * interrupted project automatically.
 *
 * Only runs in the Node.js runtime (never Edge): the whole recovery path
 * depends on `fs`/`child_process`, which Edge doesn't support.
 *
 * The actual "run once, acquire a lock, record completion, release the
 * lock" bootstrap logic lives in recoveryBootstrap.ts, not here — this
 * file is only Next.js's required entry point into it.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { runRecoveryBootstrap } = await import('./lib/dev/director/recoveryBootstrap')
  await runRecoveryBootstrap()
}
