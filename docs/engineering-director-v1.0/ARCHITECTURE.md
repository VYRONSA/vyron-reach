# Engineering Director v1.0 — Architecture

## Engineering Director

The Director is the server-side orchestration loop (`lib/dev/director/serverExecutionLoop.ts`) that owns execution end-to-end once a CEO presses **Start Development**. It is not a new execution engine — it wraps the pre-existing single-batch pipeline (context building, Claude Code invocation, validation) that already existed for browser-attended execution, and adds exactly what autonomy requires: selecting the next batch, checking dependencies before starting, deciding whether a completed batch needs CEO attention, and either auto-approving and continuing or pausing with an Engineering Inbox item and a notification.

It is deliberately **not** the strategic layer (`lib/dev/director/engineeringDirector.ts`, which ranks findings and resolves agent conflicts) — that module is consumed as one input, not replaced.

## Execution Lifecycle

```
CEO presses Start Development
        ↓
Select next executable batch      (session.currentBatch, already Active-status-authoritative)
        ↓
Validate dependencies              (frozen technical-debt/risk snapshot from hand-off)
        ↓
Build engineering context          (serverContextBuilder.ts — git, build/TS status, runtime history)
        ↓
Launch Claude                      (runtimeEngine.createDevelopmentJob → claudeCodeProvider.ts)
        ↓
Validate implementation             (real npm run build + npx tsc --noEmit)
        ↓
Update knowledge                    (snapshot completions array)
        ↓
Update planning / progress          (serverPlanningState.ts — batch/milestone/phase completion)
        ↓
Determine if CEO intervention required
        ↓
   NO  → auto-continue to next batch
   YES → Engineering Inbox item + notification + pause (Waiting for CEO / Blocked)
        ↓
Project completes (all batches Complete)
```

## Runtime State Machine

**Project execution state** (`DirectorRuntimeStatus.state`):

```
Idle → Planning → Running ⇄ (Waiting for CEO | Blocked) → Completed
                     ↓
                 Cancelled (from any active state)
```

