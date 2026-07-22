# VYRON DEV Production Blocker Remediation — Wave 1

Implements the five Production Blockers listed in `docs/VYRON_DEV_PRODUCTION_READINESS_HARDENING_AUDIT_PHASE_1.md`'s "Remaining Production Blockers" section. Each fix preserves the existing business rules the audit didn't ask to change, keeps a single source of truth (no parallel validation/state), and is idempotent/resumable. No High/Medium/Low/Enhancement findings were touched.

**Verification (all five, combined):** `npx tsc --noEmit` clean · full suite **820/820 passing** (83 files, up from the pre-Wave-1 baseline of 796) · `npm run build` exits 0 with no errors.

---

## PB-001 — Release Approval Does Not Execute Release (PRA-P1-032)

- **Root cause:** The only UI action available for a "Release Go/Hold Required" Engineering Inbox item was the generic Approve/Reject buttons (`GlobalEngineeringInboxView.tsx`, `LiveEngineeringCommandCentre.tsx`), which call `resolveEngineeringInboxItem`/`dismissEngineeringInboxItem` — these only change the inbox item's own status and resume the Director loop. Neither ever called `POST /api/dev/director/[project]/release/[releaseId]/decision`, the one route that can record a real Go/Hold decision. A CEO clicking "Approve" believed they'd approved the release; `ReleaseRequest.status` stayed `Prepared` forever.
- **Fix implemented:** Added a dedicated `ReleaseDecisionModal` (mirrors `InitiationRiskGatePanel.tsx`'s pattern: plain-language preparation report, required reason, explicit Go/Hold buttons, a governance note that Go is never auto-retried). Both inbox surfaces now special-case `reasonType === 'Release Go/Hold Required'`: instead of the generic buttons they show "Review Release", which opens the modal. The modal calls the real, unchanged decision endpoint; only after a decision is actually recorded does it resolve the underlying inbox item (reusing the existing `resolveEngineeringInboxItem` call — no new resolve logic). Added one small read-only GET route so the modal can find which `ReleaseRequest` a project's inbox item refers to (the inbox item itself carries no `releaseId`).
- **Files changed:**
  - `components/dev/ReleaseDecisionModal.tsx` (new)
  - `app/api/dev/director/[project]/release/route.ts` (new, read-only GET wrapping the already-existing `listReleases`)
  - `components/dev/GlobalEngineeringInboxView.tsx` (wired in)
  - `components/dev/LiveEngineeringCommandCentre.tsx` (wired in)
- **Tests added or restored:** None new — this is a UI wiring fix over an endpoint (`submitReleaseControlDecision`) already covered by the restored suite in PB-005. This codebase has no precedent anywhere for component-level UI tests, so none were introduced for this fix, consistent with existing convention.
- **Verification performed:** `tsc --noEmit` clean; `npm run build` compiled both new routes/pages successfully; the decision endpoint's own behavior is exercised end-to-end by the PB-005 test suite. No manual browser click-through was performed.
- **Residual risk:** The actual click-through UX is unverified by an automated test (none exist in this repo for any component). Low risk given the modal is a thin, direct caller of an already-tested endpoint, but worth a manual smoke test before this reaches real executives.

---

## PB-002 — Planning Approval Trusts Client Input (PRA-P1-008)

- **Root cause:** `PATCH /api/dev/planning` accepted a client-supplied `approvalStatus`/`approvalResult` and wrote it unconditionally via `updatePlanningRecord`. The actual invariant — a plan may only move `Director Reviewed → Approved/Rejected` — lived exclusively in `applyHumanApprovalDecision` (`planningEngine.ts`), a function only ever called client-side. A direct API call (curl, a replayed request, a race between tabs) could force a plan with failing validation straight to `Approved`.
- **Fix implemented:** Added `applyApprovalDecision(id, decision)` to `planningRepository.ts` — the one server-side path that can ever set `plan.approvalStatus`/`approvalResult`. It re-derives the outcome by calling the *same* `applyHumanApprovalDecision` the client already used (single source of truth, not a re-implementation), against the plan as currently stored, never against anything the client sent. If the stored plan isn't `Director Reviewed`, the function returns `{ ok: false }` rather than silently no-op-ing, and the route returns `409` — a caller can never be misled into thinking a rejected decision succeeded. `updatePlanningRecord`'s patch type no longer accepts `approvalStatus`/`approvalResult` at all (only the legitimate execution-outcome fields), and the route builds its patch object with an explicit presence-checked allowlist rather than a rest-spread, so a raw JSON body can't smuggle either field past TypeScript's compile-time-only type.
- **Files changed:**
  - `lib/dev/planning/planningRepository.ts` (added `applyApprovalDecision`, narrowed `updatePlanningRecord`; also switched directory resolution from a hardcoded `process.cwd()` join to `getVyronDevDataDir()` — same production behavior, but what makes this store testable in isolation like every other store)
  - `app/api/dev/planning/route.ts` (PATCH now branches on an explicit `decision` field; execution-outcome patch built via presence-checked allowlist)
  - `components/dev/PlanningCentrePanel.tsx` (`decide()` now sends `{ id, decision }` and syncs to the server's returned plan; rolls back its optimistic preview on a rejected decision)
- **Tests added or restored:** `tests/dev/planning/planningRepository.test.ts` (new, 6 tests) — records `Approved` correctly from `Director Reviewed`; **rejects (doesn't write) an Approve/Reject against a `Proposed` plan — the exact bypass this finding described**; rejects a second decision against an already-`Approved` plan; returns `ok:false` for an unknown id; and proves a raw body carrying `approvalResult` (simulating an attacker not bound by TypeScript) can no longer move `plan.approvalStatus` at all.
- **Verification performed:** New suite 6/6 passing; full `tests/dev/planning/` (4 files, 44 tests) passing; `tsc --noEmit` clean.
- **Residual risk:** None identified for this specific bypass. `planningRepository.ts` still has no file lock (PRA-P1-010/004, a separate High finding, explicitly out of scope for Wave 1).

---

## PB-003 — Assessment History Corruption (PRA-P1-003)

- **Root cause:** `lib/dev/assessment/assessmentRepository.ts` and `lib/dev/director/assessment/assessmentStore.ts` — two unrelated subsystems with incompatible record shapes (`AssessmentSnapshot[]` vs. `AssessmentHistoryEntry[]`) — both independently hardcoded the literal filename `'assessment-history.json'`, resolving to the same absolute path in every non-simulation deployment. Each subsystem's write could silently clobber the other's entire history.
- **Fix implemented:** Created `lib/dev/assessmentStoreFilenames.ts` as the one shared source of truth for both filenames — `ENGINEERING_ASSESSMENT_HISTORY_FILE` (unchanged: `'assessment-history.json'`, kept by the Engineering Assessment Engine) and `DIRECTOR_ASSESSMENT_HISTORY_FILE` (renamed to `'director-assessment-history.json'`, per the audit's own recommendation to rename "the Director's own store"). Both stores now import their filename from here instead of a hardcoded literal. Added `assertAssessmentStoreFilenamesAreDistinct()`, called as the very first line of `instrumentation.ts`'s `register()` hook (before any bootstrap reads/writes anything) — a zero-I/O static check that fails loudly at startup if the two ever collide again, instead of silently corrupting data. Also switched `assessmentRepository.ts`'s directory resolution to `getVyronDevDataDir()` (same production behavior, needed to test it in isolation).
- **Files changed:**
  - `lib/dev/assessmentStoreFilenames.ts` (new)
  - `lib/dev/director/assessment/assessmentStore.ts` (filename now imported, renamed)
  - `lib/dev/assessment/assessmentRepository.ts` (filename now imported; directory resolution fix)
  - `instrumentation.ts` (startup assertion, first line of `register()`)
- **Tests added or restored:** `tests/dev/assessment/assessmentRepository.test.ts` (new, 4 tests) — confirms the two constants are distinct and the assertion doesn't throw; confirms each subsystem's history is written to its own file on disk (not a shared one) with the correct shape; confirms reading one subsystem's history never returns the other's records; confirms idempotency-on-id and correct test isolation.
- **Verification performed:** New suite 4/4 passing; full `tests/dev/assessment/` + `tests/dev/scalability/assessmentQuery.test.ts` (6 files, 61 tests) passing — no regression from the rename.
- **Residual risk:** The pre-existing `.vyron-dev/assessment-history.json` in any already-running deployment may already contain intermingled records from both subsystems (this is local, gitignored runtime state, not committed data). This fix stops any *further* corruption and separates the two going forward, but does not attempt to retroactively sort out already-mixed historical entries — doing so would require guessing which shape a given ambiguous record belongs to, which risks fabricating a distinction that isn't actually recoverable from the data itself.

---

## PB-004 — Provisioning Crash Recovery (PRA-P1-015)

- **Root cause:** `beginProvisioning`'s status compare-and-swap never accepted `'Provisioning'` as a valid source status. A crash or timeout mid-`provisionProgramme` left the record in `Provisioning` permanently — every retry (including a plain re-POST of `/provision`) got a `409`, with no automatic recovery path, unlike the Director subsystem's own `recoverActiveDirectorsOnStartup`.
- **Fix implemented:** `beginProvisioning` now also accepts `'Provisioning'` as a source status — a resume-in-place, not a new transition. This is safe because `provisionProgramme` was already built to be resumable (it skips any tempId already present in the persisted `provisionResult`), so re-entering the same status re-runs the same three idempotent checks (validator, fingerprint, risk gate) and then picks up exactly where it left off. Added `resumeStuckProvisioning()` (finds every `InitiationRequest` stuck in `Provisioning` and calls `runProvisioning` again for each, one failure never blocking the rest) and `initiationRecoveryBootstrap.ts`, mirroring `recoveryBootstrap.ts`'s exact lock/once-per-process pattern, wired into `instrumentation.ts` right after the Director's own recovery bootstrap.
- **Files changed:**
  - `lib/dev/initiation/initiationService.ts` (`beginProvisioning`'s `allowedFrom`)
  - `lib/dev/initiation/initiationProvisioningService.ts` (added `resumeStuckProvisioning`)
  - `lib/dev/initiation/initiationRecoveryBootstrap.ts` (new)
  - `instrumentation.ts` (wired in)
- **Tests added or restored:** `tests/dev/initiation/initiationProvisioningRecovery.test.ts` (new, 4 tests) — confirms the normal Approved→Provisioned path still works; **simulates a crash** (a milestone + its first batch already committed to the Planning Service, record left in `Provisioning`) and confirms `runProvisioning` resumes and completes **without duplicating** the pre-existing milestone/batch; confirms `resumeStuckProvisioning` finds and completes every stuck record while leaving non-stuck ones untouched; confirms it's a clean no-op when nothing is stuck.
- **Verification performed:** New suite 4/4 passing; `tsc --noEmit` clean (this file exposed and fixed a comment-block syntax break introduced mid-edit, caught immediately by the same typecheck).
- **Residual risk:** None identified for the stuck-state scenario itself. Provisioning is still fully synchronous within the request (PRA-P1-016, a separate High finding, out of scope for Wave 1) — this fix makes recovery possible after a crash, it doesn't prevent the crash's underlying cause (a long-running request/function timeout).

---

## PB-005 — Release Crash Recovery and Test Coverage (PRA-P1-025, PRA-P1-031)

- **Root cause (test coverage, PRA-P1-031):** `tests/dev/director/_releaseManagementVerification.test.ts` (224 lines, covering successful preparation, a blocked-release-must-never-execute guarantee, a genuine execution failure, a full successful execution, and deployment verification) was staged and then deleted from the working tree, leaving Release Management with zero automated coverage.
- **Root cause (crash recovery, PRA-P1-025):** `executeRelease` runs fire-and-forget with no lock, no job record, and no recovery hook. A crash mid-execution leaves the `ReleaseRequest` permanently in `Releasing` — by the time it runs, the project's Director state is already `Completed`, so `recoverActiveDirectorsOnStartup` (which only revisits `Running`/`Planning` projects) never looks at it.
- **Fix implemented — test restoration:** Restored the file from the git index (`git restore`). Running it against current code surfaced **three real, independent bugs**, all fixed:
  1. Two of the five test cases called `submitReleaseControlDecision(...)` without passing the fixture's isolated `cwd`/`exec` — the function's own documented "live-verification bug" (defaulting to `process.cwd()` and a real subprocess exec). **This is not a hypothetical**: running the unfixed test actually committed a bogus commit onto this repository's real `master` and pushed two throwaway branches to the real GitHub remote before I caught and reverted it (see the incident note below). Fixed by passing `fixture.workDir`/`ghPrExec` explicitly at all three call sites.
  2. A `listReleases` name collision: the test imported `releaseManagementService.listReleases` (returns `ReleaseRequest[]`, no `passed` field) where it actually needed `knowledgeService.listReleases` (returns the permanent `ReleaseRecord[]`, which has `passed`). Fixed by importing the correct one under its own comment explaining the collision.
- **Fix implemented — crash recovery:** Unlike Provisioning, release execution's mutating steps (commit, branch push, PR creation, deployment) have no per-step checkpoint — a blind retry after an unknown partial failure risks a duplicate commit, a second PR, or a second deployment. So a stuck `Releasing` record is **failed out cleanly, never retried**: `resumeStuckReleases()` finds every such record and routes it through the existing `failRelease` path (the same permanent, human-visible "Release Failure" inbox item + notification + knowledge record every other execution failure already produces), with a synthetic activity result explaining the interruption and telling the operator to verify real repository/deployment state before preparing a new release. `releaseRecoveryBootstrap.ts` mirrors the same lock/once-per-process pattern as the other two bootstraps, wired into `instrumentation.ts` last among the three recovery bootstraps.
- **Files changed:**
  - `tests/dev/director/_releaseManagementVerification.test.ts` (restored + 3 bugs fixed)
  - `lib/dev/director/releaseManagement/releaseManagementService.ts` (added `resumeStuckReleases`)
  - `lib/dev/director/releaseManagement/releaseRecoveryBootstrap.ts` (new)
  - `instrumentation.ts` (wired in)
- **Tests added or restored:** The restored 5-test suite (now passing, and now safe). Plus `tests/dev/director/releaseManagementRecovery.test.ts` (new, 5 tests) — fails out a simulated crashed release with a clear reason; raises the same inbox item/knowledge record any other failure produces; confirms a stuck release is never silently re-executed to `Released`; confirms non-stuck releases (`Prepared`/`Released`) are left untouched; confirms multiple stuck releases across different projects are each resumed independently.
- **Verification performed:** Both suites passing (5 + 5 = 10 tests). Repository state (`git rev-parse HEAD` / `git branch --show-current`) was explicitly checked before and after every subsequent run of the restored suite to confirm no further real-repo side effects.
- **Incident during this fix (fully resolved, disclosed for transparency):** Running the restored-but-still-buggy test the first time caused two real side effects on this actual repository: a bogus `"Release v1.0.1"` commit landed on local `master` (sweeping in every pending file change, nothing was lost), and two throwaway branches were created and pushed to the real `origin` (`github.com/VYRONSA/vyron-reach`). I stopped immediately, disclosed this in full, and — after your explicit confirmation — resolved it via `git reset --soft` (undoing the bogus commit while preserving every file change as uncommitted, exactly as before), deleted both stray branches locally and from `origin`, and confirmed via `gh pr list` that no stray pull request was created. The repository was verified back to its original commit (`52460d8`) on `master` before continuing, and every subsequent test run was checked before/after for safety.
- **Residual risk:** Release execution still has no per-activity checkpoint (accepted, deliberate — see fix description above: failing out safely was chosen over an unsafe blind retry). `submitReleaseControlDecision`'s other findings (PRA-P1-026 concurrent-decision audit trail, PRA-P1-027 stale-response-on-CAS-failure) are separate High findings, explicitly out of scope for Wave 1.

---

## Full verification summary

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Clean |
| Full test suite | **820/820 passing** (83 files) |
| `npm run build` | Exit 0, no errors |
| Repository safety (`git rev-parse HEAD`, `git branch --show-current`) | Verified back to the original `master`/`52460d8` before/after every test run following the incident above |

*Awaiting review and approval before beginning any High/Medium/Low/Enhancement findings.*
