import { buildAgentOutput, predictFilesForDomain } from './agentSupport'
import type { AgentDecision, AgentInput, AgentOutput } from './agentTypes'

/**
 * Database Agent — Supabase/SQL/migrations/indexes/performance. Scoped
 * directly to Database Intelligence's own findings (migration ordering,
 * missing documentation). Index/query-performance review has no honest
 * source in this system (no live database connection), so it is never
 * claimed — only what Database Intelligence actually found is reported.
 */
export function evaluateDatabase(input: AgentInput): AgentOutput {
  const start = Date.now()
  const filesModified = predictFilesForDomain('Database', input.context)
  const relevant = input.report.findings.filter(f => f.module === 'Database')

  const decisions: AgentDecision[] = [
    {
      decision: relevant.length === 0 ? 'No database changes flagged' : 'Review database findings before proceeding',
      reason: relevant.length === 0 ? 'No Database Intelligence findings outstanding.' : `${relevant.length} database finding(s) outstanding.`,
    },
  ]

  return buildAgentOutput(
    'Database',
    relevant,
    filesModified,
    `${relevant.length} database finding(s) reviewed. Schema drift and index/query performance are not automatically checkable — no live database connection exists in this system.`,
    decisions,
    start
  )
}
