# Engineering Director v1.0 — Operational Guide

## Startup Sequence

1. Next.js initializes a new server instance (`next dev` or `next start`).
2. Before any request is served, Next.js calls `instrumentation.ts`'s `register()` (Node.js runtime only — a no-op under Edge).
3. `register()` dynamically imports and calls `runRecoveryBootstrap()` (`lib/dev/director/recoveryBootstrap.ts`).
4. The bootstrap acquires its own durable lock (reclaiming a stale one left by a crashed prior process if needed), calls `recoverActiveDirectorsOnStartup()`, records completion to `.vyron-dev/recovery-bootstrap.json`, and releases its lock.
5. The server begins serving requests. Any project recovery `recoverActiveDirectorsOnStartup()` kicked off continues in the background — it is fire-and-forget and does not block server readiness.

Operators can confirm a clean startup by checking `.vyron-dev/recovery-bootstrap.json` — its `pid` should match the current server process and `completedAt` should be recent.

## Recovery Sequence

For every project in `Running`/`Planning` state at startup:

1. Attempt to acquire that project's loop-ownership lock (`.vyron-dev/director-locks/<project>.lock`).
2. If a still-alive process already holds it (checked via `isProcessAlive` on the recorded pid) — no-op. That loop is genuinely still running; nothing to recover.
3. If the recorded owner is dead (the lock is stale) — reclaim it and re-enter the loop body.
4. The loop body re-derives the current batch from the persisted `ExecutionSnapshot` (unaffected by the crash) and creates a fresh runtime job for it. The interrupted job (already marked `Failed` by the pre-existing pid-liveness orphan check) is never revived — this is a new sequential attempt, not a second concurrent one.

No manual restart or intervention is required. This is deterministic: it depends only on lock ownership and pid liveness, never on matching an error-message string.

## Pause

Two paths:

- **System-initiated** (an intervention was detected) — the loop calls its internal `pause()`, creating an Engineering Inbox item and raising the relevant notification plus a generic `Engineering Paused` event, then sets state to `Waiting for CEO` (post-execution issues) or `Blocked` (pre-flight blockers).
- **CEO-initiated** (`POST /api/dev/director/[project]/pause`) — `pauseServerDirector()` sets state to `Waiting for CEO` immediately, but the running loop only actually stops at the next boundary between batches (an in-flight Claude run is never interrupted destructively).

## Resume

- **Via the Engineering Inbox** — resolving an item (`PATCH /api/dev/director/inbox/[id]` with `action: "resolve"`) calls `resumeServerDirector()` synchronously, within the same request. The browser never makes a separate resume call.
- **Directly** (`POST /api/dev/director/[project]/resume`) — for a CEO-paused project, or a `Blocked` one addressed outside the system without a specific inbox item.

Both paths acquire the loop-ownership lock before touching any state, so concurrent resume requests for the same project can never each perform their own redundant setup writes — only the request that wins the lock proceeds.

## Approval Flow

1. A batch completes; the Director validates it (real build/TypeScript check).
2. If an intervention condition is met (build/TypeScript failure; pre-flight technical-debt/risk blocker; a non-`Completed` job status), an Engineering Inbox item is created and the project pauses.
3. The CEO reviews the item (per-project Director tab, or the Global Engineering Inbox at `/dev/inbox`) and either:
   - **Approves** (resolves the item) — the underlying condition is considered addressed; the project resumes and the loop continues from the same batch.
   - **Rejects** (dismisses the item) — the project stays paused; no further automatic action is taken.

## Crash Recovery

See **Recovery Sequence** above. Validated scenarios: process killed and restarted mid-batch-execution; rapid repeated restarts (recovery runs exactly once per process, every time, never twice, never zero times); heavy concurrent polling throughout recovery and the retried execution (no duplicate jobs, no duplicate Engineering Inbox items, no stale approval pauses).

## Failure Handling

- **Build/TypeScript failure** — real `npm run build` / `npx tsc --noEmit` results (never Claude's own self-report) drive an Engineering Inbox pause with reason `Build Failure`.
- **Runtime job failure** (Claude CLI exits non-zero, times out, or is orphaned by a crash) — a generic `Approval Required` pause, reviewable in the Runtime History alongside the job's own error text.
- **Pre-flight blockers** (Critical technical debt or risk present in the hand-off snapshot) — the project never launches Claude for the blocked batch; it pauses immediately as `Blocked`.
- **Terminal job states are permanent** — once a job reaches `Completed`/`Failed`/`Cancelled`/`Rejected`, no later write (background reconciliation included) can change that status again.

## Monitoring

- **Per-project**: the Live Engineering Command Centre (each project's Director tab) — polls `GET /api/dev/director/status?project=` and `GET /api/dev/director/inbox?project=` every few seconds.
- **Cross-project**: the Global Engineering Inbox (`/dev/inbox`) — aggregates every project's inbox items with the seven required filters.
- **CEO Runtime Queries**: `GET /api/dev/director/query?project=` answers "Where are we / what's executing / why are we waiting / ETA / current batch/milestone/phase / remaining batches / current risks / build/TypeScript status" from the same live, persisted `DirectorRuntimeStatus` — never a separate computation.
- **Execution history**: `GET /api/dev/director/history?project=` — an append-only log of every start/pause/resume/cancel/completion/milestone/phase event for that project.
- **Notifications**: `GET /api/dev/notifications?project=` — the In-App provider's persisted feed.
