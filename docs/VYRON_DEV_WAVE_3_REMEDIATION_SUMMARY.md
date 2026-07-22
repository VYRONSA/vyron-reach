# VYRON DEV Medium-Severity Reliability Remediation — Wave 3

Implements all sixteen findings classified **Medium** in `docs/VYRON_DEV_PRODUCTION_READINESS_HARDENING_AUDIT_PHASE_1.md`. No Critical (Wave 1), High (Wave 2), Low, or Enhancement findings were touched. Every fix preserves existing governance/business rules, reuses existing services/presentation layers, and keeps a single source of truth.

**Verification (all sixteen, combined):** `npx tsc --noEmit` clean · full suite **887/887 passing** (97 files, up from Wave 2's 839) · `npm run build` exits 0, all routes compile including both touched client components.

---

## PRA-P1-002 — Attribution has no way to distinguish between multiple people sharing the Developer login

- **Root cause:** `currentDevActor()` returns a single, process-wide label (`DEV_USERNAME`) with no per-session identity claim — if credentials are ever shared, the audit trail can't distinguish who actually made a decision.
- **Fix implemented:** Documented as an accepted limitation rather than building ahead of need — resolved directly with the user via `AskUserQuestion` (recommended option selected): VYRON DEV is a single-operator product today, and every call site already asks "who is the current actor" through this one function, so extending to real per-session identity later only ever requires changing this function, not its callers. Extended `currentDevActor()`'s doc comment to state this explicitly and reference PRA-P1-002 by id.
- **Files changed:** `lib/dev/auth.ts`
- **Tests added or updated:** None (documentation-only change; no behavior changed).
- **Verification performed:** `tsc --noEmit` clean.
- **Residual risk:** Unchanged from the audit's own description — if this product ever becomes multi-operator, attribution will need real per-session identity. Deliberately deferred, not overlooked.

## PRA-P1-005 — Assessment snapshot ids can collide within the same millisecond

- **Root cause:** `buildAssessmentSnapshot`'s id was `assessment_${projectSlug}_${Date.parse(generatedAt)}` — two snapshots generated in the same millisecond for the same project produced the identical id, and `appendAssessmentSnapshot` silently no-oped on a duplicate id, invisibly discarding the second snapshot.
- **Fix implemented:** Appended an 8-character random suffix (`crypto.randomUUID().slice(0, 8)`, the global Web Crypto API, not `node:crypto`, since this module is imported by a `'use client'` panel) to the id. `appendAssessmentSnapshot` now returns `boolean` (was `void`) so a caller can distinguish "written" from "already existed" instead of both looking identical; the assessment API route surfaces this as a `written` field and a `200` (existed) vs `201` (written) status distinction.
- **Files changed:** `lib/dev/assessment/assessmentEngine.ts`, `lib/dev/assessment/assessmentRepository.ts`, `app/api/dev/assessment/route.ts`
- **Tests added or updated:** `tests/dev/assessment/assessmentEngine.test.ts` (new, 2 tests) — proves two calls against an identical report object produce different ids while every other field stays identical. `tests/dev/assessment/assessmentRepository.test.ts` (+1 test) — proves `appendAssessmentSnapshot` returns `true` then `false` for a repeated id.
- **Verification performed:** New tests passing; full `tests/dev/assessment/` suite passing.
- **Residual risk:** None identified.

## PRA-P1-006 — A persist failure after a successful assessment computation discards the whole result

- **Root cause:** `computeFullAssessment`'s persist step and its compute step shared one try/catch — a network failure while POSTing to `/api/dev/assessment` threw the computed assessment away too, even though it was already correctly computed.
- **Fix implemented:** Isolated the persist POST in its own try/catch; the function now always returns the computed `assessment` (and friends) plus a new `persistError: string | null` field. `EngineeringAssessmentPanel.tsx` always renders the computed report and shows a separate, non-blocking amber warning when only the persist step failed, distinct from the existing red error path for a genuine compute failure.
- **Files changed:** `lib/dev/assessment/computeAssessment.ts`, `components/dev/EngineeringAssessmentPanel.tsx`
- **Tests added or updated:** `tests/dev/assessment/computeAssessment.test.ts` (new, 4 tests) — persist failure still returns the computed assessment with `persistError` set; persist success leaves `persistError` null; persist-not-requested leaves it null; a genuine read-pipeline failure still throws (proving the two failure modes stayed separate).
- **Verification performed:** New tests passing.
- **Residual risk:** None identified.

## PRA-P1-007 — A corrupted JSON store file fails silently with no operator-visible signal

- **Root cause:** `readJsonStore`'s catch block returned the fallback value with no logging at all — an operator would see a store silently reset to empty/default with zero indication anything was wrong.
- **Fix implemented:** Added a `console.warn` in the catch block naming the specific file and the underlying parse error. Fixed once at the shared `fileJsonStore.ts` level (not per-store), since Wave 2 already unified every affected store onto this one primitive.
- **Files changed:** `lib/dev/director/fileJsonStore.ts`
- **Tests added or updated:** `tests/dev/persistence/fileJsonStore.test.ts` (+2 tests) — confirms the warning fires on a parse failure and never fires on a successful read, via `vi.spyOn(console, 'warn')`.
- **Verification performed:** New tests passing; full `tests/dev/persistence/` suite passing.
- **Residual risk:** None identified.

## PRA-P1-013 — `recordRiskGateAcceptance` bypasses the status CAS other transitions use

- **Root cause:** The function wrote status directly rather than going through `applyTransition`'s compare-and-swap guard, and a `?? current` fallback silently absorbed a lost race instead of surfacing it.
- **Fix implemented:** Rewrote on top of `applyTransition(id, ['Approved'], ...)`, matching every other real state transition in this service. Removed the `?? current` fallback in `riskGateService.ts` so a conflict now genuinely throws `InitiationConflictError` instead of being swallowed.
- **Files changed:** `lib/dev/initiation/initiationService.ts`, `lib/dev/initiation/riskGateService.ts`
- **Tests added or updated:** `tests/dev/initiation/riskGateAcceptance.test.ts` (new, 4 tests) — including cancelling an `Approved` initiation and confirming both `recordRiskGateAcceptance` and `submitRiskGateDecision` correctly throw `InitiationConflictError` instead of silently succeeding.
- **Verification performed:** New tests passing.
- **Residual risk:** None identified.

## PRA-P1-014 — Rapid duplicate Risk Gate / Go-Hold submissions (double-click, retry) both get recorded

- **Root cause:** No debounce/dedup on identical, near-simultaneous decision submissions — a double-click or a client retry after a slow response both durably recorded, indistinguishable from two genuinely different decisions.
- **Fix implemented:** Added `isDuplicateDecision` (`lib/dev/initiation/decisionDebounce.ts`) — a generic, 5-second-window "same decision + same reason + same risk set, recorded very recently" predicate — applied at the top of `submitRiskGateDecision` and `submitExecutiveControlDecision`, returning the existing record on a genuine duplicate instead of appending a second one.
- **Files changed:** `lib/dev/initiation/decisionDebounce.ts` (new), `lib/dev/initiation/riskGateService.ts`, `lib/dev/initiation/executiveControlService.ts`
- **Tests added or updated:** `tests/dev/initiation/decisionDedup.test.ts` (new, 5 tests) — including a real Director-loop Go-decision scenario seeded with genuine Complete milestone/batch work so the loop reaches `Completed` rather than hanging in `Planning` against an empty programme.
- **Verification performed:** New tests passing.
- **Residual risk:** None identified. The 5-second window is a deliberate, documented heuristic — a genuinely new decision with identical content submitted more than 5 seconds later is (correctly) treated as a new decision, not a duplicate.

## PRA-P1-019 — Project-level Inbox items (Release/Rollback/Incident) are never deduplicated

- **Root cause:** `createInboxItem`'s dedup index only matched on `batchId`, but Release Go/Hold, Rollback Go/Hold, and Operational Incident items all pass `batchId: null` — every re-preparation/re-detection created a brand-new item instead of reopening the existing one.
- **Fix implemented:** Added an optional `sourceRef` field to `EngineeringInboxItem`. When `batchId` is absent, `createInboxItem` now dedupes by `(project, sourceRef, reasonType)` instead of always creating a new item. Wired `sourceRef` through every project-level call site: Release Go/Hold and Release Failure (`releaseManagementService.ts`), Operational Incident and Rollback Go/Hold (`operationsMonitoringService.ts`).
- **Files changed:** `lib/dev/director/directorRuntimeTypes.ts`, `lib/dev/director/engineeringInboxStore.ts`, `lib/dev/director/releaseManagement/releaseManagementService.ts`, `lib/dev/director/operations/operationsMonitoringService.ts`
- **Tests added or updated:** `tests/dev/director/engineeringInboxStore.test.ts` (new, 5 tests) — batch-scoped regression guard, `sourceRef` reopen, non-merge of distinct releases, resolved-then-reopened via `sourceRef`, and no-`sourceRef` backward compatibility.
- **Verification performed:** New tests passing; full `tests/dev/director/` suite passing.
- **Residual risk:** None identified.

## PRA-P1-022 — No ceiling on concurrently running project Director loops

- **Root cause:** Every project's Director loop ran fully unbounded — no configurable ceiling existed anywhere in `serverExecutionLoop.ts`.
- **Fix implemented:** Added a module-level semaphore (`acquireConcurrencySlot`/`releaseConcurrencySlot`, FIFO queue) gating a configurable ceiling (`VYRON_DEV_MAX_CONCURRENT_PROJECT_LOOPS`, default 5). Wrapped the single existing `runLoopBody` entry point (renamed internally to `runLoopBodyInner`) in a thin acquire/finally-release wrapper — satisfying "single source of truth" by gating the one place all three callers (`runServerLoop`, `startServerDirector`, `resumeServerDirector`) already funnel through, rather than duplicating the gate at each call site.
- **Files changed:** `lib/dev/director/serverExecutionLoop.ts`
- **Tests added or updated:** `tests/dev/director/concurrencyCeiling.test.ts` (new, 5 tests) — immediate grant under the ceiling, queuing + release-grants-queued, FIFO order across 3 queued requests, and 2 tests proving the env-var configuration is actually read (via `vi.resetModules()` + dynamic re-import).
- **Verification performed:** New tests passing.
- **Residual risk:** None identified. Default of 5 is a reasonable starting ceiling, fully operator-configurable without a code change.

## PRA-P1-023 — Stale director-loop lock reclaim from a genuinely killed process was never tested end-to-end

- **Root cause:** Existing tests proved the lock primitive's correctness under real multi-process load, and proved the stale-lock reclaim *decision logic* against a synthetic dead pid — but nothing had spawned a real OS process, had it acquire the real lock, killed it for real, and verified reclaim.
- **Fix implemented:** Added a real child-process test using `child_process.spawn`. The worker is plain JavaScript (`directorLockHolderWorker.mjs`), not TypeScript — an initial `.ts` version importing `directorLock.ts` directly failed under `node --experimental-strip-types` because that module's extensionless relative imports aren't resolvable by Node's native ESM loader (confirmed by comparing against the working `lockStressWorker.ts`'s own doc comment, which only works because its one target has no further relative imports of its own). The plain-JS worker instead recreates the lock file directly with 3 `fs` calls; the actual function under test (`acquireLoopOwnership`'s reclaim logic) still runs for real on the test-process side, using vitest's own working module resolution.
- **Files changed:** `tests/dev/support/directorLockHolderWorker.mjs` (new)
- **Tests added or updated:** `tests/dev/locking/directorLockRealProcess.test.ts` (new, 2 tests) — refuses acquisition while the real spawned process is alive, then reclaims once it's genuinely `SIGKILL`ed; a second reclaim attempt after the first succeeds is refused.
- **Verification performed:** New tests passing.
- **Residual risk:** None identified.

## PRA-P1-024 — Release Preparation doesn't re-verify QA passed at preparation time

- **Root cause:** `runReleasePreparation` reported verification run *counts* but never checked whether the most recent one actually passed — a batch reaching `Complete` through any path other than the audited one (a future migration, a manual planning-state edit) could still prepare a release with no QA safety net at preparation time.
- **Fix implemented:** Added a defense-in-depth check: if the most recent recorded verification (`listVerifications`, newest-first) failed, `runReleasePreparation` now fails with the specific failed activities named. A project with no verification history at all is left as a pass (never a fabricated judgment where no evidence exists) — only a genuine, on-record failure blocks.
- **Files changed:** `lib/dev/director/releaseManagement/releaseManagementRunners.ts`
- **Tests added or updated:** `tests/dev/director/releasePreparationQaRecheck.test.ts` (new, 4 tests) — passes on a recent pass, fails on a recent failure (naming the failed activity), only the *most recent* run matters (an old failure followed by a real pass no longer blocks), and no history at all is not itself treated as a failure.
- **Verification performed:** New tests passing.
- **Residual risk:** None identified.

## PRA-P1-028 — `Completed` status commits before `prepareRelease` runs, silently skipping preparation on a crash

- **Root cause:** The Director loop's completion block set `DirectorRuntimeStatus` to `Completed` (and recorded history/notification) *before* calling `prepareRelease` in its try/catch — a crash in that narrow window left the project permanently `Completed` with no release ever prepared and no record that preparation was even attempted.
- **Fix implemented:** Reordered the block so `prepareRelease` (already wrapped in try/catch) runs first; `Completed` status, history, and the "Project Completed" notification are only committed afterward, regardless of whether preparation succeeded or failed.
- **Files changed:** `lib/dev/director/serverExecutionLoop.ts`
- **Tests added or updated:** `tests/dev/director/releasePreparationOrdering.test.ts` (new, 1 test) — spies on `releaseManagementService.prepareRelease` (delegating to the real implementation against a disposable fixture cwd/exec, never the loop's own `process.cwd()`/real-`exec` defaults) and asserts the project's state is captured as *not yet* `Completed` at the moment of the call, with `Completed` only reached afterward.
- **Verification performed:** New test passing; full `tests/dev/director/` suite (85 tests at the time) passing.
- **Residual risk:** None identified.

## PRA-P1-029 — No structural duplicate-guard on release creation

- **Root cause:** `prepareRelease` always inserted a fresh `ReleaseRequest` with a new UUID, with no check for an existing `Prepared`/`Releasing` release for the same project — unlike `certificationClassifier.ts`'s explicit duplicate guard for certifications. Nothing audited currently double-calls it, but there was no structural protection if a future caller ever did.
- **Fix implemented:** Added a guard at the top of `prepareRelease` rejecting a new call while one is already `Prepared` or `Releasing` for the project, throwing a new `ReleaseAlreadyActiveError` (mapped to HTTP 409 in `describeReleaseManagementError`) naming the existing release's id and status.
- **Files changed:** `lib/dev/director/releaseManagement/releaseManagementService.ts`
- **Tests added or updated:** `tests/dev/director/releasePrepareDuplicateGuard.test.ts` (new, 4 tests) — rejects while `Prepared`; rejects while `Releasing` (requires a stub `exec` that lets preparation genuinely pass, so a fire-and-forget `executeRelease`'s synchronous early-return path doesn't flip status away from `Releasing` before the guard is exercised); allows a new `prepareRelease` once the prior one is `Held`; never blocks a different project.
- **Verification performed:** New tests passing; full `tests/dev/director/` suite (85 tests) passing.
- **Residual risk:** None identified.

## PRA-P1-030 — Certification criteria changes have no actor attribution or audit history

- **Root cause:** `PATCH`/`DELETE /api/dev/certification/criteria/[id]` never called `currentDevActor()` (unlike the release/risk-gate decision routes) and kept no history of prior values — only `updatedAt` was recorded, with old values simply overwritten.
- **Fix implemented:** Added an append-only `CertificationCriteriaChange` history store (mirrors `releaseManagementStore.ts`'s `appendReleaseControlDecision` exactly), recording the actor, timestamp, change type (`Updated`/`Deleted`), and the full prior record on every mutation. `updateCertificationCriteria`/`deleteCertificationCriteria` now take a `changedBy` parameter; both API routes pass `currentDevActor()`. Added a `GET` handler on the same `[id]` route (previously PATCH/DELETE-only) returning `{ criteria, history }` — reusing the existing resource route rather than introducing a new one.
- **Files changed:** `lib/dev/certification/certificationTypes.ts`, `lib/dev/certification/certificationCriteriaStore.ts`, `app/api/dev/certification/criteria/[id]/route.ts`
- **Tests added or updated:** `tests/dev/certification/certificationCriteriaStore.test.ts` (+3 tests, existing file updated for the new `changedBy` parameter) — records actor and full prior value on update without overwriting earlier entries; records a `Deleted` entry with the record as it stood at deletion time; a no-op update/delete against a nonexistent id never appends a history entry.
- **Verification performed:** New tests passing; full `tests/dev/certification/` suite (63 tests) passing.
- **Residual risk:** None identified.

## PRA-P1-033 — Operations/Incident lifecycle never publishes events

- **Root cause:** Incident opened/refreshed/resolved and Rollback Go/Hold decisions in `operationsMonitoringService.ts` never called `publish()`, unlike every other producer module — Live Command Centre/Metrics had no live signal for Operations, only manual poll/refresh.
- **Fix implemented:** Declared a new `'Operations'` category in `eventTypes.ts` and added a `publish()` call at each real state transition: `incident-opened` (a new incident detected), `incident-refreshed` (an existing incident's evidence updated on a later cycle), `incident-resolved` (auto-resolve on a healthy cycle), `rollback-pending` (a prior known-good release becomes available), and `rollback-decision` (a Go/Hold recorded).
- **Files changed:** `lib/dev/events/eventTypes.ts`, `lib/dev/director/operations/operationsMonitoringService.ts`
- **Tests added or updated:** `tests/dev/director/operationsEventPublishing.test.ts` (new, 4 tests) — this module's first tests of any kind (previously zero coverage), deliberately scoped narrow to just the new `publish()` behavior: a newly detected incident publishes `incident-opened` plus `rollback-pending` when a prior good release exists; a second cycle against the same still-unhealthy deployment publishes `incident-refreshed`, not a second `incident-opened`; a cycle that finds the deployment healthy again publishes `incident-resolved`; a Go/Hold decision publishes `rollback-decision`.
- **Verification performed:** New tests passing; full `tests/dev/director/` + `tests/dev/events/` suites (121 tests) passing.
- **Residual risk:** This module still has no test coverage beyond event publishing — general Operations behavior (severity classification, the six health checks themselves) remains untested, out of scope for this specific finding.

## PRA-P1-034 — Duplicate notification delivery possible on retry after a crash

- **Root cause:** `deliveryQueue.ts`/`deliveryBootstrap.ts` can re-attempt a delivery whose original send actually succeeded, if a crash happens between the provider call succeeding and the status being persisted as `Delivered` — no transport passed a deterministic idempotency key.
- **Fix implemented:** Where the provider genuinely supports it: Resend's `/emails` endpoint now receives an `Idempotency-Key` header set to the `NotificationEvent`'s own `id` (stable across every attempt and across a post-crash resume, since it's generated once at `raiseNotification` time and persisted as part of the delivery record itself). Where no such mechanism exists or isn't confidently verifiable for this codebase's scope (raw SMTP, Meta WhatsApp Cloud API, Twilio's freeform message send) — explicitly documented the accepted "prefer duplicate over lost" tradeoff at each transport, and cross-referenced from `deliveryQueue.ts`'s own doc comment (previously only `deliveryBootstrap.ts` documented it).
- **Files changed:** `lib/dev/notifications/providers/email/resendTransport.ts`, `lib/dev/notifications/providers/emailNotificationProvider.ts`, `lib/dev/notifications/providers/whatsapp/metaCloudApiTransport.ts`, `lib/dev/notifications/providers/whatsapp/twilioTransport.ts`, `lib/dev/notifications/deliveryQueue.ts`
- **Tests added or updated:** `tests/dev/notifications/resendIdempotency.test.ts` (new, 2 tests) — a Resend send includes the event's own id as the `Idempotency-Key` header; a simulated retry of the identical event sends the identical key both times (proving determinism across attempts, not a per-attempt random value).
- **Verification performed:** New tests passing; full `tests/dev/notifications/` suite (84 tests) passing.
- **Residual risk:** SMTP, Meta WhatsApp Cloud API, and Twilio sends remain exposed to the documented "may send twice on crash-during-delivery" window — an explicit, accepted tradeoff per the audit's own permitted resolution path, not an oversight.

## PRA-P1-037 — The Engineering Inbox gives no visual indication of which Open item, if any, is actually gating a project

- **Root cause:** `GlobalEngineeringInboxView.tsx` and `LiveEngineeringCommandCentre.tsx` rendered every Open item identically, with no indicator of whether a given item is the one recorded in the project's `waitingInboxItemId` (the actual blocker) versus an older, unrelated, still-open item — compounding PRA-P1-018's wrong-item-resolved risk.
- **Fix implemented:** Both views now derive the same fact `isCurrentInboxBlocker` (`directorRuntimeStore.ts`, built in Wave 2) already answers server-side, from `DirectorRuntimeStatus.waitingInboxItemId` data both components already fetch — no new API surface needed. The matching item gets a distinct border/ring treatment and a "This is currently blocking execution" / "Blocking execution" badge; in the Global view, other Open items for a project currently `Waiting for CEO` are labeled "Not the active blocker."
- **Files changed:** `components/dev/GlobalEngineeringInboxView.tsx`, `components/dev/LiveEngineeringCommandCentre.tsx`
- **Tests added or updated:** None — this codebase's test suite runs in a `node` environment with no React rendering harness (confirmed: no existing test exercises either component). Verified instead via `tsc --noEmit` and a full `npm run build` (all routes, including both touched client components, compile cleanly).
- **Verification performed:** `tsc --noEmit` clean; `npm run build` exit 0.
- **Residual risk:** Not verified in a live browser session (no dev-server walkthrough was performed for this specific change). The logic reuses an already-tested predicate (`isCurrentInboxBlocker`, covered by Wave 2's `directorStateMachine.test.ts`) and an already-fetched data field, so the risk surface is presentation-only.

---

## Architectural changes made (as required to document)

1. **`EngineeringInboxItem`** gained one new optional field (`sourceRef`) used for project-level (non-batch) dedup (PRA-P1-019).
2. **A module-level concurrency semaphore** added to `serverExecutionLoop.ts`, gating the single existing loop entry point (PRA-P1-022).
3. **`ReleaseAlreadyActiveError`** added alongside the existing Release Management error types, mapped to HTTP 409 (PRA-P1-029).
4. **`CertificationCriteriaChange`** is a new append-only history type/store, mirroring the existing `ReleaseControlDecision`/`RollbackControlDecision` pattern exactly (PRA-P1-030). A `GET` handler was added to the previously PATCH/DELETE-only `/api/dev/certification/criteria/[id]` route.
5. **A new `'Operations'` event category** added to `eventTypes.ts` (PRA-P1-033).
6. **`appendAssessmentSnapshot`** changed its return type from `void` to `boolean` (PRA-P1-005); **`computeFullAssessment`**'s return shape gained a `persistError` field (PRA-P1-006); **`updateCertificationCriteria`/`deleteCertificationCriteria`** gained a required `changedBy` parameter (PRA-P1-030).

None of these required a database/store migration — every change is additive to existing JSON-array-shaped records (new optional-at-read fields, or a new sibling append-only file) or a pure logic/ordering change over already-existing state.

## Full verification summary

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Clean |
| Full test suite | **887/887 passing** (97 files, up from Wave 2's 839/85) |
| `npm run build` | Exit 0, no errors, all routes compiled |
| Regression check | Full `tests/dev/director/`, `tests/dev/notifications/`, `tests/dev/certification/`, `tests/dev/assessment/`, `tests/dev/initiation/`, `tests/dev/persistence/`, `tests/dev/events/`, and `tests/dev/locking/` suites re-run and passing after every change in this wave |

---

Per the governing instruction for this wave: **stopping here.** Low-severity and Enhancement findings from the same audit have not been started, pending review and approval of this Wave 3 remediation.
