# PRAT-1 DEF-001 — Executive Build Validation Navigation

**Reported symptom:** From the Executive Command Centre, clicking "Run Validation" after a "Build is Failing" indicator navigated to the generic Git & Build page instead of opening the Executive Build Failure Report (DEF-004).

**Outcome:** Real defect, confirmed and fixed. The report exists and is fully implemented — it just wasn't reachable from the two places an Executive actually encounters a build failure first.

---

## Investigation

**Which component renders the "Run Validation" button:** `components/dev/MissionControl.tsx` — the "Today's Executive Action" widget at the top of the Executive Command Centre. Whenever the single highest-priority action (`queue.topAction`) has `category === 'Validation'`, it renders a button literally labeled `RUN VALIDATION`. The same underlying action (without the literal button label) also appears as a list item in the collapsed "Executive Action Queue" (`components/dev/ExecutiveActionQueuePanel.tsx`), rendered further down the same page.

**Which route/action it invoked:** Both were a plain Next.js `<Link href={action.href}>`. `action.href` for a build/TypeScript failure is hardcoded to `'/dev/git-build'` in `lib/dev/executiveActionEngine.ts`'s `buildValidationActions()` — a full page navigation to the Git & Build page (repository metadata only), not the report.

**Why the Executive Build Failure Report was not shown:** It was never referenced by either component. `MissionControl.tsx` had no import of, or awareness of, `ExecutiveBuildFailureReportModal` or `buildExecutiveBuildFailureReport` at all.

**Whether the report exists but is disconnected:** Yes, exactly this. `components/dev/ExecutiveBuildFailureReportModal.tsx` and `lib/dev/executiveBuildFailureTranslator.ts` (DEF-004) are fully implemented, and were already correctly wired to one place — `ExecutiveCommandCentre.tsx`'s own "View Build Report" button, further down the same page, under the "Build" section header. The report was disconnected specifically from the two places an Executive is actually funneled toward a build failure first (Mission Control's primary action, and the Action Queue), not from the page as a whole.

**Whether the wrong navigation target is configured:** Yes — `href: '/dev/git-build'` in `buildValidationActions()` is a real, working link (the Git & Build page genuinely exists and renders correctly), just the wrong target for this specific action.

## Root Cause

`buildValidationActions()` (`lib/dev/executiveActionEngine.ts`) produces the "Build Is Failing"/"TypeScript Is Failing" actions with a generic `href: '/dev/git-build'`, because at the time these actions were authored, `ExecutiveAction` had no concept of "open a report inline" — only "navigate somewhere." When the Executive Build Failure Report was added later (DEF-004), it was wired into `ExecutiveCommandCentre.tsx` directly (a new button, `setShowBuildFailureReport(true)`), but the two components that already existed and already rendered this exact action — `MissionControl.tsx` and `ExecutiveActionQueuePanel.tsx` — were never updated to prefer the new report over their original `href` navigation.

## Requirements Honored

- **Build Intelligence untouched** — `lib/dev/buildIntelligence.ts`, `lib/dev/executiveActionEngine.ts`'s action-generation logic (beyond adding one export), and the Git & Build page are all unchanged.
- **No duplicated diagnostics** — no new report-building logic was written. Both fixed components call the exact same `onOpenBuildFailureReport` callback, which opens the exact same `ExecutiveBuildFailureReportModal` instance, built from the exact same `buildExecutiveBuildFailureReport(build, git)` call, that `ExecutiveCommandCentre.tsx`'s own "View Build Report" button already used.
- **Reuses the DEF-004 report** — directly, via a passed-down callback, not a re-implementation.
- **Graceful fallback preserved** — if a caller renders `MissionControl`/`ExecutiveActionQueuePanel` without wiring `onOpenBuildFailureReport` (or without `build`/`git` intelligence available), both components fall back to the original `<Link href={action.href}>` behavior unchanged — no regression for any other action category (Git, Deployment, Planning, Dependencies, ...), which continue to navigate exactly as before.

## Files Changed

- `lib/dev/executiveActionEngine.ts` — exported `buildValidationActions` (previously private) for direct testing; no logic change.
- `components/dev/MissionControl.tsx` — added optional `onOpenBuildFailureReport` prop; the `RUN VALIDATION` button now calls it (when provided and `topAction.category === 'Validation'`) instead of navigating via `Link`.
- `components/dev/ExecutiveActionQueuePanel.tsx` — added optional `onOpenBuildFailureReport` prop; any action with `sourceEngine === 'Build Intelligence'` now renders as a button calling it instead of a `Link`, when provided.
- `components/dev/ExecutiveCommandCentre.tsx` — passes `onOpenBuildFailureReport={buildFailureReport ? () => setShowBuildFailureReport(true) : undefined}` to both components — the same state/modal its own "View Build Report" button already used.

## Workflow Now

```
Build Failure  →  Run Validation  →  Executive Build Failure Report  →  Recommended Action  →  Return to Command Centre
```

`RUN VALIDATION` (Mission Control) or the "Build Is Failing"/"TypeScript Is Failing" item (Action Queue) opens `ExecutiveBuildFailureReportModal` in place, as an overlay — the modal already displays "Recommended Engineering Action" and an "AI Engineering Recommendation," and its "Close" button dismisses the overlay, returning to the still-underneath, never-navigated-away-from Command Centre.

## Tests Added

`tests/dev/executiveActionEngine.test.ts` (new — this file had zero prior test coverage) — 5 tests proving the exact signal (`category: 'Validation'`, `sourceEngine: 'Build Intelligence'`) that both fixed components key off is produced correctly for a build failure, a TypeScript failure, both together, and neither; plus confirms the fallback `href` is still present for callers without the report wired in.

No new component-rendering test was added: this repository has no React/component test infrastructure (no jsdom, no `@testing-library/*`) anywhere, a pre-existing, already-disclosed condition from every prior wave in this engagement — consistent with that precedent, the click→open-modal wiring itself is verified via `tsc --noEmit` (proves the prop/callback wiring type-checks against both components' real signatures) and `npm run build` (proves the pages that render these components compile), not a new test harness. The existing `tests/dev/executiveBuildFailureTranslator.test.ts` (unchanged, 6 tests) already proves the report itself displays real build diagnostics (`buildOutput`, `typescriptDiagnostics`, `eslintDiagnostics`, `filesInvolved`, all asserted with real content) — re-run below to confirm no regression.

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Clean |
| `tests/dev/executiveActionEngine.test.ts` (new) | 5/5 passing |
| `tests/dev/executiveBuildFailureTranslator.test.ts` (existing, unchanged) | 6/6 passing — no regression |
| `npm run build` | Exit 0, no errors |
| Full automated test suite | 971 total tests. Multiple full-suite runs during this session showed the system under heavy, worsening background load (single-file run times climbing from ~2s to 85s+ over consecutive runs); failures were consistently confined to pre-existing, already-documented timing-sensitive tests (`directorStateMachine.test.ts`, `liveKnowledgeRefreshIntegration.test.ts`, `decisionDedup.test.ts`, `recoveryBootstrap.test.ts`, `crossProcessLock.test.ts`, `_releaseManagementVerification.test.ts`, `simulationService.test.ts`) — **none in any file this fix touched**. Both new/touched test files were independently re-run in isolation, alongside the flaky files, and passed cleanly every time. |

No regression was found in anything this fix touched.

---

Stopping here per instruction.
