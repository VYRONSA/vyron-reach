import * as planningStateService from '../../planningState/planningStateService'
import * as knowledgeService from '../../knowledge/knowledgeService'
import { listJobsForProject } from '../../runtime/runtimeStorage'
import { historyForProject } from '../directorHistoryStore'
import { listInboxItems } from '../engineeringInboxStore'
import { getDirectorStatus } from '../directorRuntimeStore'
import { latestAssessment } from './assessmentStore'
import type { AssessmentInput, GateStatus, RiskLevel } from './assessmentTypes'

const RECENT_JOBS_WINDOW = 5

function toGateStatus(value: string): GateStatus {
  return value === 'Passing' || value === 'Failing' ? value : 'Unknown'
}

function toRiskLevel(value: string): RiskLevel | null {
  return value === 'Low' || value === 'Medium' || value === 'High' ? value : null
}

/**
 * The ONLY place the Assessment Service reads Planning/Knowledge/Runtime/
 * Director state directly — every evaluator (qualityGates.ts,
 * riskAssessment.ts) consumes the resulting AssessmentInput instead.
 * Every field here is a snapshot of already-durable state; nothing is
 * re-derived from a live subprocess or the wall clock.
 */
export function gatherAssessmentInput(project: string): AssessmentInput {
  const status = getDirectorStatus(project)

  const milestones = planningStateService.listMilestones(project)
  const batches = planningStateService.listBatches(project)
  const dependencies = planningStateService.listDependencies(project)
  const risks = planningStateService.listRisks(project)

  const milestoneIds = new Set(milestones.map(m => m.id))
  const batchIds = new Set(batches.map(b => b.id))

  const blockedMilestoneIds = milestones.filter(m => m.status === 'At Risk').map(m => m.id)
  const completedMilestoneIds = milestones.filter(m => m.status === 'Complete').map(m => m.id)

  const activeBatchIds = batches.filter(b => b.status === 'Active').map(b => b.id)
  const completedBatchIds = batches.filter(b => b.status === 'Complete').map(b => b.id)
  const orphanedBatchIds = batches.filter(b => b.milestone && !milestoneIds.has(b.milestone)).map(b => b.id)

  const danglingDependencyIds = dependencies
    .filter(d => {
      const fromExists = d.fromType === 'milestone' ? milestoneIds.has(d.fromId) : batchIds.has(d.fromId)
      const toExists = d.toType === 'milestone' ? milestoneIds.has(d.toId) : batchIds.has(d.toId)
      return !fromExists || !toExists
    })
    .map(d => d.id)

  const openRiskSeverities = risks
    .filter(r => r.status === 'Open' || r.status === 'Monitoring')
    .map(r => toRiskLevel(r.severity))
    .filter((s): s is RiskLevel => s !== null)

  const batchCompletionRecordedIds = knowledgeService.listBatchCompletions(project).map(r => r.batchId ?? '')
  const milestoneCompletionRecordedIds = knowledgeService.listMilestoneCompletions(project).map(r => r.milestoneId ?? '')
  const technicalDebtRecordCount = knowledgeService.listTechnicalDebt(project).length

  // The immediately preceding assessment's own technicalDebtBaseline field
  // (see assessmentTypes.ts) — a durable, already-persisted prior value,
  // never a wall-clock comparison. Defaults to the CURRENT count for a
  // project's very first assessment (zero delta), not a distinct
  // sentinel — see the field's own doc comment for why that matters.
  const previous = latestAssessment(project)
  const previousTechnicalDebtRecordCount = previous?.assessment.technicalDebtBaseline ?? technicalDebtRecordCount

  const jobs = listJobsForProject(project) // newest-first, per runtimeStorage.ts's saveJob (unshift)
  const recentJobStatuses = jobs.slice(0, RECENT_JOBS_WINDOW).map(j => j.status)

  const activeBatchId = activeBatchIds[0] ?? null
  const activeBatchLastJob = activeBatchId ? jobs.find(j => j.batchId === activeBatchId) ?? null : null
  const activeBatchLastJobFailed = activeBatchLastJob ? activeBatchLastJob.status === 'Failed' || activeBatchLastJob.status === 'Cancelled' : false

  const recoveryEventCount = historyForProject(project, 2000).filter(e => e.event === 'Recovered from crash').length
  const openInboxCount = listInboxItems({ project, status: 'Open' }).length

  return {
    project,
    buildStatus: toGateStatus(status.buildStatus),
    typescriptStatus: toGateStatus(status.typescriptStatus),
    totalMilestones: milestones.length,
    blockedMilestoneIds,
    totalBatches: batches.length,
    activeBatchIds,
    orphanedBatchIds,
    danglingDependencyIds,
    completedBatchIds,
    completedMilestoneIds,
    batchCompletionRecordedIds,
    milestoneCompletionRecordedIds,
    technicalDebtRecordCount,
    previousTechnicalDebtRecordCount,
    openRiskSeverities,
    recentJobStatuses,
    activeBatchLastJobFailed,
    recoveryEventCount,
    openInboxCount,
    directorState: status.state,
  }
}
