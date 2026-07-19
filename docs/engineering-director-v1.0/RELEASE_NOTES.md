# VYRON DEV — Engineering Director v1.0

**Release Tag:** `engineering-director-v1.0`
**Status:** Frozen and Released

## Major Features

- **Autonomous Engineering Director** — a server-side orchestration loop that executes a project's batches end-to-end once a CEO presses Start Development: select the next batch → validate dependencies → build engineering context → launch Claude → validate the result → update knowledge/planning/progress → decide whether CEO approval is required → either auto-continue or pause.
- **True headless execution** — runs entirely in the Node server process. Verified to continue after the browser is closed and after the server process itself crashes and restarts, with no manual intervention required.
- **Formal Execution Identity** — every run carries product/project/phase/milestone/batch/batch-revision/repository-commit/knowledge-version/CEO-decision, threaded through job creation and used by recurrence detection.
- **Engineering Inbox** — every required CEO interruption (build failure, business decision, technical debt escalation, approval required) becomes one inbox item with reason, severity, and recommended action. A project-scoped view lives on each project's Director tab; a cross-project **Global Engineering Inbox** lives at `/dev/inbox`.
- **Notification Service** — provider-based (In-App real and persisted; Email and WhatsApp registered as placeholder interfaces, disabled). The Director only ever raises events; providers decide delivery.
- **Live Engineering Command Centre** — a per-project monitoring dashboard (progress, phase, milestone, batch, activity, AI task, elapsed runtime, ETA, build/TypeScript status, risk, engineering health, waiting reason) and Start/Pause/Resume/Cancel/Approve/Reject controls. The UI only ever calls thin API endpoints — it never executes anything itself.
- **Deterministic crash recovery** — a durable, filesystem-anchored lock (not in-memory state) guarantees exactly one execution loop per project, survives process restarts, and requires no manual intervention after an unexpected crash.
- **Recovery Bootstrap** — recovery is guaranteed to run exactly once per application process via Next.js's `instrumentation.ts` startup hook, independent of which API route (if any) is hit first.

## Architecture (Summary)

Planning data (projects/milestones/batches/decisions/debt/risk) lives in browser `localStorage`, so the CEO's one hand-off at Start Development ships a snapshot of everything the autonomous run needs to a server-owned `ExecutionSnapshot`. From that point, the server is the sole writer for the run's duration; the browser becomes a monitoring surface only. See `ARCHITECTURE.md` for the full breakdown (locking, persistence, state machine, notification/inbox design, knowledge integration).

## Validation Summary

Engineering Director v1.0 went through five validation rounds before this freeze:

1. **End-to-end production validation** (fictional "Notes App" test product, real Claude Code execution, controlled fault injection) — found 3 Critical defects.
2. **Critical defect remediation** — all 3 fixed at the root cause; re-validated with concurrent-request stress tests (8x simultaneous handoff, 6x simultaneous resume, crash+multi-route-restart).
3. **Stale runtime state investigation** — a 4th, narrower defect found during round 2's stress testing (a completed execution briefly reporting an orphan status); fixed at the root cause and verified with an isolated unit test plus heavy concurrent-polling live tests.
4. **Recovery bootstrap gate** — closed the one remaining architectural gap (recovery only firing via specific lifecycle routes); replaced with a guaranteed once-per-process startup hook. Verified with 4 required scenarios (cold start, active-project restart, read-only-traffic-only, rapid repeated restarts).
5. **This freeze** — final `npm run build` / `npx tsc --noEmit` confirmation, no code changes.

## Critical Defects Fixed

1. **Duplicate Engineering Director execution** — an in-memory `Set` guarding "one loop per project" was not a reliable singleton across Next.js's per-route module instantiation. Fixed with a durable, atomic, filesystem-anchored lock (`directorLock.ts`).
2. **Unsafe concurrent persistence** — every Director store (and the pre-existing runtime job store) performed non-atomic read-modify-write, causing job records to silently vanish under concurrent writes. Fixed with atomic write-then-rename and a locked read-modify-write cycle (`fileLock.ts`, `updateJsonStore`).
3. **Non-deterministic crash recovery** — recovery relied on matching an error-message string, which could re-launch or miss batches inconsistently under the above race. Fixed by making recovery reduce entirely to the loop-ownership lock's pid-liveness check — deterministic, no string matching.
4. **Stale runtime state overwriting newer state** — orphan-detection reconciliation could downgrade an already-`Completed` job back to `Failed` using a stale read, because it bypassed the existing Execution State Machine. Fixed by enforcing legal state transitions atomically inside `updateJob` itself, plus closing a status/pid registration race in the Claude Code provider.
5. **Recovery bootstrap gap** — `recoverActiveDirectorsOnStartup()` only ran as a side effect of specific lifecycle routes being imported, so a restarted server receiving only monitoring traffic would never recover automatically. Fixed with a dedicated Recovery Bootstrap invoked from Next.js's `instrumentation.ts` `register()` hook, guaranteed to run once per process before any request is served.

## Known Non-Blocking Limitations

These are documented, accepted scope boundaries — not defects — carried into the Technical Debt Register and Version 2.0 Backlog:

- Headless execution uses a simplified intervention check (build/TypeScript failure, frozen technical-debt/risk snapshot) — it does not run the Multi-Agent Workforce, Quality Gates, or Risk Assessment pipelines, which remain browser-attended-only concepts.
- Decisions/technical debt/risk/product bible are frozen at hand-off time and do not refresh mid-run.
- Headless batch completions are recorded in the snapshot's own `completions` array, not as full Handover/decision/debt/risk/journal records in the (localStorage-only) knowledge stores.
- `Engineering Health` and `Risk Level` display as `Unknown` on the headless dashboard (never computed in this mode).
- A pre-existing, environment-specific flakiness: running the real `npm run build` validation concurrently with the `next dev` server's own Turbopack compilation can occasionally produce a transient build-failure pause; confirmed transient every time it was observed (the real build passes independently), not a code defect.
- Testing the real Claude Code invocation from within an already-active Claude Code session is not supported (a documented, external limitation of the CLI, not fixable in this codebase).
