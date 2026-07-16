import { getTasks } from './queueStorage'
import { milestonesForProject } from './milestonesStorage'
import { openRisksForProject } from './risksStorage'
import { debtForProject } from './technicalDebtStorage'
import { getProjectBySlug } from './projectsData'

export type HealthLabel = 'Excellent' | 'Healthy' | 'Attention Required' | 'Critical'

export type ProjectHealth = {
  label: HealthLabel
  penalty: number
  signals: string[]
}

export const HEALTH_TONE: Record<HealthLabel, 'success' | 'info' | 'warning' | 'danger'> = {
  Excellent: 'success',
  Healthy: 'info',
  'Attention Required': 'warning',
  Critical: 'danger',
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function recentlyActive(slug: string): boolean {
  const project = getProjectBySlug(slug)
  const lastActivity = project?.recentActivity[0]?.time
  // "Today" / relative labels in seed data count as recent; otherwise fall back to no signal.
  return Boolean(lastActivity)
}

/** Pure aggregation over existing local stores — no new data is stored. */
export function computeProjectHealth(slug: string): ProjectHealth {
  const risks = openRisksForProject(slug)
  const highRisks = risks.filter(r => r.severity === 'High').length
  const mediumRisks = risks.filter(r => r.severity === 'Medium').length

  const debt = debtForProject(slug).filter(d => d.status !== 'Resolved')
  const highDebt = debt.filter(d => d.priority === 'High').length

  const tasks = getTasks().filter(t => t.project === slug)
  const blockedTasks = tasks.filter(t => t.status === 'blocked').length

  const milestones = milestonesForProject(slug)
  const overdueMilestones = milestones.filter(
    m => m.status !== 'Complete' && m.targetDate !== '' && m.targetDate < todayISO()
  ).length

  const signals: string[] = []
  let penalty = 0

  if (highRisks > 0) {
    penalty += highRisks * 3
    signals.push(`${highRisks} high-severity risk${highRisks === 1 ? '' : 's'}`)
  }
  if (mediumRisks > 0) {
    penalty += mediumRisks
    signals.push(`${mediumRisks} medium risk${mediumRisks === 1 ? '' : 's'}`)
  }
  if (highDebt > 0) {
    penalty += highDebt * 2
    signals.push(`${highDebt} high-priority debt item${highDebt === 1 ? '' : 's'}`)
  }
  if (blockedTasks > 0) {
    penalty += blockedTasks * 2
    signals.push(`${blockedTasks} blocked task${blockedTasks === 1 ? '' : 's'}`)
  }
  if (overdueMilestones > 0) {
    penalty += overdueMilestones * 3
    signals.push(`${overdueMilestones} overdue milestone${overdueMilestones === 1 ? '' : 's'}`)
  }
  if (!recentlyActive(slug)) {
    penalty += 2
    signals.push('No recent activity')
  }

  const label: HealthLabel = penalty === 0 ? 'Excellent' : penalty <= 3 ? 'Healthy' : penalty <= 7 ? 'Attention Required' : 'Critical'

  if (signals.length === 0) signals.push('No open risks, debt, or blockers')

  return { label, penalty, signals }
}
