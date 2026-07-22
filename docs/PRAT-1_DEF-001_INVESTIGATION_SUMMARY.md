# PRAT-1 DEF-001 — Investigation & Regression Summary

**Reported symptom:** During PRAT-1, an Executive submitted a valid Risk Gate decision and received `"Invalid Engineering Order..."` instead of a recorded decision.

**Outcome:** No code change. Full investigation found no path by which Risk Gate submission (or any other executive governance action) can reach Engineering Sequence validation. Per your direction after reviewing the investigation, this summary documents the trace and adds permanent regression coverage proving the invariant holds, rather than fixing a code path that does not exist.

---

## Investigation

### Where "Invalid Engineering Order" actually comes from

The exact string is produced in exactly one place in the codebase: `checkInvalidEngineeringOrder()` in `lib/dev/planning/planningValidator.ts`, which surfaces any task whose `priorityReason` was set to `"Sequence violation: ..."` by `lib/dev/planning/planningPrioritizer.ts`'s `priorityFromSequenceGap()` (a task scheduled more than one position ahead of the project's current position in the canonical Engineering Sequence, `DEFAULT_MILESTONES`).

`validatePlan()` (the function containing this check) has exactly one production caller: `lib/dev/planning/planningEngine.ts`'s plan-generation step. That step — and the whole `EngineeringPlan` / Director-Review / Human-Approval pipeline it belongs to — is the **older, separate Planning Engine** (`/dev/planning`, `PlanningCentrePanel.tsx`, `planningRepository.applyApprovalDecision`), a system used to plan ad-hoc engineering work for existing projects. It is architecturally distinct from, and has zero imports connecting it to, the **Initiation & Programme Generation system** (`lib/dev/initiation/`) that owns Executive Risk Gate decisions.

### Full trace of the actual Risk Gate path

| Layer | File | Finding |
|---|---|---|
| UI | `components/dev/initiation/InitiationRiskGatePanel.tsx` | Calls the correct endpoint (`POST /api/dev/initiation/[id]/risk-gate`); renders `body.error` verbatim on failure; no shared state with any Planning Engine component. |
| API route | `app/api/dev/initiation/[id]/risk-gate/route.ts` | Calls `submitRiskGateDecision` directly; maps thrown errors via `describeInitiationError`. No reference to `planningValidator.ts` anywhere in this file. |
| Service | `lib/dev/initiation/riskGateService.ts` (`submitRiskGateDecision`) | Calls `resolveRisks` (checks `programme.risks`, computes a fingerprint via `initiationGenerationValidation.ts` — a **separate, purely structural** validator with no "sequence order" concept), then `initiationService.recordRiskGateAcceptance` or `returnApprovedToReview`. |
| Event publication | `initiationService.ts`'s `publishInitiationEvent` | Publishes to the `'Project Initiation'` category only. |
| Persistence | `lib/dev/initiation/initiationStore.ts` (`initiation-requests.json`) | A distinct file from the Planning Engine's own store (`lib/dev/planning/planningRepository.ts`, `planning-history.json`) — no filename collision. |

`lib/dev/initiation/*.ts` was grepped in full for any import of, or reference to, `planningValidator`, `planningEngine`, or `planningRepository` — none exist. A repo-wide search for a generic/shared "sequence validation" helper function also found none — each of the four governance actions in scope has its own, fully independent decision function.

### The same trace, repeated for the other three named governance actions

- **Release Go/Hold** (`lib/dev/director/releaseManagement/releaseManagementService.ts`'s `submitReleaseControlDecision`) — no import of `planningValidator.ts`.
- **Rollback Go/Hold** (`lib/dev/director/operations/operationsMonitoringService.ts`'s `submitRollbackControlDecision`) — no import of `planningValidator.ts`.
- **Planning Approval** (`lib/dev/planning/planningRepository.ts`'s `applyApprovalDecision` → `planningEngine.ts`'s `applyHumanApprovalDecision`) — this one *is* part of the same module as the validator, but `applyHumanApprovalDecision` only reads the plan's already-computed `approvalStatus`/`validation` (computed once, at generation time) and flips `approvalStatus` — it never calls `validatePlan` again at decision time. This is the architecturally correct boundary the report asks to preserve: Engineering Sequence validation runs once, at generation, and is never re-invoked by a governance decision.

## Root Cause

**Not reproducible in the current codebase.** No code path connects Executive Risk Gate submission (or any of the other three governance actions in scope) to Engineering Sequence validation. The exact reported error string exists only inside the older Planning Engine's own plan-generation validator, which the Initiation/Risk Gate system never calls.

No production code was changed as a result of this investigation.

## Files Changed

None (production code). One new test file, added per your direction to convert this investigation into a permanent, enforced regression guarantee:

- `tests/dev/governance/engineeringSequenceIsolation.test.ts` (new)

## Tests Added

12 new tests, in two groups:

**Governance actions never invoke Engineering Sequence validation** (`vi.spyOn` on `planningValidator.validatePlan`, asserting zero calls after each real decision):
- Risk Gate: Accept Risk, Mitigate Risk, and Reject Programme each succeed and never call `validatePlan`.
- Release Go/Hold: Go and Hold decisions each succeed and never call `validatePlan`.
- Rollback Go/Hold: Go and Hold decisions each succeed and never call `validatePlan`.
- Planning Approval: Approved and Rejected decisions each succeed and never *re-*call `validatePlan` at decision time (proving the existing, correct "validate once, at generation" boundary, since this is the one action that legitimately shares a module with the validator).

**Engineering Sequence validation remains fully enforced and unweakened for genuine Engineering execution** (calling the real `prioritizeTasks`/`validatePlan` functions directly, no mocking):
- `prioritizeTasks` still demotes a task scheduled far ahead of the project's current Engineering Sequence position, with a real `"Sequence violation: ..."` reason.
- `validatePlan` still reports an `"Invalid Engineering Order"` issue for a task carrying a genuine sequence-violation reason.
- `validatePlan` reports no such issue for a task genuinely at (or before) the current position — confirming no false positives were introduced either.

## Verification Results

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Clean |
| New test file | 12/12 passing, confirmed stable across repeated isolated runs |
| Full automated test suite | **966 total tests** (105 files) — 955–958 passing depending on run, with 8–14 failures every run traced to the same pre-existing, previously-documented fixed-2000ms `waitFor` timing issue (`tests/dev/support/testHarness.ts:56`) under heavy system load during this session; **zero failures ever occurred in the new test file or any file this investigation touched**. Every flaky test was individually re-run in isolation and passed cleanly each time. |
| `npm run build` | Exit 0, no errors |

No regression was introduced; no existing test's behavior changed, since no production code was modified.

---

Per instruction, stopping here. PRAT-1 should resume once this investigation and its conclusion (no code defect found; the reported invariant already holds and is now permanently regression-tested) have been reviewed and approved.