- `Blocked` is used for pre-flight blockers (a batch can't even start — Critical technical debt/risk).
- `Waiting for CEO` is used for post-execution interventions (build failure, non-Completed job status, approval-required conditions).
- Pause and Cancel take effect only at the boundary between batches — an in-flight Claude run is never interrupted destructively.

**Job status** (`DevelopmentJob.status`, `lib/dev/runtime/executionStateMachine.ts`):

```
Queued → Running → Validating → Completed → (Updating → Completed | Rejected)
            ↓            ↓
         Failed       Failed
            ↓
        Cancelled (from Queued/Running)
```

`Completed`, `Failed`, `Cancelled`, and `Rejected` are terminal — they have no legal outgoing transition. This is enforced atomically inside `runtimeStorage.ts`'s `updateJob`, not just checked by callers: once a job reaches a terminal status, no later write (background reconciliation, a stale patch, anything) can move it away from that value again.

## Recovery Bootstrap

`lib/dev/director/recoveryBootstrap.ts`, invoked from `instrumentation.ts`'s `register()` — the one Next.js hook guaranteed to run exactly once per server process, before any request is served, independent of route order or request/browser activity.

Responsibilities: acquire a durable bootstrap lock (filesystem-anchored, stale-owner reclaim via pid-liveness) → call `recoverActiveDirectorsOnStartup()` unchanged → record successful completion (`recovery-bootstrap.json`, observability only, never consulted to decide whether to run again) → release the lock. An in-memory singleton promise additionally guarantees the bootstrap body only ever runs once within a given process, however many times something calls it.

`recoverActiveDirectorsOnStartup()` itself iterates every project in `Running`/`Planning` state and unconditionally attempts to re-enter that project's loop — the loop-ownership lock (see **Locking Strategy**) is what deterministically decides whether that's a no-op (a live process still owns it) or a genuine recovery (the recorded owner is dead, so the lock is reclaimed and the batch is retried).

## Notification Architecture

`lib/dev/notifications/`. The Director raises events only (`raiseNotification()`); it never knows or cares which providers are enabled or how delivery happens.

- `NotificationProvider` — a two-member interface (`enabled`, `send(event)`).
- `InAppNotificationProvider` — real, always enabled, persists to a file-backed store the dashboard reads directly.
- `EmailNotificationProvider` / `WhatsAppNotificationProvider` — registered, `enabled: false` placeholders. The event architecture and provider contract are already correct; wiring a real channel later means filling in `send()` and flipping the flag, nothing else changes.
- Event types: `CEO Approval Required`, `Project Blocked`, `Business Rule Required`, `Security Approval Required`, `Development Completed`/`Project Completed`, `Milestone Completed`, `Phase Completed`, `Engineering Resumed`, `Engineering Paused`.

## Engineering Inbox

`lib/dev/director/engineeringInboxStore.ts`. Every required CEO interruption becomes exactly one `EngineeringInboxItem`: project, batch, `reasonType` (one of `Approval Required` / `Business Decision Required` / `Build Failure` / `Security Review` / `Deployment Approval` / `Technical Debt Escalation`), severity, reason, recommended action, timestamp, status (`Open`/`Resolved`/`Dismissed`), and a `read` flag for the Global Inbox's Unread filter.

Resolving an item is itself what resumes the paused project — the resolve API route calls `resumeServerDirector()` synchronously within the same request; the browser never makes a separate "resume" call. The Global Engineering Inbox (`/dev/inbox`) aggregates every project's items with filters (Waiting for CEO, Blocked, Security, Business Decision, Approval, Completed, Unread).

## Execution Identity

`lib/dev/runtime/executionIdentity.ts`. One formal identity per execution: product, project, phase, milestone, batch id/number/revision (`batch.updatedAt`), batch status, repository commit, runtime job id, CEO decision, knowledge version, execution timestamp. `executionIdentityKey()` derives a stable comparison key excluding only the three fields that differ on every run by definition (job id, timestamp, CEO decision) — a change in commit, batch revision, or knowledge version is precisely what the Planning Rules treat as a reason recurrence detection should allow rather than block.

## Knowledge Engine Integration

Headless execution does not call the full (localStorage-only) Knowledge Update Engine. Instead, each completed batch appends a `SnapshotCompletion` (batch id/number, milestone, objective, Claude's own executive summary, completion time, runtime job id) to the `ExecutionSnapshot.completions` array — a real, server-persisted audit trail of what the autonomous run actually did, independent of the browser-only Handover/decision/debt/risk/journal stores. `knowledgeVersion` is a cheap fingerprint (sorted digest of technical-debt/risk/decision counts and a hand-off timestamp) used purely for Execution Identity comparison, not a real versioned knowledge base.

## Locking Strategy

Two distinct lock types, both built on the same primitive (`lib/dev/fileLock.ts`'s `tryCreateExclusive`, using `fs`'s `O_CREAT|O_EXCL` semantics — atomic at the OS level, immune to Next.js's per-route module instantiation):

- **Loop ownership** (`directorLock.ts`) — "acquire or abandon" semantics. Exactly one holder per project at a time. A stale lock (recorded pid confirmed dead via `isProcessAlive`) is reclaimed; a live holder causes the caller to exit immediately, never starting a second loop. Used by `startServerDirector`, `resumeServerDirector`, and recovery — acquired *before* any state is touched, not just before the loop's iteration logic, so concurrent handoff/resume requests can't even race on the setup writes.
- **Store mutex** (`fileLock.ts`'s `withFileLock`) — "wait and retry" semantics. Every legitimate concurrent write must eventually succeed, so losers retry (bounded, with stale-lock reclaim) rather than abandon. Used to make each store's read-modify-write cycle atomic (`updateJsonStore`, and directly in `runtimeStorage.ts`'s `saveJob`/`updateJob`).

## Persistence Strategy

Everything the Director needs is file-backed under `.vyron-dev/` (gitignored, survives `.next` rebuilds and server restarts): `execution-snapshots.json` (planning state mirror per project), `director-runtime.json` (live status), `engineering-inbox.json`, `director-history.json`, `in-app-notifications.json`, `runtime-jobs.json` (pre-existing job store, now with the same atomicity guarantees), plus the loop-ownership and bootstrap lock files under `director-locks/`.

Every write is atomic (write-then-rename — a reader never observes a partial file) and every mutation goes through a file lock (either the wait-and-retry store mutex, or the acquire-or-abandon loop lock, depending on which invariant is being protected). This is what makes the whole system safe under concurrent requests, module re-evaluation, and process restarts without relying on any in-memory state.
