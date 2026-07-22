# VYRON DEV Production Readiness Hardening Audit – Phase 1

**Type:** Defensive engineering audit (read-only). No code was changed to produce this document.
**Scope:** The full autonomous lifecycle — Executive Directive → Knowledge Discovery → Engineering Intelligence → Programme Generation → Engineering Assessment → Planning Engine → Executive Risk Gate → Provisioning → Executive Go/Hold → Engineering Inbox → Engineering Execution → Quality Assurance → Release Management → Operations → Executive Command Centre.
**Method:** Full-file review (not grep-only) of every module in scope, cross-referenced against existing tests to distinguish "proven" from "claimed" behaviour. Findings are cited by exact file:line.

---

## Executive Summary

VYRON DEV's **core execution engine is genuinely solid**: the Director runtime loop, its file-based locking (`directorLock.ts`), and its crash-mid-batch recovery path (`recoverActiveDirectorsOnStartup`) are correctly built, and largely proven by real tests rather than just asserted in comments. Idempotency for Start/Pause/Resume, single-writer discipline for the runtime store, and the Scheduler/Escalation/Notification bootstraps are all sound.

Outside that core, however, the audit found **five Critical defects** that mean this system is **not yet safe to run unattended with real (non-simulated) engineering work and real Executive sign-off**:

1. Two independent assessment subsystems silently write to **the same file on disk** with incompatible schemas, corrupting each other's history.
2. A Planning Engine API route accepts a client-supplied `approvalStatus` with **no server-side re-validation** — a plan that fails validation can be forced to `Approved` directly, bypassing the entire Director-Review governance gate the rest of the codebase is built around.
3. A crashed Release execution leaves the release **permanently stuck** in `Releasing` with no operator-visible signal and no automatic remediation.
4. The **only UI touchpoint** for a Release Go/Hold decision — the Engineering Inbox item — does **not actually call the decision endpoint**. A CEO clicking "Approve" believes they approved the release; nothing happens.
5. A 224-line test suite that specifically covered Release Management's failure modes was staged and then **deleted**, leaving that subsystem with zero automated coverage.

None of these require a redesign — each has a narrow, identifiable fix — but together they mean the parts of the system an actual executive interacts with to grant permanent, high-stakes approvals (Plan approval, Release Go/Hold) are currently either bypassable or non-functional, while the parts that just execute already-approved work are trustworthy.

**Overall Production Readiness Score: 48 / 100 — Not Production Ready for unattended, real-stakes operation.**

| Domain | Score /100 | Note |
|---|---|---|
| Engineering Execution (Director loop, locking, recovery) | 82 | Strong; two narrow gaps (raw status route, project-level inbox dedup) |
| Initiation / Programme Generation | 68 | Solid state machine; one stuck-state recovery gap |
| Executive Risk Gate / Provisioning / Go-Hold (initiation) | 58 | Governance decisions solid; provisioning has no crash recovery |
| Engineering Assessment / Planning Engine | 32 | Governance-bypass + file-collision Criticals |
| Quality Assurance / Release Management | 28 | Stuck-state Critical + deleted tests + non-functional UI |
| Operations / Scheduler / Escalation / Notifications | 70 | Solid locking; a few Medium gaps (events, dedup, escalation reset) |
| Executive & Engineering UX | 45 | Genuinely excellent patterns in places (Risk Gate panel), a Critical gap in Release Go/Hold, one inbox-clarity gap |

---

## How to read this document

Each finding has: **ID · Severity · Module · Description · Root Cause · Risk · Recommended Fix · Priority**.
Severity: `Critical | High | Medium | Low | Enhancement`. Priority mirrors severity unless stated otherwise. Findings that reference the same underlying defect from two modules are cross-referenced rather than double-counted in the severity tally.

---

## 1. Executive Directive & Knowledge Discovery

**Reviewed and passed:**
- Knowledge Discovery (`lib/dev/initiation/knowledgeDiscovery.ts:334-341`) isolates each retriever's failure individually and converts it to a reported gap rather than aborting the whole pass — no single point of failure.
- Directive submission is correctly gated end-to-end by `isRuntimeAccessible` on every mutating route; no route skips this check.
- Slug-reservation races (two concurrent directive submissions deriving the same slug) correctly resolve to one success + one `409 InitiationSlugTakenError` (`initiationService.ts:64-69`).

