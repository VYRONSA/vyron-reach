import { resolveAgentConflict } from '../engineeringDirector'
import type { ExecutiveEngineeringReport } from '../../intelligence/engineeringIntelligenceEngine'
import type { EngineeringFinding, EngineeringModule, FindingSeverity } from '../../intelligence/types'
import type { WorkforceTask, WorkforceConflict } from './workforceTypes'
import type { EngineeringAssessment } from '../assessment/assessmentTypes'

/**
 * Conflict detection and resolution — "If multiple workers produce
 * overlapping work: the Director performs conflict analysis... The
 * Director decides which output is accepted," explicitly reusing "the
 * existing Engineering Director strategic layer" rather than replacing
 * it. resolveAgentConflict (lib/dev/director/engineeringDirector.ts) is
 * called completely unmodified — the same function the browser-attended
 * Multi-Agent Workforce already escalates to when specialist agents
 * disagree (see agentWorkforce.ts).
 */

/** Overlapping file changes between the newly completed task and any earlier task in the same run — the Director's own trigger for conflict analysis, since two workers touching the same file is exactly what "overlapping work" means in a filesystem-level sense. */
export function detectWorkforceConflict(
  newTask: WorkforceTask,
  newFilesChanged: NonNullable<WorkforceTask['filesChanged']>,
  recentTasks: WorkforceTask[]
): WorkforceConflict | null {
  const newFiles = new Set([...newFilesChanged.created, ...newFilesChanged.modified, ...newFilesChanged.deleted])

  for (const prior of recentTasks) {
    if (prior.id === newTask.id || !prior.filesChanged) continue
    const priorFiles = [...prior.filesChanged.created, ...prior.filesChanged.modified, ...prior.filesChanged.deleted]
    const overlappingFiles = priorFiles.filter(f => newFiles.has(f))
    if (overlappingFiles.length > 0) {
      return {
        task: newTask,
        conflictingTask: prior,
        overlappingFiles,
        description: `Task ${newTask.id} (${newTask.requiredRole}) and task ${prior.id} (${prior.requiredRole}) both changed: ${overlappingFiles.join(', ')}.`,
        resolution: '',
      }
    }
  }
  return null
}

/**
 * Hands the detected conflict to resolveAgentConflict, backed by a
 * minimal, honestly-derived ExecutiveEngineeringReport built from the
 * Assessment Service's own Critical/High signals (see
 * buildMinimalEngineeringReport below) rather than the browser-attended
 * AI-generated report that function was originally paired with — the
 * headless Director has no such report to hand it, and fabricating one
 * with invented findings would be worse than deriving a real, if
 * narrower, one from durable Assessment Service state. Only the two
 * fields resolveAgentConflict actually reads (criticalIssues/highIssues)
 * carry real derived data; every other field of the report type is a
 * neutral, unused-for-this-call placeholder (see that function below).
 */
export function resolveWorkforceConflict(conflict: WorkforceConflict, assessment: EngineeringAssessment): WorkforceConflict {
  const report = buildMinimalEngineeringReport(assessment)
  const resolution = resolveAgentConflict(conflict.description, report)
  return { ...conflict, resolution }
}

function gateFinding(module: EngineeringModule, severity: FindingSeverity, title: string, detail: string): EngineeringFinding {
  return { module, category: 'Assessment Service', severity, title, evidence: detail, location: null, recommendation: `Resolve: ${title}.` }
}

/**
 * Only `findings`/`criticalIssues`/`highIssues` are real, Assessment-Service-derived
 * data — everything else on ExecutiveEngineeringReport is a neutral
 * placeholder never read by resolveAgentConflict, present only because
 * the shared type requires every field. This is not a fabricated
 * headless "Engineering Intelligence Report" — it's the minimal honest
 * subset that function's actual logic depends on.
 */
function buildMinimalEngineeringReport(assessment: EngineeringAssessment): ExecutiveEngineeringReport {
  const findings: EngineeringFinding[] = []

  for (const gate of assessment.qualityGates.gates) {
    if (gate.status !== 'Failing') continue
    const module: EngineeringModule = gate.gate === 'Build Status' ? 'Build' : gate.gate === 'TypeScript Status' ? 'Code' : 'Quality'
    const severity: FindingSeverity = gate.gate === 'Build Status' || gate.gate === 'TypeScript Status' || gate.gate === 'Execution Health' ? 'Critical' : 'High'
    findings.push(gateFinding(module, severity, gate.gate, gate.detail))
  }

  for (const factor of assessment.riskAssessment.factors) {
    if (factor.level !== 'High') continue
    findings.push(gateFinding('Product', 'High', factor.factor, factor.detail))
  }

  return {
    findings,
    criticalIssues: findings.filter(f => f.severity === 'Critical'),
    highIssues: findings.filter(f => f.severity === 'High'),
    mediumIssues: [],
    lowIssues: [],
    engineeringScore: 0,
    overallHealth: 'Fair',
    deliveryRisk: assessment.riskAssessment.overall,
    technicalDebtScore: 0,
    buildHealth: 'Fair',
    repositoryHealth: 'Fair',
    documentationHealth: 'Fair',
    runtimeHealth: 'Fair',
    productCompletion: 0,
    recommendedTask: null,
  }
}
