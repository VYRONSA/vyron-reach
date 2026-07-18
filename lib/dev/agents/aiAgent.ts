import { buildAgentOutput, predictFilesForDomain } from './agentSupport'
import type { AgentDecision, AgentInput, AgentOutput } from './agentTypes'

/**
 * AI Agent — prompt quality/runtime quality/memory/intelligence engines/
 * AI orchestration. Reviews Runtime Intelligence's own findings
 * (recurring failure, execution loop, stalled development, repeated
 * recommendation) plus whether the previous execution actually
 * succeeded — this agent's own domain is this system's runtime, so it's
 * the one place previousExecution is read directly rather than only via
 * the Engineering Report.
 */
export function evaluateAI(input: AgentInput): AgentOutput {
  const start = Date.now()
  const filesModified = predictFilesForDomain('AI', input.context)
  const relevant = input.report.findings.filter(f => f.module === 'Runtime')

  const decisions: AgentDecision[] = []
  if (input.previousExecution?.status === 'Failed') {
    decisions.push({ decision: 'Investigate before retrying', reason: `Previous execution failed: ${input.previousExecution.error ?? 'no error recorded'}.` })
  } else {
    decisions.push({
      decision: relevant.length === 0 ? 'Runtime healthy' : 'Runtime findings outstanding',
      reason: relevant.length === 0 ? 'No Runtime Intelligence findings outstanding.' : `${relevant.length} runtime finding(s) outstanding.`,
    })
  }

  return buildAgentOutput(
    'AI',
    relevant,
    filesModified,
    `${relevant.length} runtime/intelligence finding(s) reviewed. Previous execution status: ${input.previousExecution?.status ?? 'None recorded'}.`,
    decisions,
    start
  )
}
