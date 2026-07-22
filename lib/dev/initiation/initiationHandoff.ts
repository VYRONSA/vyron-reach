import * as planningStateService from '../planningState/planningStateService'
import { buildServerHandoff } from '../scheduler/serverHandoffBuilder'
import { startServerDirector } from '../director/serverExecutionLoop'
import { getDirectorStatus } from '../director/directorRuntimeStore'
import { isAwaitingExecutiveGoDecision } from './executiveControl'

/**
 * The single, canonical entry point for starting autonomous execution.
 * Every trigger in this app that can bring a project's Director loop out
 * of 'Idle' — the manual "Start Development" route
 * (app/api/dev/director/[project]/handoff/route.ts), the Cross-Project
 * Scheduler (lib/dev/scheduler/schedulerService.ts), and an Executive's
 * Go decision (lib/dev/initiation/executiveControlService.ts) — now calls
 * attemptHandoff() below rather than building its own handoff and calling
 * buildServerHandoff/startServerDirector directly. This is what makes
 * "exactly one authoritative path by which autonomous execution may
 * begin" true structurally: there is exactly one function that actually
 * performs the handoff, and it enforces Executive Go/Hold Control
 * unconditionally, for every caller, with no way to reach
 * startServerDirector from this subsystem without passing through it
 * first. See docs/engineering-director-v1.0/ (unchanged) for
 * startServerDirector/serverExecutionLoop.ts itself, which this
 * deliberately still treats as the one lower-level primitive every path
 * ultimately shares — this file does not duplicate or reimplement it.
 */

/**
 * True once the Director has ever left its initial 'Idle' state for this
 * project — regardless of whether that happened via an Executive's Go
 * decision or the OLD (pre-Executive-Control) unconditional auto-start
 * behavior. Used for reporting ("has this project's execution started?"
 * in executiveControlService.ts's status), NOT as a gate on whether to
 * attempt a handoff — see attemptHandoff's own doc comment for why those
 * are different questions.
 */
export function hasExecutionStarted(project: string): boolean {
  return getDirectorStatus(project).state !== 'Idle'
}

/**
 * Attempts the handoff; returns an error message on failure (including a
 * block by Executive Hold) rather than throwing, so a caller can record
 * it as a non-blocking warning instead of aborting a decision that
 * itself already succeeded. Returns null on success.
 *
 * Two things are checked, in order:
 *  1. isAwaitingExecutiveGoDecision — the Executive Go/Hold gate. This is
 *     the ONLY governance check in the whole pipeline; every caller goes
 *     through it, unconditionally, with no override.
 *  2. Nothing else — startServerDirector's own loop-ownership lock
 *     (acquireLoopOwnership, serverExecutionLoop.ts) is what makes a
 *     redundant call safe, so this function does NOT also pre-check
 *     "already started" itself. That pre-check existed here previously
 *     and was subtly wrong: a project that reached 'Completed' also
 *     reads as "not Idle," which would have made this function silently
 *     refuse to restart a Completed project with newly-added batches —
 *     exactly the case hasAvailableWork()'s own doc comment says the
 *     Scheduler must support. Deferring entirely to the lock (which
 *     correctly no-ops only while a loop is genuinely active, and
 *     correctly proceeds for both Idle and Completed) is what lets this
 *     one function serve every caller's actual needs without
 *     reintroducing that bug.
 */
export function attemptHandoff(project: string): string | null {
  if (isAwaitingExecutiveGoDecision(project)) {
    return 'Blocked by Executive Hold: an Executive Go decision is required before this project can start autonomous execution.'
  }
  try {
    const projectRecord = planningStateService.getProject(project)
    if (!projectRecord) return `Project "${project}" not found.`
    const handoff = buildServerHandoff(projectRecord)
    startServerDirector(handoff)
    return null
  } catch (err) {
    return err instanceof Error ? err.message : 'Handoff failed for an unknown reason.'
  }
}