### PRA-P1-001 — Orphaned project reservation on a crash between project-create and initiation-insert
- **Severity:** Low
- **Module:** Executive Directive
- **Description:** `createInitiation` (`lib/dev/initiation/initiationService.ts:206-224`) reserves a Planning project (line 209) before inserting the `InitiationRequest` record (line 252).
- **Root Cause:** The two writes are not atomic and there is no reconciliation pass for the gap between them.
- **Risk:** A crash in that window leaves a reserved "planning" project with nothing in Initiation pointing at it — wastes a slug, no corruption, no detection.
- **Recommended Fix:** Add a startup reconciliation check (mirroring `recoveryBootstrap.ts`'s pattern) that flags/archives planning projects with no corresponding Initiation record older than N minutes.
- **Priority:** Low

### PRA-P1-002 — Actor attribution is a static process-wide label, not a session identity (cross-cutting)
- **Severity:** Medium
- **Module:** Executive Directive (applies system-wide: Risk Gate, Provisioning, Go/Hold, Release decisions all use the same primitive)
- **Description:** `currentDevActor()` (`lib/dev/auth.ts:48-50`) returns `process.env.DEV_USERNAME` or the literal `'owner'` — never anything derived from the session cookie/token. Every `approvedBy`/`cancelledBy`/`executive` field in the system is filled from this one static value.
- **Root Cause:** Deliberate single-operator design; the auth layer verifies "a valid token" (HMAC), not "which of several people."
- **Risk:** If credentials are ever shared by more than one person (a second executive, a delegate), the audit trail cannot distinguish who actually made a decision — the "attributable" governance requirement is only satisfied in the trivial single-user case.
- **Recommended Fix:** If multi-operator use is ever intended, extend the session token to carry a distinct identity claim and thread it through `currentDevActor()`. If single-operator is a permanent product decision, document it explicitly as an accepted limitation rather than an implicit one.
- **Priority:** Medium (contingent on whether multi-operator use is ever expected)

---

## 2. Engineering Intelligence

**Reviewed and passed:** The finding-scanners that feed this stage (`buildFindingsIntelligence.ts`, the engines behind `computeClientEngineeringFindings`/`buildExecutiveEngineeringReport`) are pure, read-only, and evidence-carrying (every `EngineeringFinding` mandates a literal `evidence` string, never a bare judgment) — no mutation, no duplicate-detection path of its own. This module's main exposure is downstream: it feeds the two Assessment engines described in Section 3, whose storage collision (PRA-P1-003) is the real risk, not this stage itself.

---

## 3. Engineering Assessment

### PRA-P1-003 — Two independent assessment subsystems write to the same file with incompatible schemas
- **Severity:** Critical
- **Module:** Engineering Assessment
- **Description:** `lib/dev/assessment/assessmentRepository.ts:13-14` resolves its store to `.vyron-dev/assessment-history.json` via plain `fs.readFileSync`/`writeFileSync` (no lock, no atomic rename). `lib/dev/director/assessment/assessmentStore.ts:22` uses the identical filename `assessment-history.json`, resolved through `fileJsonStore.ts`'s `storeDir()` (`lib/dev/vyronDevDataDir.ts:34`) to the same absolute path in every non-simulation deployment. One holds `AssessmentSnapshot[]` (repository-facts/scoring shape); the other holds `AssessmentHistoryEntry[]` (quality-gates/risk shape). Each subsystem's own code comments describe the other as "deliberately not touched or merged" — the collision was never noticed.
- **Root Cause:** Two engines independently chose the same default filename with no shared registry of store filenames.
- **Risk:** A write from either subsystem can silently clobber the other's entire history; a reader of one shape parsing the other's JSON gets `undefined`/missing fields with no error. Silent, hard-to-reproduce cross-subsystem data corruption in production data.
- **Recommended Fix:** Rename one store's file immediately (e.g. `assessment-history.json` → `director-assessment-history.json` for the Director's own store), add a central filename registry/constant that both subsystems import from, and add a startup assertion that no two known stores resolve to the same path.
- **Priority:** Critical — fix before any further data accumulates under the shared name.

