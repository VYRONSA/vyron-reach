/**
 * The Headless AI Workforce (Version 2.0 Phase 3, Milestone 3.1) —
 * types. The Engineering Director (lib/dev/director/serverExecutionLoop.ts)
 * remains the single orchestrator and decision-maker; a "Worker" here is
 * a logical role assignment for one batch's execution, not a separate
 * process or a different underlying AI model — this codebase has exactly
 * one real execution mechanism (lib/dev/runtime/runtimeEngine.ts →
 * claudeCodeProvider.ts, one Claude Code CLI subprocess per job), and a
 * worker role only changes how that one mechanism is framed (which
 * responsibilities the prompt asks it to focus on) and how its output is
 * reviewed — never which model or provider runs it. See workerRoles.ts's
 * doc comment for why this is a deliberately separate concept from the
 * pre-existing lib/dev/agents/ "Multi-Agent Workforce" (a pure
 * pre-execution *review* system over an AI-generated report), not a
 * replacement or a merge of it.
 */

export type WorkerRole =
  | 'Architecture Engineer'
  | 'Backend Engineer'
  | 'Frontend Engineer'
  | 'Database Engineer'
  | 'QA Engineer'
  | 'DevOps Engineer'
  | 'Documentation Engineer'

/**
 * Exactly the fields Milestone 3.1's spec requires on every task: Project,
 * Phase, Milestone, Batch, Required role, and the four immutable version
 * values Milestone 2.2/2.3 already established (frozen at assignment time
 * — see engineeringContextVersion.ts — and never recomputed for this
 * task's lifetime), plus the ExecutionIdentity the underlying job runs
 * under.
 */
export type WorkforceTask = {
  id: string
  project: string
  phase: string
  milestoneId: string | null
  batchId: string
  requiredRole: WorkerRole
  executionContextVersion: string
  knowledgeVersion: string
  planningVersion: number
  dnaVersion: string
  runtimeJobId: string | null
  createdAt: string
  /** Set once the task completes (see workforceTaskStore.ts's recordWorkforceTaskCompletion) — the durable record conflictResolution.ts queries for file-overlap detection against later tasks in the same run. Null for a task still in flight. */
  filesChanged: { created: string[]; modified: string[]; deleted: string[] } | null
}

/**
 * Every completed worker task returns exactly this — Milestone 3.1's
 * spec verbatim (Summary/Files changed/Engineering findings/Risks
 * discovered/Technical debt introduced/Recommendations). Built directly
 * from the same ParsedClaudeReport the headless loop already produces
 * (lib/dev/developmentCompletionEngine.ts) — no new report format, no
 * duplicated parsing.
 */
export type WorkerTaskResult = {
  taskId: string
  role: WorkerRole
  summary: string
  filesChanged: { created: string[]; modified: string[]; deleted: string[] }
  engineeringFindings: string[]
  risksDiscovered: string[]
  technicalDebtIntroduced: string[]
  recommendations: string[]
}

export type WorkerReviewDecision = 'Approved' | 'Rejected'

/**
 * The Director's validation verdict on a WorkerTaskResult — "Only
 * validated work updates Planning or Knowledge" means every write this
 * milestone gates (recordBatchCompletion, recordArchitectureDecision,
 * etc.) only happens when decision === 'Approved'.
 */
export type WorkerReviewOutcome = {
  decision: WorkerReviewDecision
  reasons: string[]
}

/**
 * Detected when a worker's file changes overlap with another task
 * completed earlier in the same run — the Director's conflict-analysis
 * trigger (see conflictResolution.ts, which hands the actual resolution
 * to lib/dev/director/engineeringDirector.ts's resolveAgentConflict,
 * explicitly reused rather than reimplemented per the mission).
 */
export type WorkforceConflict = {
  task: WorkforceTask
  conflictingTask: WorkforceTask
  overlappingFiles: string[]
  description: string
  resolution: string
}
