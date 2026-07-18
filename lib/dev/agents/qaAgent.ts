import { buildAgentOutput } from './agentSupport'
import type { AgentDecision, AgentInput, AgentOutput } from './agentTypes'

/**
 * QA Agent — validation/regression detection/build verification/
 * TypeScript/runtime verification. Reads Build/TypeScript status
 * directly off the Runtime Context (already composed from Build/Git
 * Intelligence), plus Quality Intelligence's own findings and Runtime
 * Intelligence's regression signals (Recurring Failure/Execution Loop).
 * This is a planning-stage opinion — the authoritative post-apply gate
 * is still the Operations Platform's Quality Gate Engine; this agent
 * doesn't re-implement it, it forms an early view from the same
 * Engineering Report.
 */
export function evaluateQA(input: AgentInput): AgentOutput {
  const start = Date.now()
  const qualityFindings = input.report.findings.filter(f => f.module === 'Quality')
  const regressionFindings = input.report.findings.filter(
    f => f.module === 'Runtime' && (f.category === 'Recurring Failure' || f.category === 'Execution Loop')
  )
  const relevant = [...qualityFindings, ...regressionFindings]

  const buildOk = input.context.buildStatus !== 'Failing'
  const typescriptOk = input.context.typescriptStatus !== 'Failing'
  const blocking = !buildOk || !typescriptOk || relevant.some(f => f.severity === 'Critical')

  const decisions: AgentDecision[] = [
    {
      decision: blocking ? 'Blocked' : 'Clear to proceed',
      reason: `Build: ${input.context.buildStatus}, TypeScript: ${input.context.typescriptStatus}, ${relevant.length} quality/regression finding(s).`,
    },
  ]

  return buildAgentOutput(
    'QA',
    relevant,
    [],
    `Build: ${input.context.buildStatus}, TypeScript: ${input.context.typescriptStatus}. ${relevant.length} quality/regression finding(s) reviewed.`,
    decisions,
    start
  )
}