### PRA-P1-004 — No file lock on `assessmentRepository.ts`'s read-modify-write
- **Severity:** High
- **Module:** Engineering Assessment
- **Description:** `assessmentRepository.ts:34-44` does raw `fs.readFileSync` → mutate in JS → `fs.writeFileSync`, with none of the locking (`withFileLock`/`atomicWriteFileSync`) that `lib/dev/director/fileJsonStore.ts` was built specifically to fix (its own header comment describes this exact pattern as "the read-modify-write race that previously made records vanish under concurrent execution").
- **Root Cause:** The Assessment Engine's own repository was never migrated onto the shared locked store primitive used elsewhere.
- **Risk:** Two concurrent `POST /api/dev/assessment` calls (two browser tabs, or the Assessment panel racing the Planning Centre's own background assessment) can lose one side's snapshot entirely, contradicting the module's own "append-only, never overwritten" framing.
- **Recommended Fix:** Route `assessmentRepository.ts` through `fileJsonStore.ts`'s locked read/write helpers, same as every other store in the codebase.
- **Priority:** High

### PRA-P1-005 — Snapshot ID collisions are silently dropped; the API reports success anyway
- **Severity:** Medium
- **Module:** Engineering Assessment
- **Description:** `buildAssessmentSnapshot` (`assessmentEngine.ts:123`) generates `id: assessment_${projectSlug}_${Date.parse(generatedAt)}` (millisecond resolution). `appendAssessmentSnapshot` (`assessmentRepository.ts:34-44`) treats an existing id as already-recorded and silently returns without writing, but `POST /api/dev/assessment` (`route.ts:98-114`) always returns `201` with the snapshot echoed back regardless of whether the write happened.
- **Root Cause:** Millisecond-resolution IDs with no uniqueness guard beyond silent dedup, and no propagation of "actually written vs. already existed" to the caller.
- **Risk:** Two genuinely-distinct assessment runs completing within the same millisecond (plausible under the concurrency in PRA-P1-004) causes the second run's real data to be dropped while the client sees a success response.
- **Recommended Fix:** Include a random/monotonic component in the snapshot ID, and have the API distinguish "written" vs. "already existed" in its response.
- **Priority:** Medium

### PRA-P1-006 — A successfully-computed Assessment report is discarded if only the persist step fails
- **Severity:** Medium
- **Module:** Engineering Assessment
- **Description:** `computeFullAssessment` (`computeAssessment.ts:111-138`) computes the full report client-side, then (when `persist=true`) awaits a POST to persist it. If that POST throws, the whole function throws, and `EngineeringAssessmentPanel.tsx:36-49`'s catch block never calls `setReport(assessment)` even though the report was already fully computed.
- **Root Cause:** The already-computed in-memory result has no fallback display path independent of the persist call succeeding.
- **Risk:** A transient network blip on the persist step forces the user to re-run the entire fs-scan + 3-fetch pipeline to see a report they already had.
- **Recommended Fix:** Set the report into state before attempting to persist, and surface persistence failure as a non-blocking warning rather than discarding the result.
- **Priority:** Medium

### PRA-P1-007 — History readers fail closed to an empty array on any parse error, masking corruption
- **Severity:** Medium
- **Module:** Engineering Assessment
- **Description:** `assessmentRepository.ts:22-31`'s `catch { return [] }` (and the equivalent in `planningRepository.ts`) means that if PRA-P1-003's file collision leaves the store in a shape one reader can't parse, nothing is logged or surfaced — history silently appears empty.
- **Root Cause:** Defensive-by-default error handling with no observability hook.
- **Risk:** Makes PRA-P1-003 far harder to detect and diagnose in production; an operator sees "no history" instead of "corrupted history."
- **Recommended Fix:** Log a warning (not just swallow) on parse failure, and consider surfacing a distinct "history unavailable" state in the UI rather than an indistinguishable "no history yet."
- **Priority:** Medium

**Reviewed and passed:** `assessmentScoring.ts`, `assessmentModels.ts`, `assessmentRecommendations.ts` are pure and evidence-based; the Director's own assessment service (`assessmentService.ts:53-54`) correctly dedups no-op history writes and no-op event publishes; the two assessment engines are intentionally different computations over different signals (their own docs say so) — the problem is purely the storage collision above, not the dual-engine design itself.

**Enhancement:** Label the two assessment surfaces distinctly in the UI so an operator always knows which "assessment" a given number came from.

---

## 4. Planning Engine

### PRA-P1-008 — A Planning API route accepts a client-supplied `approvalStatus` with no server-side re-validation
- **Severity:** Critical
- **Module:** Planning Engine
- **Description:** `app/api/dev/planning/route.ts:42-63` (PATCH) passes a client-supplied `approvalStatus` straight through to `updatePlanningRecord` (`planningRepository.ts:60-75`), which sets it unconditionally. The actual invariant check — that a plan can only move `Director Reviewed → Approved` — lives in `applyHumanApprovalDecision` (`planningEngine.ts:198-205`), but per that file's own header comment, the Planning Engine "is pure and runs client-side" — this server route never calls it. `components/dev/PlanningCentrePanel.tsx:305,313` disables the Approve/Reject buttons client-side only.
- **Root Cause:** The governance invariant is enforced only in a client-side function and the UI that calls it; the server route that actually persists the change has no equivalent guard.
- **Risk:** Any direct PATCH (curl, a replayed request, a race between two browser tabs, a compromised client) can move a `Proposed` plan with failing validation (missing objective, unresolved architecture conflict, etc.) straight to `Approved` — directly contradicting the governance note already written into `executiveValidationTranslator.ts:53` ("no human can approve it while this issue is open").
- **Recommended Fix:** Move the `Director Reviewed → Approved` (and equivalent) transition checks server-side into the PATCH route itself, so the API — not just the UI — is the enforcement point.
- **Priority:** Critical

### PRA-P1-009 — Plan approval/rejection decisions carry no timestamp or actor field
- **Severity:** High
- **Module:** Planning Engine
- **Description:** `PlanningHistoryRecord` (`planningTypes.ts:141-152`) has only a `timestamp` set once at generation (never updated by `updatePlanningRecord`) and no `approvedBy`/`approvedAt`/`decidedBy` field exists anywhere in `lib/dev/planning/*`. `PlanningCentrePanel.tsx:147-164`'s `decide()` never captures or sends an identity.
- **Root Cause:** The approval-decision data model was never extended to record who/when, unlike the equivalent Risk Gate and Release decision records.
- **Risk:** There is no durable record of when a plan was approved/rejected or by whom — only that it happened, invisibly, inside a record whose timestamp field still reflects generation time.
- **Recommended Fix:** Add `decidedBy`/`decidedAt` fields to the approval decision, populated from `currentDevActor()` and `new Date().toISOString()` at decision time, mirroring `ReleaseControlDecision`'s pattern.
- **Priority:** High

### PRA-P1-010 — No file lock on `planningRepository.ts`'s read-modify-write
- **Severity:** High
- **Module:** Planning Engine
- **Description:** Same defect class as PRA-P1-004, in `planningRepository.ts:24-57`.
- **Root Cause / Risk / Fix:** Identical to PRA-P1-004 — route through the locked store primitive.
- **Priority:** High

### PRA-P1-011 — Plan approval/rejection publishes no event
- **Severity:** High
- **Module:** Planning Engine
- **Description:** `planningStateService.ts` publishes `'Planning Changes'` events for batch/debt/status mutations, but nothing in `lib/dev/planning/*` or its API route ever calls `publish()`. `MetricsDashboard`, `CertificationDashboard`, and `LiveEngineeringCommandCentre` all subscribe to categories like `'Planning Changes'`/`'Assessment Updates'` and never learn about a plan approval.
- **Root Cause:** Missing publish call at the single most governance-significant event in this subsystem.
- **Risk:** No real-time oversight surface (Metrics, Certification, Live Command Centre) ever reflects that a human approved or rejected a plan.
- **Recommended Fix:** Publish a `'Planning Changes'` event from the PATCH route on every approval/rejection.
- **Priority:** High

### PRA-P1-012 — `planningStateMigration.ts` has a small unlocked concurrent-import window
- **Severity:** Low
- **Module:** Planning Engine
- **Description:** `importFromLocalStorage` (`planningStateMigration.ts:26-95`) is gated by a single `migrated` boolean set only at the end (line 92), with no lock. Two concurrent portal loads could both begin the import before the flag is set.
- **Root Cause:** No lock around a one-time migration check.
- **Risk:** Bounded — migration only runs on an empty store and all writes are idempotent upserts, so the blast radius is duplicate/overwritten-with-identical-data writes, not divergent state.
- **Recommended Fix:** Wrap the migration check in the same file-lock primitive used elsewhere, for defense in depth even though current risk is low.
- **Priority:** Low

**Reviewed and passed:** `validatePlan` and `applyHumanApprovalDecision` correctly enforce the approval invariant *when actually called* — the gap is purely that the API layer bypasses them (PRA-P1-008). `planningClientCache.ts`/`PlanningHydrationGate.tsx` are an explicitly-documented, well-designed optimistic cache with a bounded staleness window and correct reconciliation on mutation/events. Double-click protection on "Run Assessment"/"Generate Plan" buttons is present and correct. No project hard-delete path exists, so "orphan snapshot referencing a deleted project" is currently unreachable.

---

## 5. Executive Risk Gate

**Reviewed and passed:** `beginProvisioning` (`initiationService.ts:549-571`) unconditionally re-validates the programme fingerprint and re-checks unresolved High-severity risks server-side, regardless of what the UI does — a direct `curl -X POST /provision` with no risk-gate decisions correctly fails `409`. Concurrent `/provision` requests cannot lose an update (CAS via the file lock). Decisions are append-only, timestamped, and identity-attributed (subject to PRA-P1-002's single-operator caveat) with no update/delete path — this is a well-built governance gate. `components/dev/initiation/InitiationRiskGatePanel.tsx` is a genuinely strong Executive UX example: plain-language decision hints, a required reason field, and a visible "Governance history" list showing every decision with who/when/why.

### PRA-P1-013 — `recordRiskGateAcceptance` skips the initiation-status compare-and-swap that its sibling functions use
- **Severity:** Medium
- **Module:** Executive Risk Gate
- **Description:** Unlike the Mitigate/Reject path, `recordRiskGateAcceptance` (`initiationService.ts:486`) does not re-check the initiation's current status before recording the decision.
- **Root Cause:** Inconsistent guard between the "Accept Risk" branch and the other two decision types.
- **Risk:** An Accept-Risk decision can be recorded against an initiation that was cancelled moments earlier, producing a governance record for a project that no longer exists in a live state.
- **Recommended Fix:** Apply the same status CAS used by Mitigate/Reject to the Accept-Risk path.
- **Priority:** Medium

### PRA-P1-014 — No de-duplication on Risk Gate (or Go/Hold) decision submission
- **Severity:** Medium
- **Module:** Executive Risk Gate / Executive Go-Hold
- **Description:** Nothing prevents a double-click or a retried request from submitting the same decision twice.
- **Root Cause:** Decisions are appended without a client-supplied idempotency key or a check for "an identical decision was just recorded."
- **Risk:** Duplicate permanent audit records for the same real-world decision — not incorrect, but noisy and potentially confusing when reviewing governance history.
- **Recommended Fix:** Disable the submit button while in flight (if not already) and/or add a short server-side debounce keyed on (initiation id, decision type, risk set).
- **Priority:** Medium

---

## 6. Provisioning

### PRA-P1-015 — A crash or timeout mid-provisioning permanently strands the record in `Provisioning`
- **Severity:** Critical
- **Module:** Provisioning
- **Description:** `beginProvisioning` never accepts `Provisioning` as a valid source status for any transition, so once a record enters that state, a retry after a crash always gets `409`. There is no watchdog, no staleness detector, and — unlike the Director subsystem's `recoveryBootstrap.ts`, wired into `instrumentation.ts:40-41` — no startup reconciliation pass for Initiation records stuck mid-provisioning.
- **Root Cause:** Provisioning is fully synchronous within the request (see PRA-P1-016) with no persisted "resumable" checkpoint and no recovery hook analogous to the one the Director loop has.
- **Risk:** A single timeout or process restart during provisioning permanently strands the initiation; the only stated exit is `/cancel`, which archives the whole reserved project — the operator loses the project slug and must start over.
- **Recommended Fix:** Add a startup/periodic reconciliation pass that detects initiations stuck in `Provisioning` past a timeout and either resumes or fails them cleanly back to a retryable state, mirroring the Director's recovery pattern.
- **Priority:** Critical

### PRA-P1-016 — Provisioning is fully synchronous and blocking within the HTTP request
- **Severity:** High
- **Module:** Provisioning
- **Description:** `initiationProvisioningService.ts`'s `runProvisioning` executes entirely inside the request lifecycle with no async handoff, job record, or lock of its own.
- **Root Cause:** No background-job pattern was applied to this stage, unlike execution/release which at least have some notion of a running job.
- **Risk:** Directly causes PRA-P1-015 under a large programme or a serverless function time limit; also means the HTTP client must stay connected for the full duration.
- **Recommended Fix:** Move provisioning onto the same kind of durable, resumable background job pattern used for Director execution.
- **Priority:** High

---

## 7. Executive Go/Hold (Initiation)

**Reviewed and passed:** This gate mirrors the Risk Gate's solid governance pattern — decisions are append-only, timestamped, attributed, and have real event subscribers (SSE, Metrics, Certification). No distinct new defect was found beyond the cross-cutting items already listed (PRA-P1-002 actor attribution, PRA-P1-014 decision-dedup).

*(Note: "Executive Go/Hold" for **Release Management** is a separate decision gate, audited in Section 10 — see PRA-P1-022, the most severe finding in this entire audit.)*

---

## 8. Engineering Inbox

**Reviewed and passed:** Batch-scoped inbox items are correctly de-duplicated by `(project, batchId, reasonType)` (`engineeringInboxStore.ts:39-58`, the DEF-002 fix) — re-raising the same blocker before resolution reopens the same row rather than creating a duplicate. Single-writer discipline via the file lock is correct throughout.

### PRA-P1-017 — A raw status-patch API route bypasses every lifecycle guard
- **Severity:** High
- **Module:** Engineering Inbox / Engineering Execution
- **Description:** `app/api/dev/director/status/route.ts:26-36` accepts an arbitrary `{project, patch}` body and calls `patchDirectorStatus` directly — including `state` — with no call to `acquireLoopOwnership` and none of the guards in `pauseServerDirector`/`resumeServerDirector`. It is gated only by owner auth; no current UI component calls it, but it is live and reachable.
- **Root Cause:** A generic status-patch route was exposed alongside the purpose-built, guarded start/pause/resume/cancel routes, with no restriction on which fields it may set.
- **Risk:** A single authenticated call can set `state: 'Running'` for a project without the loop ever actually acquiring ownership — a self-inflicted "Running but nobody is running it" zombie, only ever revisited at the next server restart.
- **Recommended Fix:** Remove this route if unused, or restrict its patchable fields to genuinely safe, non-lifecycle metadata.
- **Priority:** High

### PRA-P1-018 — Resolving/dismissing *any* Open inbox item unconditionally resumes that project's execution
- **Severity:** High
- **Module:** Engineering Inbox
- **Description:** The resolve/dismiss route (`app/api/dev/director/inbox/[id]/route.ts:33-36`) calls `resumeServerDirector(item.project)` unconditionally, without checking whether the resolved item is the one actually recorded in `DirectorRuntimeStatus.waitingInboxItemId`. Combined with the fact that project-level items (`batchId: null` — Release/Rollback/Incident) are never deduplicated (unlike batch-scoped items), a stale or unrelated Open item can exist alongside the real gating item.
- **Root Cause:** Resolve/dismiss actions are wired to "resume the project," not "resume the project if this was the reason it was paused."
- **Risk:** A CEO resolving the wrong (stale, unrelated) Open item for a project still triggers a resume — a false "approval" signal that can cause the loop to retry a batch whose actual blocker (e.g. a Quality Assurance failure, which `findPreflightBlocker` does not check) was never addressed.
- **Recommended Fix:** Only resume when the resolved/dismissed item's ID matches the project's current `waitingInboxItemId`; otherwise resolve/dismiss the item without touching execution state.
- **Priority:** High

### PRA-P1-019 — Project-level inbox items (Release/Rollback/Incident) are never de-duplicated
- **Severity:** Medium
- **Module:** Engineering Inbox
- **Description:** The dedup key used for batch-scoped items is deliberately not applied to `batchId: null` items (`engineeringInboxStore.ts:33-37`'s own comment: "intentionally left alone").
- **Root Cause:** No alternative dedup key (e.g. release ID, incident ID) was substituted for these item types.
- **Risk:** If Release Management or Operations re-raises the same Release Go/Hold or Incident notice before the existing item is resolved, a duplicate Open item is created every time — the same class of bug DEF-002 fixed for batches, left open here, and compounding PRA-P1-018's "resolve the wrong item" risk.
- **Recommended Fix:** Apply a dedup key scoped to the underlying release/incident ID for these item types.
- **Priority:** Medium

### PRA-P1-020 — `cancelServerDirector` has no terminal-state guard
- **Severity:** Low/Medium
- **Module:** Engineering Execution
- **Description:** `cancelServerDirector` (`serverExecutionLoop.ts:796-799`) cancels unconditionally, with no check that the project isn't already `Completed`.
- **Root Cause:** Deliberately unconditional by design (confirmed by existing test comments), but never extended with a terminal-state exception.
- **Risk:** Cancelling an already-`Completed` project silently regresses it to `Cancelled`, discarding `completedAt`/final state — untested, low likelihood but a real data-integrity regression if triggered from the UI.
- **Recommended Fix:** Add a no-op guard when `state === 'Completed'`.
- **Priority:** Low/Medium

### PRA-P1-021 — Orphaned Open inbox items for a cancelled project are never auto-dismissed
- **Severity:** Low
- **Module:** Engineering Inbox
- **Description:** Cancelling a project never touches its Open inbox items; they remain visible indefinitely in the Global Inbox.
- **Root Cause:** No project-liveness check anywhere in the inbox store.
- **Risk:** Currently accidentally safe (resuming a `Cancelled` project is a no-op), but a real UX/data-hygiene gap and not an explicit guard.
- **Recommended Fix:** Auto-dismiss a project's Open inbox items on cancellation.
- **Priority:** Low

---

## 9. Engineering Execution (Director Runtime Loop)

**Reviewed and passed:** `patchDirectorStatus` is the sole state mutator and every legitimate call site goes through it with correct guards; Start/Pause/Resume are idempotent and proven by `directorStateMachine.test.ts`; the crash-mid-batch recovery path (`recoverActiveDirectorsOnStartup` → stale-pid reclaim → forced Live Knowledge Refresh) is real and proven by `recoveryBootstrap.test.ts`/`directorLock.test.ts`; the loop is not unconditionally infinite (bounded polling, exits on every terminal condition); no deadlock exists between the Director lock and the Scheduler's own lock (independent files, non-blocking acquisition).

### PRA-P1-022 — No per-process concurrency cap across simultaneously-running projects
- **Severity:** Medium
- **Module:** Engineering Execution
- **Description:** `recoverActiveDirectorsOnStartup` fires a loop for every recoverable project with no throttling, and `startServerDirector` similarly fire-and-forgets per project.
- **Root Cause:** No configured ceiling on concurrent project loops in a single process.
- **Risk:** At scale (many projects started/recovered simultaneously), each running its own real build/typecheck verification concurrently in the same `process.cwd()`, this is a resource-starvation risk (CPU/memory contention, git worktree contention) rather than a correctness bug.
- **Recommended Fix:** Add a configurable concurrency ceiling with queuing for projects beyond it.
- **Priority:** Medium

### PRA-P1-023 — Stale-lock reclaim is proven only via a synthetic dead-PID file, not a genuinely killed process
- **Severity:** Medium (test-coverage gap, not a code defect)
- **Module:** Engineering Execution
- **Description:** `crossProcessLock.test.ts` stress-tests raw file-lock read/write correctness across real OS processes, but never spawns a second process that holds `directorLock`'s loop-ownership file and then dies. The actual "dead process reclaim" path is proven only via `directorLock.test.ts`/`recoveryBootstrap.test.ts`, which fabricate a dead PID by writing a file rather than killing a real process.
- **Root Cause:** The existing "real multi-process" test suite targets a different primitive than the one that matters for recovery.
- **Risk:** The single most safety-critical recovery path (reclaiming a lock from a genuinely crashed process) has a gap between what's proven and what's claimed as proven.
- **Recommended Fix:** Add a test that spawns a real child process holding `directorLock`, kills it, and asserts a subsequent process reclaims the lock.
- **Priority:** Medium

---

## 10. Quality Assurance

**Reviewed and passed:** Batch-level QA is a genuine, hard gate — `serverExecutionLoop.ts:429-452` runs real verification and `pause()`s on any failure via `findPostExecutionIntervention` before a batch can progress toward `Complete`. This is solid, structural enforcement, not advisory display.

### PRA-P1-024 — No re-verification that QA actually passed at release-preparation time
- **Severity:** Medium
- **Module:** Quality Assurance / Release Management
- **Description:** `runReleasePreparation` (`releaseManagementRunners.ts:55-78`) only reports a verification *count*, never whether the most recent verification passed — unlike `executeRelease`, which explicitly re-checks the Go decision as "defense in depth, not just trusting the caller."
- **Root Cause:** QA enforcement for release preparation is entirely upstream/structural (a batch can only be `Complete` if it passed QA in the loop) with no local re-check.
- **Risk:** Currently unreachable given today's code paths (every `Complete` batch did pass QA to get there), but there is no safety net if a batch's status is ever set `Complete` through any other path (a future migration, a manual planning-state edit).
- **Recommended Fix:** Add an explicit re-check of the most recent verification result before preparing a release, matching the defense-in-depth pattern already used at execution time.
- **Priority:** Medium

---

## 11. Release Management

This is the **weakest subsystem in the audit** — solid low-level mechanics (real git operations, a genuine pre-execution Go-decision re-check) sitting underneath a stack of Critical/High governance and recovery gaps.

**Reviewed and passed:** `executeRelease`'s re-check of `decisions.some(d => d.decision === 'Go')` before running the mutating git/gh/deploy sequence is real and correctly prevents double-execution once one request wins the status CAS. Certification records (`FeatureCertification`) are immutable with no revoke path — a certified result cannot be silently changed after the fact.

### PRA-P1-025 — A crash mid-execution leaves the release permanently stuck in `Releasing`
- **Severity:** Critical
- **Module:** Release Management
- **Description:** `executeRelease` is invoked fire-and-forget (`void executeRelease(...)`, `releaseManagementService.ts:255`) with no lock, no job record, and no recovery hook of its own. By the time it runs, the project's Director state is already `Completed`, so `recoverActiveDirectorsOnStartup` — which only re-attempts `Running`/`Planning` projects — will never revisit it. No code anywhere reads or reconciles a `Releasing` status left over from a crash.
- **Root Cause:** Release execution has none of the recovery infrastructure the Director loop has, despite performing real, stateful, external operations (git commit/push, PR creation, deploy).
- **Risk:** A crash during a real git/deploy sequence leaves the release permanently stuck with no operator-visible signal and no automatic remediation — silent, high-stakes, and specifically the class of failure this codebase's own recovery philosophy elsewhere exists to prevent.
- **Recommended Fix:** Persist a release-execution job record analogous to the Director's `ExecutionSnapshot`, and add it to a startup reconciliation pass that detects and either resumes or clearly fails-out any release stuck in `Releasing`.
- **Priority:** Critical

### PRA-P1-026 — Concurrent Go/Hold decisions are both durably recorded even though only one takes effect
- **Severity:** High
- **Module:** Release Management
- **Description:** `submitReleaseControlDecision` (`releaseManagementService.ts:220-257`) checks `current.status !== 'Prepared'` outside any lock, then unconditionally appends a `ReleaseControlDecision` record before performing the actual CAS-guarded status transition. Two concurrent submissions (double-click, or two executives) that both read `'Prepared'` will both get a permanent decision record appended, even if they disagree (`Go` vs `Hold`) — only the first to acquire the lock actually changes status.
- **Root Cause:** The audit-record append is not itself gated by the same CAS that gates the status transition.
- **Risk:** The permanent governance record shows multiple submitted decisions with no indication of which one "won" or why the other had no effect — a real traceability defect on the system's highest-stakes decision.
- **Recommended Fix:** Perform the status CAS and the decision append atomically inside the same lock, and mark a losing decision as superseded/rejected in its own record.
- **Priority:** High

### PRA-P1-027 — The API response for a rejected decision can show stale status
- **Severity:** High
- **Module:** Release Management
- **Description:** When the CAS in `submitReleaseControlDecision` fails, the function returns the pre-mutation `current` snapshot rather than re-reading the actual (changed) state, so the HTTP response can claim the release is still `Prepared` when it has already moved to `Releasing`/`Held`.
- **Root Cause:** The fallback return value on a failed CAS was never updated to re-fetch current state.
- **Risk:** The caller/UI is directly misled by the API response itself, not just by a background race.
- **Recommended Fix:** On a CAS failure, re-read and return the actual current record rather than the stale pre-mutation snapshot.
- **Priority:** High

### PRA-P1-028 — `patchDirectorStatus(Completed)` commits before `prepareRelease()`'s try/catch
- **Severity:** Medium
- **Module:** Release Management
- **Description:** `serverExecutionLoop.ts:256` marks the project `Completed` before calling `prepareRelease()` (lines 286-295 wrap the latter in try/catch, not the former).
- **Root Cause:** The two operations are not committed atomically, and `Completed` is set first.
- **Risk:** A crash between those two statements marks the project Completed with no `ReleaseRequest` ever created — and recovery won't retry it, since the state is no longer `Running`/`Planning`. A release can silently never be prepared.
- **Recommended Fix:** Either prepare the release before flipping to `Completed`, or add release-preparation to the same reconciliation pass recommended in PRA-P1-025.
- **Priority:** Medium

### PRA-P1-029 — No structural duplicate-guard on release creation
- **Severity:** Medium
- **Module:** Release Management
- **Description:** `prepareRelease` always inserts a fresh record with a new UUID — there is no check for an existing `Prepared`/`Releasing` release for the same project, unlike `certificationClassifier.ts:71`'s explicit duplicate guard for certifications.
- **Root Cause:** No "one active release per project" invariant enforced at write time.
- **Risk:** Nothing in the audited paths currently double-calls this, but there is no structural protection if a future caller does.
- **Recommended Fix:** Add an explicit guard rejecting a new `prepareRelease` while one is already `Prepared`/`Releasing` for the project.
- **Priority:** Medium

### PRA-P1-030 — Certification criteria changes have no actor attribution or audit history
- **Severity:** Medium
- **Module:** Release Management (Certification)
- **Description:** `PATCH`/`DELETE /api/dev/certification/criteria/[id]` change or remove the thresholds that decide future certifications, with no `currentDevActor()` call anywhere in these routes (unlike the release decision route) and no history store for criteria changes — only `updatedAt` is recorded, with old values simply overwritten.
- **Root Cause:** The certification-criteria routes were never brought up to the same governance standard as release/risk-gate decisions.
- **Risk:** Certification thresholds (e.g. `maxInterventionsForAutonomous`) could be silently lowered right before a batch of features certifies, with zero trail of who did it or what the prior value was.
- **Recommended Fix:** Attribute criteria changes to `currentDevActor()` and append (rather than overwrite) a history of prior values.
- **Priority:** Medium

### PRA-P1-031 — Deleted test coverage for exactly these failure modes
- **Severity:** Critical
- **Module:** Release Management
- **Description:** `tests/dev/director/_releaseManagementVerification.test.ts` (224 lines, `git status` shows staged-then-deleted, never committed) covered: successful `prepareRelease` against a real git fixture; a blocked release correctly refusing to execute even with a Go recorded (the exact guard relevant to PRA-P1-026/027); a genuine execution failure producing `ReleaseFailed` + inbox item + permanent history entry; a full successful execution against a real local git repo and a faked `gh`; and `executeDeploymentVerification`'s real HTTP round-trip. No other test file in the repository exercises `releaseManagementService`/`Runners`/`Store` at all.
- **Root Cause:** Unknown — the file was staged and then removed from the working tree without replacement.
- **Risk:** The subsystem with this audit's highest concentration of Critical/High findings currently has **zero automated test coverage**, and specifically lost the one test that directly asserted "a Go recorded against a blocked release must never execute the mutating sequence."
- **Recommended Fix:** Restore the file from the git index (`git show :tests/dev/director/_releaseManagementVerification.test.ts > tests/dev/director/_releaseManagementVerification.test.ts`) and confirm intent with whoever deleted it before any further Release Management changes are made.
- **Priority:** Critical — restore before touching this subsystem further.

---

## 12. Executive Go/Hold for Release — the most severe single finding in this audit

### PRA-P1-032 — The only UI action available for a Release Go/Hold decision does not call the decision endpoint
- **Severity:** Critical
- **Module:** Release Management × Engineering Inbox × Executive Command Centre / Executive UX
- **Description:** `app/api/dev/director/[project]/release/[releaseId]/decision/route.ts`'s own header comment states it is "the only route through which a human can submit a real Release Go/Hold decision." When a release is prepared, `releaseManagementService.ts:172-180` creates an Engineering Inbox item with `reasonType: 'Release Go/Hold Required'` and `recommendedAction: 'Review the prepared release and record a Go or Hold decision.'`. But every place a CEO can act on an inbox item — `GlobalEngineeringInboxView.tsx:230-235` and `LiveEngineeringCommandCentre.tsx:329-334` — wires "Approve"/"Reject" to the **generic** `resolveEngineeringInboxItem`/`dismissEngineeringInboxItem` calls, which only change the inbox item's own status and (per PRA-P1-018) call `resumeServerDirector`. Neither ever calls the release decision endpoint. A dedicated search across every component in `components/dev/` confirms **no component anywhere** references the release-decision route, the `ReleaseControlDecision` type, or a Go/Hold submission UI — the only other release-related component found (`ReleasesLog.tsx`) is a wholly unrelated, pre-existing manual "log a shipped release" form built on a different data model (`lib/dev/releasesStorage.ts`), with no connection to `releaseManagementService.ts`.
- **Root Cause:** The Release Go/Hold decision was built with a real, well-governed backend (append-only, timestamped, attributed, with a defense-in-depth re-check before execution) but no corresponding presentation layer was ever wired to it — the Inbox notification that announces it exists, but pressing its only available buttons never reaches the decision it exists to make.
- **Risk:** This is the clearest possible Executive UX failure: a CEO clicking "Approve (Resolve & Resume)" on a "Release Go/Hold Required" item **believes they have approved the release**. In reality, the inbox item is marked Resolved, the director loop resumes (harmlessly, since the project is already `Completed`), and the `ReleaseRequest` silently remains `Prepared` forever — the release **never executes**, with no error, no warning, and no indication anywhere that the intended action didn't happen.
- **Recommended Fix:** Either (a) build a dedicated Release Decision panel/modal (mirroring `InitiationRiskGatePanel.tsx`'s excellent pattern: plain-language summary, required reason, visible decision history) that calls the real decision endpoint and is reachable from the Inbox item and the Executive Command Centre, or (b) special-case the Inbox's resolve/dismiss actions for `reasonType === 'Release Go/Hold Required'` to open that panel instead of doing a generic resolve. Do not ship the current state, where the buttons appear to work but do nothing release-related.
- **Priority:** Critical — this should be the first fix made after this audit is approved.

---

## 13. Operations, Scheduler, Escalation, Notifications (Background Services & Event Architecture)

**Reviewed and passed:** Locking discipline is fully consistent across Scheduler, Escalation, and the newer Operations module — all wrap their cycles in the same `withFileLock` primitive used by the Director. No infinite loops (bounded, `unref()`'d intervals); no starvation (an unbounded staleness-bonus term guarantees eventual scheduling); no deadlock with the Director's lock (independent lock files, non-blocking acquisition). All three bootstraps correctly recompute eligibility from durable state on restart rather than trusting an in-memory queue, so no scheduled job is lost to a crash. No project hard-delete path exists, so no orphaned delivery/escalation/notification records are currently possible.

**Event Architecture map** (full cross-cutting review): every declared category in `eventTypes.ts` has at least the generic SSE/poll dashboard subscriber, plus dedicated subscribers for Metrics and Certification on the categories relevant to them. No orphaned publish, no missing subscription, and no circular publish chain was found anywhere in the codebase.

### PRA-P1-033 — Operations/Incident lifecycle never publishes events
- **Severity:** Medium
- **Module:** Operations
- **Description:** Incident opened/refreshed/resolved and Rollback Go/Hold decisions in `operationsMonitoringService.ts` never call `publish()`, unlike every other producer module reviewed.
- **Root Cause:** The Operations module (newest of those audited) was not wired to the event bus.
- **Risk:** Real-time dashboards (Live Command Centre, Metrics) have no live signal for Operations incidents — an operator must poll/refresh to see a change.
- **Recommended Fix:** Add a `publish()` call on each Operations state transition, declaring a category in `eventTypes.ts` if one doesn't already fit.
- **Priority:** Medium

### PRA-P1-034 — Duplicate notification delivery possible on retry after a crash
- **Severity:** Medium
- **Module:** Notifications
- **Description:** `deliveryQueue.ts`/`deliveryBootstrap.ts` can re-attempt a delivery whose original send actually succeeded, if the crash happens between the provider call succeeding and the status being persisted. Already partially documented in-code as a known tradeoff.
- **Root Cause:** No idempotency key is passed to any transport (SMTP, Resend, WhatsApp Cloud API, Twilio).
- **Risk:** A recipient may receive the same notification twice after a crash-and-restart during delivery.
- **Recommended Fix:** Where the provider supports it, pass a deterministic idempotency key; otherwise, accept and document this as a "prefer duplicate over lost" tradeoff explicitly.
- **Priority:** Medium

### PRA-P1-035 — Escalation state on a reopened inbox item never resets
- **Severity:** High
- **Module:** Escalation
- **Description:** `escalationStateStore.ts`'s `startMonitoring` treats "a record already exists" as fully idempotent regardless of its status. The DEF-002 reopen path in `engineeringInboxStore.ts` reuses the same inbox item ID when a batch-level condition recurs after being marked Resolved, but the associated escalation record is never reset out of `Resolved`/`Cancelled`.
- **Root Cause:** Escalation state and inbox-item reopen logic were built independently and never cross-checked.
- **Risk:** A recurring blocker that was previously resolved and escalated will **silently never escalate again** on recurrence — the exact scenario escalation exists to catch.
- **Recommended Fix:** On inbox-item reopen, reset the associated escalation record's status so it can escalate again on its normal schedule.
- **Priority:** High

### PRA-P1-036 — Metrics snapshot service has an unlocked read-then-write race
- **Severity:** Low
- **Module:** Operations (Metrics)
- **Description:** `snapshotService.ts` reads then writes without the file lock used everywhere else in this subsystem.
- **Root Cause:** Not migrated onto the shared locked-store pattern.
- **Risk:** Low-likelihood lost snapshot under concurrent metrics writes; Metrics is an observability surface, not a governance one, so the blast radius is small.
- **Recommended Fix:** Route through the locked store primitive for consistency.
- **Priority:** Low

---

## 14. Executive Command Centre & Executive/Engineering UX

**Reviewed and passed (genuine strengths worth preserving as the model for fixes elsewhere):**
- `InitiationRiskGatePanel.tsx` is an excellent Executive UX reference: plain-language decision hints for each option, a required "reason, recorded permanently" field, and a visible governance history showing decision/actor/timestamp/reason for every past call.
- `ExecutiveCommandCentre.tsx` surfaces Build/Git/Deployment/Risk/Technical-Debt/Dependency state in plain executive language with an explicit "Executive Decision" callout, rather than raw technical status.
- Engineering-facing surfaces (`EngineeringAssessmentPanel.tsx`, the `EvidencedValue`/`EngineeringFinding` types throughout) consistently carry evidence and a recommendation alongside every score or finding — a CEO or engineer is never shown a bare number with no way to see why.
- `DevBadge`/`devValidationTone`/`devReadinessTone` give consistent, honest visual language (green/amber/red mapped identically everywhere) rather than ad hoc styling per page.

### PRA-P1-037 — The Engineering Inbox gives no visual indication of which Open item, if any, is actually gating a project
- **Severity:** Medium
- **Module:** Executive Command Centre / Engineering Inbox
- **Description:** `GlobalEngineeringInboxView.tsx` and the per-project inbox list every Open item identically, with no indicator of whether a given item corresponds to the project's current `waitingInboxItemId` (i.e., the thing actually blocking it) versus an older, unrelated, still-open item for the same project.
- **Root Cause:** The UI renders every Open item with the same visual weight and the same "Approve/Reject" affordance.
- **Risk:** Compounds PRA-P1-018 — a CEO has no way to tell, just by looking, that resolving a given item is (or isn't) what will actually resume that project, making the wrong-item-resolved scenario easy to trigger by mistake.
- **Recommended Fix:** Visually flag the item matching the project's current `waitingInboxItemId` (e.g. "This is currently blocking execution") and distinguish it from informational/stale Open items.
- **Priority:** Medium

### PRA-P1-032 (restated) — see Section 12
The single Critical UX finding of this audit — a button that appears to approve a release but does not — is filed under Release Management above and is the top priority fix.

---

## Remaining Production Blockers (must close before unattended, real-stakes operation)

1. **PRA-P1-032** — Release Go/Hold has no functioning UI path at all.
2. **PRA-P1-031** — Release Management has zero test coverage after a deleted suite.
3. **PRA-P1-008** — Plan approval can bypass validation via direct API call.
4. **PRA-P1-003** — Assessment/Director-Assessment file collision corrupts shared history.
5. **PRA-P1-025** — A crashed release execution is permanently and silently stuck.
6. **PRA-P1-015** — A crashed/timed-out provisioning run is permanently and silently stuck.

Everything else in this document is High/Medium/Low hardening work that should follow, not precede, closing the six items above.

## Recommended Implementation Order

1. Restore `tests/dev/director/_releaseManagementVerification.test.ts` from the git index (near-zero cost; restores a safety net before touching anything else in Release Management). **[PRA-P1-031]**
2. Build the Release Go/Hold decision UI (or special-case the Inbox resolve action) so the existing, well-built backend is actually reachable. **[PRA-P1-032]**
3. Add server-side re-validation to the Planning PATCH route so `Approved` can only be reached through the real invariant check. **[PRA-P1-008]**
4. Resolve the Assessment/Director-Assessment filename collision (rename one store, add a shared filename registry). **[PRA-P1-003]**
5. Add locking to `assessmentRepository.ts` and `planningRepository.ts`. **[PRA-P1-004, PRA-P1-010]**
6. Add a stuck-state reconciliation pass for Provisioning and Release Execution, mirroring the Director's `recoveryBootstrap.ts`. **[PRA-P1-015, PRA-P1-025, PRA-P1-028]**
7. Fix Release decision concurrency (atomic CAS + append, correct response on CAS failure). **[PRA-P1-026, PRA-P1-027]**
8. Remove or lock down the raw `/api/dev/director/status` PATCH route. **[PRA-P1-017]**
9. Tie Inbox resolve/dismiss to the project's actual `waitingInboxItemId`, and visually flag it in the UI. **[PRA-P1-018, PRA-P1-037]**
10. Add dedup for project-level inbox items and reset escalation state on inbox-item reopen. **[PRA-P1-019, PRA-P1-035]**
11. Add actor/timestamp attribution to Plan approvals and Certification criteria changes. **[PRA-P1-009, PRA-P1-030]**
12. Remaining Medium/Low items (concurrency ceiling, event completeness for Operations, notification dedup, snapshot-service locking, minor guards) as a follow-up hardening pass.

---

*This document is an audit only. No fixes have been implemented. Awaiting review and approval before any remediation work begins.*
