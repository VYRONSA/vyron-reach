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
  // PRA-P1-003 — deliberately the very first thing this hook does, before
  // any bootstrap below reads or writes a single file: a static, zero-I/O
  // assertion that the Engineering Assessment Engine's own history store
  // and the Director's own assessment history store haven't drifted back
  // into sharing a filename (they used to, silently corrupting each
  // other's data). Fails loudly at startup instead of as silent data
  // corruption discovered much later.
  const { assertAssessmentStoreFilenamesAreDistinct } = await import('./lib/dev/assessmentStoreFilenames')
  assertAssessmentStoreFilenamesAreDistinct()
  // Production Validation 2.1 Milestone 2.1.1 — deliberately FIRST, not
  // last: every bootstrap below publishes real DashboardEvents as part
  // of its own startup work (a Recovery event, a Scheduler Activity
  // cycle, an Escalation cycle, ...), and every one of those is itself a
  // real engineering event the Metrics Service should count. Subscribing
  // after them would silently miss every startup-triggered event — the
  // Event Service is a live pub/sub, not a queue, so "subscribe late"
  // means "never see what already happened," not "catch up later."
  const { runMetricsBootstrap } = await import('./lib/dev/metrics/metricsBootstrap')
  await runMetricsBootstrap()
  // Production Validation 2.1 Milestone 2.1.2 — same reasoning as the
  // Metrics subscription immediately above: must subscribe before any
  // other bootstrap's own startup activity publishes events, or
  // Certification would silently miss them.
  const { runCertificationBootstrap } = await import('./lib/dev/certification/certificationBootstrap')
  await runCertificationBootstrap()
  const { runRecoveryBootstrap } = await import('./lib/dev/director/recoveryBootstrap')
  await runRecoveryBootstrap()
  // PRA-P1-015 — resumes any InitiationRequest a crash/timeout left stuck
  // in 'Provisioning', the same "run exactly once at startup" guarantee as
  // the Director recovery bootstrap immediately above, applied to Project
  // Initiation's own Provisioning step instead. Ordering relative to the
  // Director bootstrap doesn't matter (disjoint stores); placed right
  // after it to keep every recovery-class bootstrap grouped together.
  const { runInitiationRecoveryBootstrap } = await import('./lib/dev/initiation/initiationRecoveryBootstrap')
  await runInitiationRecoveryBootstrap()
  // PRA-P1-025 — fails out (never blindly retries) any ReleaseRequest a
  // crash left stuck in 'Releasing', the same "run exactly once at
  // startup" guarantee as the two recovery bootstraps immediately above.
  const { runReleaseRecoveryBootstrap } = await import('./lib/dev/director/releaseManagement/releaseRecoveryBootstrap')
  await runReleaseRecoveryBootstrap()
  // Version 2.0 Phase 4 Milestone 4.1 — resumes any notification
  // deliveries left Queued/Sending/Retrying by a process that crashed or
  // restarted, the same "run exactly once at startup" guarantee the
  // Director recovery bootstrap above already provides, applied to the
  // Notification Provider layer instead. Not a Director/Inbox/caller
  // change — this file is the Next.js app entry point, not the Director.
  const { runNotificationDeliveryBootstrap } = await import('./lib/dev/notifications/deliveryBootstrap')
  await runNotificationDeliveryBootstrap()
  // Version 2.0 Phase 4 Milestone 4.2 — deliberately last: by this point
  // every crashed Director loop this process will reclaim has already
  // been reclaimed by the Director recovery bootstrap above, so the
  // Scheduler's first cycle sees accurate DirectorRuntimeStatus for every
  // project instead of racing its own recovery against the Director's.
  const { runSchedulerBootstrap } = await import('./lib/dev/scheduler/schedulerBootstrap')
  await runSchedulerBootstrap()
  // Version 2.0 Phase 4 Milestone 4.3 — deliberately last: by this point
  // every inbox item this process will ever observe already reflects its
  // true current status (Director recovery and the Scheduler have both
  // already settled), so the Escalation Service's first cycle never races
  // a still-in-flight recovery to decide whether an item is genuinely
  // still Open.
  const { runEscalationBootstrap } = await import('./lib/dev/escalation/escalationBootstrap')
  await runEscalationBootstrap()
  // Autonomous Operations — deliberately after Escalation: Operations
  // creates Inbox items of its own, so it should only start once
  // Escalation's own view of "what's genuinely still Open" has already
  // settled, the same ordering reasoning already used for
  // Escalation-after-Scheduler above.
  const { runOperationsMonitoringBootstrap } = await import('./lib/dev/director/operations/operationsMonitoringBootstrap')
  await runOperationsMonitoringBootstrap()
  // Version 2.0 Phase 5 Milestone 5.2 — "Implement automatic archival."
  // Ordering doesn't matter relative to the bootstraps above (retention
  // only ever touches terminal/closed records, never anything a recovery
  // pass would still be acting on), so this is simply last.
  const { runRetentionBootstrap } = await import('./lib/dev/archive/retentionBootstrap')
  await runRetentionBootstrap()
}
