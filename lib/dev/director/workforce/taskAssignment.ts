import { matchWorkerRoles } from './workerRoles'
import type { WorkerRole } from './workforceTypes'
import type { EngineeringAssessment } from '../assessment/assessmentTypes'

export type WorkerAssignment = {
  role: WorkerRole
  reason: string
}

/**
 * The Director assigns work to the most appropriate worker role —
 * Milestone 3.1 requires this to consider Engineering Health, Risk
 * Level, Quality Gates, Blocked work, and Outstanding CEO decisions
 * (all five, from the Assessment Service — never computed here; see
 * assessmentTypes.ts's own doc comment: "Workers do not compute
 * assessments," and neither does this assignment step — it only reads
 * an already-produced EngineeringAssessment). Priority order, most
 * urgent first: stabilization signals from the Assessment Service
 * outrank whatever the batch's own text happens to suggest, since an
 * unhealthy project should get stabilized before new domain work
 * proceeds; only once nothing urgent is outstanding does the batch's own
 * objective text decide the role via domain-keyword matching.
 */
export function assignWorkerRole(batchText: string, assessment: EngineeringAssessment): WorkerAssignment {
  const failingCoreGates = assessment.qualityGates.gates.filter(
    g => g.status === 'Failing' && (g.gate === 'Build Status' || g.gate === 'TypeScript Status' || g.gate === 'Execution Health')
  )
  if (failingCoreGates.length > 0) {
    return {
      role: 'QA Engineer',
      reason: `Core quality gate(s) failing (${failingCoreGates.map(g => g.gate).join(', ')}) — stabilization takes priority over new work.`,
    }
  }

  const failingIntegrityGates = assessment.qualityGates.gates.filter(
    g => g.status === 'Failing' && (g.gate === 'Planning Consistency' || g.gate === 'Dependency Consistency' || g.gate === 'Completion Consistency')
  )
  if (failingIntegrityGates.length > 0) {
    return {
      role: 'QA Engineer',
      reason: `Data integrity gate(s) failing (${failingIntegrityGates.map(g => g.gate).join(', ')}) — must be resolved before further feature work.`,
    }
  }

  if (assessment.engineeringHealth === 'Critical' || assessment.engineeringHealth === 'At Risk') {
    return { role: 'QA Engineer', reason: `Engineering Health is ${assessment.engineeringHealth} — prioritizing stabilization over new domain work.` }
  }

  const outstandingDecisions = assessment.riskAssessment.factors.find(f => f.factor === 'Outstanding CEO Decisions')
  if (outstandingDecisions?.level === 'High') {
    return {
      role: 'Documentation Engineer',
      reason: 'Multiple outstanding CEO decisions on the Engineering Inbox — prioritizing documentation of pending decisions.',
    }
  }

  const blockedMilestones = assessment.riskAssessment.factors.find(f => f.factor === 'Blocked Milestones')
  if (blockedMilestones?.level === 'High') {
    return { role: 'Architecture Engineer', reason: 'Multiple milestones marked At Risk — prioritizing architectural intervention.' }
  }

  const debtGrowth = assessment.riskAssessment.factors.find(f => f.factor === 'Technical Debt Growth')
  if (debtGrowth?.level === 'High') {
    return { role: 'Architecture Engineer', reason: 'Technical Debt Growth risk is High — prioritizing structural cleanup.' }
  }

  const matches = matchWorkerRoles(batchText)
  if (matches.length > 0) {
    return { role: matches[0], reason: `Batch objective matches the "${matches[0]}" domain.` }
  }

  return { role: 'Backend Engineer', reason: 'No specific domain signal matched — defaulting to Backend Engineer.' }
}
