import type { EngineeringFinding } from '../intelligence/types'
import type { DevelopmentContext } from '../runtime/runtimeContextBuilder'
import type { AgentDecision, AgentOutput, AgentRole } from './agentTypes'

/**
 * Which repository areas each agent's domain covers — used two ways:
 * (1) the Project Manager Agent matches these against the selected
 * task's title/description/evidence/href to decide which specialist
 * agents are actually relevant to a given task; (2) each domain agent
 * uses its own patterns to filter which of the previous execution's real
 * touched files fall within its area, for its own filesModified
 * prediction. Agents with no listed patterns (Project Manager, Release
 * Manager) apply to every task by design, not because a pattern matched.
 */
export const DOMAIN_PATTERNS: Partial<Record<AgentRole, RegExp[]>> = {
  Backend: [/^app\/api\//, /^lib\/dev\/runtime\//, /^lib\/dev\/operations\//, /Engine\.ts$/, /Storage\.ts$/],
  Frontend: [/^components\//, /^app\/dev\/.*page\.tsx$/, /\.tsx$/],
  Architect: [/^lib\/dev\//],
  Database: [/^supabase\//, /\.sql$/],
  AI: [/^lib\/dev\/(runtime|director|intelligence|agents)\//, /prompt/i],
  QA: [/\.test\./, /\.spec\./],
  Security: [/auth/i, /security/i, /\.env/],
  Documentation: [/knowledgeData/, /README/i, /\.md$/],
}

export function matchesDomain(role: AgentRole, text: string): boolean {
  const patterns = DOMAIN_PATTERNS[role]
  if (!patterns || !text) return false
  return patterns.some(p => p.test(text))
}

/** Files this agent's domain covers, drawn only from the previous execution's genuinely recorded files — never a guess at what a not-yet-run task will touch. */
export function predictFilesForDomain(role: AgentRole, context: DevelopmentContext): string[] {
  const files = [...(context.previousHandover?.filesCreated ?? []), ...(context.previousHandover?.filesModified ?? [])]
  return files.filter(f => matchesDomain(role, f))
}

const RISK_SEVERITY_TO_CONFIDENCE = (findings: EngineeringFinding[]): AgentOutput['confidence'] => {
  if (findings.some(f => f.severity === 'Critical')) return 'Low'
  if (findings.some(f => f.severity === 'High')) return 'Medium'
  return 'High'
}

/**
 * Shared assembly for every agent's output — no agent file duplicates
 * this shape-building logic. `relevantFindings` must already be the
 * finished, agent-specific selection from report.findings; this function
 * only derives evidence/risks/recommendations/confidence from it, plus
 * measures genuine (if small) elapsed time and records the real cost (0 —
 * no AI call was made).
 */
export function buildAgentOutput(
  role: AgentRole,
  relevantFindings: EngineeringFinding[],
  filesModified: string[],
  summary: string,
  decisions: AgentDecision[],
  startedAt: number
): AgentOutput {
  return {
    role,
    summary,
    evidence: relevantFindings.map(f => f.evidence),
    decisions,
    filesModified,
    risks: relevantFindings.filter(f => f.severity === 'Critical' || f.severity === 'High'),
    recommendations: [...new Set(relevantFindings.map(f => f.recommendation))],
    confidence: RISK_SEVERITY_TO_CONFIDENCE(relevantFindings),
    executionDurationMs: Date.now() - startedAt,
    cost: 0,
  }
}
