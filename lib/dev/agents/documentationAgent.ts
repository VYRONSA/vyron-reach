import { buildAgentOutput, predictFilesForDomain } from './agentSupport'
import type { AgentDecision, AgentInput, AgentOutput } from './agentTypes'

/**
 * Documentation Agent — product documentation/architecture decisions/
 * release notes/knowledge base. Scoped to Documentation Intelligence's
 * own findings (undocumented modules, empty knowledge base sections,
 * missing architecture decisions) — never a judgment on documentation
 * quality beyond what that engine already checks.
 */
export function evaluateDocumentation(input: AgentInput): AgentOutput {
  const start = Date.now()
  const filesModified = predictFilesForDomain('Documentation', input.context)
  const relevant = input.report.findings.filter(f => f.module === 'Documentation')

  const decisions: AgentDecision[] = [
    {
      decision: relevant.length === 0 ? 'Documentation current' : 'Documentation gaps outstanding',
      reason: relevant.length === 0 ? 'No Documentation Intelligence findings outstanding.' : `${relevant.length} documentation finding(s) outstanding.`,
    },
  ]

  return buildAgentOutput(
    'Documentation',
    relevant,
    filesModified,
    `${relevant.length} documentation finding(s) reviewed.`,
    decisions,
    start
  )
}
