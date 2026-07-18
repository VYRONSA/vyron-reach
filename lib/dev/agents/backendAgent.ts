import { buildAgentOutput, predictFilesForDomain } from './agentSupport'
import type { AgentDecision, AgentInput, AgentOutput } from './agentTypes'

/**
 * Backend Agent — APIs/business logic/services/runtime/integrations.
 * Scoped to Code and Build findings whose location falls under this
 * agent's domain (app/api/, lib/dev/runtime/, lib/dev/operations/,
 * *Engine.ts, *Storage.ts), plus any Build finding regardless of
 * location (a failing build blocks backend work by definition).
 */
export function evaluateBackend(input: AgentInput): AgentOutput {
  const start = Date.now()
  const filesModified = predictFilesForDomain('Backend', input.context)
  const relevant = input.report.findings.filter(f => f.module === 'Build' || (f.module === 'Code' && f.location && /Engine\.ts$|Storage\.ts$|^app\/api\/|^lib\/dev\/(runtime|operations)\//.test(f.location)))

  const decisions: AgentDecision[] = [
    {
      decision: relevant.some(f => f.severity === 'Critical') ? 'Blocked' : 'Clear to implement',
      reason: relevant.length > 0 ? `${relevant.length} backend-relevant finding(s) outstanding.` : 'No backend-relevant findings outstanding.',
    },
  ]

  return buildAgentOutput(
    'Backend',
    relevant,
    filesModified,
    `${relevant.length} backend-relevant finding(s) reviewed across Build/Code Intelligence.`,
    decisions,
    start
  )
}
