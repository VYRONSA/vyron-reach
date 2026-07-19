# Engineering Director v1.0 — Technical Debt Register

Genuine, accepted future improvements — not defects. Every item here was a deliberate scope decision made during v1.0 development, documented at the time, and re-confirmed as non-blocking during release validation.

## 1. Simplified headless intervention detection

Headless execution checks build/TypeScript status and a frozen technical-debt/risk snapshot, but does not run the Multi-Agent Workforce, Quality Gates, or Risk Assessment pipelines (all of which are coupled to the browser-attended `DevelopmentSession`/localStorage stack). `Engineering Health` and `Risk Level` display as `Unknown` on the headless dashboard as a direct consequence.

**Impact:** lower-fidelity intervention detection during autonomous runs than the browser-attended path offers.
**Why deferred:** porting those pipelines server-side is a substantial undertaking (they depend on Engineering Intelligence, Git/Code/Documentation findings, and the full localStorage-backed data model) — out of scope for the headless-execution milestone.

## 2. Frozen hand-off snapshot

Decisions, technical debt, and risk are captured once at Start Development and never refreshed during the run, even if the CEO edits them in the browser mid-run.

**Impact:** a long-running autonomous project won't see plan changes made after it started.
**Why deferred:** the whole point of the hand-off model is that the browser closing has zero effect on execution; a mid-run refresh mechanism would need its own concurrency story and wasn't needed for the validated scenarios.

## 3. Headless completions bypass the Knowledge Update Engine

Completed batches are recorded in `ExecutionSnapshot.completions` (a real, server-persisted record: objective, summary, timestamp, job id) rather than as Handover/architecture-decision/technical-debt/risk/journal entries in the richer, localStorage-only knowledge stores.

**Impact:** a CEO reviewing "what did the autonomous run actually do" sees the snapshot's own completion log, not a full Handover record.
**Why deferred:** those stores are localStorage-only by design; writing to them from the server isn't possible without the larger data-model migration noted in the Version 2.0 Backlog.

## 4. File-store concurrency uses a synchronous busy-wait

`fileLock.ts`'s `withFileLock` (the store-level mutex) retries via a short synchronous spin rather than an async wait, because the stores it protects are called from both synchronous and asynchronous contexts and must not change their calling convention.

**Impact:** negligible at this project's actual concurrency level (a handful of local requests), but not the mechanism of choice at higher throughput.
**Why deferred:** correct and safe today; revisit only if usage patterns change materially.

## 5. No automated test suite

This repository has zero automated tests. All Engineering Director validation (defect discovery, fix verification, stress testing) was performed live against a running server with real HTTP requests and, where warranted, real Claude Code executions.

**Impact:** regressions can only be caught by repeating manual/live validation, not by CI.
**Why deferred:** predates this feature; a pre-existing, project-wide condition, not something introduced by or specific to the Engineering Director.

## 6. Engineering Inbox and execution history have no pagination/archiving

`director-history.json` is capped at 2000 entries (oldest dropped); `engineering-inbox.json` and `in-app-notifications.json` are either capped or uncapped depending on store, but none support pagination for a UI browsing a large history.

**Impact:** fine at current scale; would need attention for a project with a very long autonomous run history.
**Why deferred:** no observed need yet.

## 7. No escalation for long-pending Engineering Inbox items

An item sitting `Open` for an extended period (e.g., a CEO on vacation) has no reminder, escalation, or timeout mechanism — the project simply stays paused indefinitely.

**Impact:** a forgotten pending approval blocks a project forever with no active signal beyond the original notification.
**Why deferred:** the initial notification fan-out was the v1.0 scope; escalation policy is a product decision, not purely a technical one.
