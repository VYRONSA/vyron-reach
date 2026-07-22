# VYRON DEV High-Severity Reliability Remediation — Wave 2

Implements all ten findings classified **High** in `docs/VYRON_DEV_PRODUCTION_READINESS_HARDENING_AUDIT_PHASE_1.md`. No Critical (Wave 1), Medium, Low, or Enhancement findings were touched. Every fix preserves existing governance/business rules, keeps a single source of truth, and is idempotent — see each finding's own note on how.

**Verification (all ten, combined):** `npx tsc --noEmit` clean · full suite **839/839 passing** (85 files, up from Wave 1's 820) · `npm run build` exits 0. Repository state (`git rev-parse HEAD` / `git branch --show-current`) was checked before and after every test run in this wave — unchanged throughout.

---

## PRA-P1-004 — No file lock on `assessmentRepository.ts`'s read-modify-write

- **Root cause:** Raw `fs.readFileSync` → mutate → `fs.writeFileSync`, with none of the locking `fileJsonStore.ts` provides — two concurrent `appendAssessmentSnapshot` calls could interleave and lose one side's snapshot.
- **Fix implemented:** Rewrote the store on top of `fileJsonStore.ts`'s `readJsonStore`/`updateJsonStore` — the same locked primitive every other store in the codebase uses. The append/trim logic moved unchanged into `updateJsonStore`'s `mutate` callback, so it now runs entirely inside the store's file lock.
- **Files changed:** `lib/dev/assessment/assessmentRepository.ts`
- **Tests added or updated:** None new (Wave 1's `tests/dev/assessment/assessmentRepository.test.ts` already exercises every exported function and continues to pass unchanged, proving the rewrite is behavior-preserving). Genuine cross-process lock correctness is proven once, at the primitive level, by `tests/dev/locking/crossProcessLock.test.ts`/`directorLock.test.ts` — not duplicated here, per the "avoid duplicate validation" instruction.
- **Verification performed:** `tsc --noEmit` clean; `tests/dev/assessment/` (6 files, 61 tests) passing.
- **Residual risk:** None identified.

## PRA-P1-010 — No file lock on `planningRepository.ts`'s read-modify-write

- **Root cause:** Same defect class as PRA-P1-004.
- **Fix implemented:** Same treatment — rewritten on `fileJsonStore.ts`'s locked primitives. Combined with this same file's PRA-P1-008 (Wave 1) and PRA-P1-009/011 (below) work, since all four touch `applyApprovalDecision`.
- **Files changed:** `lib/dev/planning/planningRepository.ts`
- **Tests added or updated:** Existing `tests/dev/planning/planningRepository.test.ts` continues to pass unchanged against the new implementation.
- **Verification performed:** `tsc --noEmit` clean; `tests/dev/planning/` (4 files, 46 tests) passing.
- **Residual risk:** None identified.

## PRA-P1-009 — Plan approval/rejection decisions carry no timestamp or actor field

- **Root cause:** `PlanningHistoryRecord` had no `decidedBy`/`decidedAt` fields; only a `timestamp` reflecting plan generation, never the approval decision itself.
- **Fix implemented:** Added `decidedBy: string | null` and `decidedAt: string | null` to `PlanningHistoryRecord`, initialized to `null` at generation (`buildPlanningHistoryRecord`), and populated from `currentDevActor()`/`new Date().toISOString()` inside `applyApprovalDecision` at the moment a decision actually takes effect — mirroring `ReleaseControlDecision`'s existing attribution pattern.
- **Files changed:** `lib/dev/planning/planningTypes.ts`, `lib/dev/planning/planningEngine.ts`, `lib/dev/planning/planningRepository.ts`
- **Tests added or updated:** `tests/dev/planning/planningRepository.test.ts` — 2 new tests: records who/when on a successful decision (and that `decidedAt` is distinct from generation `timestamp`); confirms both fields stay `null` when a decision is rejected (never written).
- **Verification performed:** New tests passing; full `tests/dev/planning/` suite passing.
- **Residual risk:** None identified.

## PRA-P1-011 — Plan approval/rejection publishes no event

- **Root cause:** Nothing in `lib/dev/planning/*` or its API route ever called `publish()` — Metrics/Certification/the Live Command Centre never learned a plan had been approved or rejected.
- **Fix implemented:** `applyApprovalDecision` now publishes a `'Planning Changes'` event (`plan-approved`/`plan-rejected`) on an actual successful write only — never on a rejected (409) decision. Published from the repository function itself (the one place that can ever record the outcome) rather than the API route, so any future caller gets correct eventing automatically instead of needing to remember to publish separately.
- **Files changed:** `lib/dev/planning/planningRepository.ts` (`app/api/dev/planning/route.ts` needed no change once the publish moved into the repository function)
- **Tests added or updated:** `tests/dev/events/producerIntegration.test.ts` — 2 new tests, following that file's established `capture()`/`hasCategory()` pattern used for every other producer: confirms `applyApprovalDecision` publishes `'Planning Changes'` on success, and confirms it publishes nothing when the decision is rejected.
- **Verification performed:** New tests passing (15/15 in that file); full suite passing.
- **Residual risk:** None identified.

## PRA-P1-016 — Provisioning is fully synchronous and blocking within the HTTP request

- **Root cause:** `runProvisioning` executed the entire commit sequence inside the request lifecycle with no async handoff — directly risking a platform request/function timeout on a large programme.
- **Fix implemented:** Added `startProvisioning(id)`, which performs the synchronous `beginProvisioning` CAS and then defers the actual work (`runProvisioningWork`) via `setImmediate` before returning the in-progress record immediately — mirroring `releaseManagementService.ts`'s `submitReleaseControlDecision`/`executeRelease` fire-and-forget shape. **The `setImmediate` is load-bearing, not decorative**: since `provisionProgramme` is entirely synchronous fs work, a bare `void asyncFn()` with no intervening event-loop tick would run to completion before the caller's own function even returned (verified directly — see below) — `setImmediate` is what actually lets the HTTP response go out before the work begins. The original fully-awaited `runProvisioning` is kept unchanged and still used by `resumeStuckProvisioning` (Wave 1's recovery bootstrap), where full completion tracking matters and there's no HTTP timeout pressure. **No client change was required**: `InitiationDetailView.tsx` already renders a distinct "Provisioning…" state and already subscribes to the `'Project Initiation'` SSE events that `completeProvisioning`/`failProvisioning` already publish — confirmed by reading that component before making this change.
- **Architectural note:** This does not make provisioning itself concurrent with anything else — Node's single-threaded event loop still processes `provisionProgramme`'s synchronous work as one atomic block once it starts. What changes is *when* the HTTP response is sent (before that block runs, not after), which is the actual failure mode this finding describes (a client/proxy-side timeout from never receiving a response). If the underlying process is killed before the deferred work runs, PRA-P1-015's recovery bootstrap (Wave 1) is the existing safety net — the same reasoning Release Management's own fire-and-forget pattern already relies on.
- **Files changed:** `lib/dev/initiation/initiationProvisioningService.ts`, `app/api/dev/initiation/[id]/provision/route.ts`
- **Tests added or updated:** `tests/dev/initiation/initiationProvisioningRecovery.test.ts` — 2 new tests: proves `startProvisioning` returns immediately with `status: 'Provisioning'` and *zero* milestones committed at that instant, with the full commit only observable after polling for completion (this test caught a real bug during development — an initial version without `setImmediate` returned with all milestones *already* created, disproving the intended fix until corrected); confirms `startProvisioning` still enforces every `beginProvisioning` precondition synchronously (a stale approved-programme fingerprint still throws before any state change).
- **Verification performed:** New tests passing; full `tests/dev/initiation/` suite (6 tests) passing.
- **Residual risk:** On a true one-request-per-container serverless model (not this platform's Fluid Compute, which reuses instances), a `setImmediate` callback scheduled after the response is sent could in principle be dropped if the instance is reclaimed before the next tick runs. The Wave 1 recovery bootstrap is the accepted mitigation for exactly this case, consistent with how Release Management's identical pattern already relies on its own recovery bootstrap.

## PRA-P1-017 — A raw status-patch API route bypasses every lifecycle guard

- **Root cause:** `POST /api/dev/director/status` accepted an arbitrary `{project, patch}` body and wrote it straight to `patchDirectorStatus` — including `state` — with none of `acquireLoopOwnership`'s guards. Confirmed unused: no `.tsx` component called the client wrapper for it.
- **Fix implemented:** Removed the `POST` handler outright (option (a) from the audit, not a field allowlist) — confirmed via full-codebase grep that no UI component, and no test, calls the client wrapper (`directorClient.ts`'s `patchDirectorStatus`) or the route directly; every legitimate state transition already has its own guarded route. Removed the now-dead client wrapper alongside it.
- **Files changed:** `app/api/dev/director/status/route.ts` (GET-only now), `lib/dev/runtime/directorClient.ts`
- **Tests added or updated:** `tests/dev/director/statusRoute.test.ts` (new) — asserts the route module exports `GET` but not `POST`, and that the client no longer exports `patchDirectorStatus`, so the vulnerability can't silently return.
- **Verification performed:** New tests passing; `tsc --noEmit` clean (confirms nothing else referenced the removed export).
- **Residual risk:** None identified.

## PRA-P1-018 — Resolving/dismissing any Open inbox item unconditionally resumes execution

- **Root cause:** The resolve/dismiss route called `resumeServerDirector(item.project)` on every resolve, without checking whether the resolved item was actually the one recorded in `DirectorRuntimeStatus.waitingInboxItemId` — a stale or unrelated Open item (project-level items are never deduplicated) could still trigger a false resume.
- **Fix implemented:** Added `isCurrentInboxBlocker(project, inboxItemId)` to `directorRuntimeStore.ts` — a small, directly-testable named predicate (`waitingInboxItemId === inboxItemId`) — and the inbox route now only calls `resumeServerDirector` when this returns true. Extracted as a named function rather than an inline check specifically so it's unit-testable without a Next.js request-mocking harness (this codebase has no route-level test infrastructure anywhere).
- **Files changed:** `lib/dev/director/directorRuntimeStore.ts`, `app/api/dev/director/inbox/[id]/route.ts`
- **Tests added or updated:** `tests/dev/director/directorStateMachine.test.ts` — 3 new tests in a dedicated describe block: `isCurrentInboxBlocker` correctness in isolation; a full integration scenario (project genuinely Blocked, an unrelated Release Go/Hold item also Open, resolving the *unrelated* item leaves the project still Blocked with the real blocker untouched — the exact false-approval scenario this finding described); confirms resolving the *actual* blocking item still resumes exactly as before.
- **Verification performed:** New tests passing (21/21 in that file); full suite passing.
- **Residual risk:** None identified for this specific gap. PRA-P1-019 (project-level items never deduplicated) is a separate Medium finding, out of scope for Wave 2 — a stale duplicate item can still exist, it just can no longer cause a false resume when resolved.

## PRA-P1-026 — Concurrent Go/Hold decisions are both durably recorded even though only one takes effect

- **Root cause:** `submitReleaseControlDecision` appended the `ReleaseControlDecision` record unconditionally *before* attempting the status CAS — two concurrent submissions (double-click, or two executives) that both read `Prepared` both got a permanent record, even if they disagreed, with no indication of which one "won."
- **Fix implemented:** Reordered so the status CAS (`updateReleaseRequest`, itself lock-protected) runs first; the decision record — now carrying a new `effective: boolean` field — is appended only once the outcome is known, and is never dropped even on the losing side (matching the audit's explicit "mark a losing decision as superseded/rejected in its own record," never "silently discard it"). The existing external contract (throw `ReleaseConflictError` when the release isn't genuinely `Prepared` at decision time) is preserved exactly — this was a deliberate choice to avoid a client-visible workflow/API change, since Wave 1's `ReleaseDecisionModal.tsx` already relies on that contract.
- **Files changed:** `lib/dev/director/releaseManagement/releaseManagementTypes.ts` (added `effective` field), `lib/dev/director/releaseManagement/releaseManagementService.ts`
- **Tests added or updated:** `tests/dev/director/releaseControlDecisionRace.test.ts` (new, 4 tests) — a losing concurrent decision is still permanently recorded with `effective: false`, its content preserved verbatim; disagreeing decisions (Go then Hold) resolve deterministically with only the winner ever reaching `executeRelease`; a normal non-racing decision still succeeds exactly as before.
- **Verification performed:** New tests passing; existing `tests/dev/director/_releaseManagementVerification.test.ts` (5 tests, real git fixtures) and `releaseManagementRecovery.test.ts` (5 tests) still passing unchanged. Repository safety (`git rev-parse HEAD`) re-checked after this run given Wave 1's incident with this exact test file.
- **Residual risk:** None identified.

## PRA-P1-027 — The API response for a rejected decision can show stale status

- **Root cause:** On a failed CAS, the function returned the pre-mutation snapshot read at the top of the function rather than the actual current state, so the HTTP response could claim `Prepared` when the release had already moved to `Releasing`/`Held`.
- **Fix implemented:** Fixed together with PRA-P1-026 above (same function, same root defect). On a lost CAS, the current state is now freshly re-read (`getReleaseRequest`) before being used in the thrown `ReleaseConflictError`, never the stale snapshot from the top of the function.
- **Files changed:** `lib/dev/director/releaseManagement/releaseManagementService.ts` (same edit as PRA-P1-026)
- **Tests added or updated:** `tests/dev/director/releaseControlDecisionRace.test.ts` — 1 dedicated test asserting the thrown error's `actualStatus` is `'Releasing'` (the real post-CAS state), never `'Prepared'` (the stale pre-mutation value).
- **Verification performed:** New test passing.
- **Residual risk:** None identified.

## PRA-P1-035 — Escalation state on a reopened inbox item never resets

- **Root cause:** `startMonitoring` treated "a record already exists" as fully idempotent regardless of its `status` — the DEF-002 reopen path reuses the same inbox item id when a batch-level condition recurs after being marked Resolved, but the escalation record stayed `Resolved`/`Cancelled` forever, so `escalationService.ts`'s cycle (which only re-checks records still `Monitoring`) would silently never escalate it again.
- **Fix implemented:** `startMonitoring` now distinguishes three cases: no record (create fresh, unchanged), an existing record still `Monitoring` (true no-op, unchanged — verified against the pre-existing idempotency test), and an existing record that's `Resolved`/`Cancelled` (reset to a fresh `Monitoring` state — level/reminder count back to zero, a new append-only history entry documenting the reopen, `resolvedAt`/`lastReminderAt` cleared). The existing unconditional `publish('monitoring-started')` call after the update was left exactly as-is, to avoid changing eventing behavior beyond this specific fix's scope.
- **Files changed:** `lib/dev/escalation/escalationStateStore.ts`
- **Tests added or updated:** `tests/dev/escalation/escalationStateStore.test.ts` — 4 new tests: resets a `Resolved` record to fresh `Monitoring` (level/reminder/resolvedAt all cleared, history appended not rewritten); resets a `Cancelled` record the same way; a reopened/reset record can genuinely escalate again (`recordReminder` works on it exactly as on a brand-new one); confirms the still-`Monitoring` case remains a true no-op (this is the regression guard for the pre-existing idempotency test).
- **Verification performed:** New tests passing (15/15 in that file); full `tests/dev/escalation/` (5 files, 52 tests) and `producerIntegration.test.ts` passing.
- **Residual risk:** None identified.

---

## Architectural changes made (as required to document)

1. **`assessmentRepository.ts` and `planningRepository.ts`** now use `fileJsonStore.ts`'s shared locked primitive instead of raw `fs` calls — bringing both in line with every other store in the codebase (PRA-P1-004, PRA-P1-010).
2. **`PlanningHistoryRecord`** gained two new fields (`decidedBy`, `decidedAt`) (PRA-P1-009).
3. **`ReleaseControlDecision`** gained one new field (`effective: boolean`) (PRA-P1-026).
4. **Provisioning's completion path** is now split into a synchronous starter (`startProvisioning`) and a deferred worker (`runProvisioningWork`), with the original fully-synchronous `runProvisioning` retained for the recovery bootstrap's use (PRA-P1-016).
5. **One API route removed** (`POST /api/dev/director/status`) along with its now-dead client wrapper (PRA-P1-017).
6. **One new exported predicate** (`isCurrentInboxBlocker`) added to `directorRuntimeStore.ts` (PRA-P1-018).

None of these required a database/store migration — every change is additive to existing JSON-array-shaped records (new optional-at-read fields) or a pure logic change over already-existing state.

## Full verification summary

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Clean |
| Full test suite | **839/839 passing** (85 files) |
| `npm run build` | Exit 0, no errors |
| Regression check | All Wave 1 tests (release management, provisioning recovery, assessment/planning repository, status route) re-run and still passing |
| Repository safety (`git rev-parse HEAD`, `git branch --show-current`) | Verified unchanged before/after every test run in this wave |

*Awaiting review and approval before beginning Medium, Low, or Enhancement findings.*
