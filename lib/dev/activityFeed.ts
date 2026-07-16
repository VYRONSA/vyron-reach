import { getJournalEntries } from './journalStorage'
import { getTasks } from './queueStorage'
import { getMilestones } from './milestonesStorage'
import { getBatches } from './batchesStorage'
import { getReleases } from './releasesStorage'
import { getDecisions } from './decisionsStorage'
import { getRisks, isOpenRisk } from './risksStorage'
import { getTechnicalDebt } from './technicalDebtStorage'
import { getPrompts } from './promptsStorage'

export const ACTIVITY_CATEGORIES = [
  'Journal',
  'Queue',
  'Milestones',
  'Batches',
  'Releases',
  'Decisions',
  'Risks',
  'Technical Debt',
  'Prompts',
] as const

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number]
export type ActivityBucket = 'Open' | 'Resolved'

export type ActivityEvent = {
  id: string
  category: ActivityCategory
  title: string
  project: string // project slug, or '' for none
  date: string // ISO date or datetime, used for sorting and display
  bucket: ActivityBucket
  href: string
}

/** Pure aggregation over existing local stores for the /dev/activity timeline — nothing new is persisted. */
export function getActivityEvents(): ActivityEvent[] {
  const events: ActivityEvent[] = []

  const milestoneProject: Record<string, string> = {}
  for (const m of getMilestones()) milestoneProject[m.id] = m.project

  for (const entry of getJournalEntries()) {
    events.push({
      id: entry.id,
      category: 'Journal',
      title: entry.summary || 'Untitled entry',
      project: entry.project,
      date: entry.date,
      bucket: 'Resolved',
      href: `/dev/journal?focus=${entry.id}`,
    })
  }

  for (const task of getTasks()) {
    events.push({
      id: task.id,
      category: 'Queue',
      title: task.title,
      project: task.project,
      date: task.updatedAt,
      bucket: task.status === 'done' ? 'Resolved' : 'Open',
      href: `/dev/queue?focus=${task.id}`,
    })
  }

  for (const milestone of getMilestones()) {
    events.push({
      id: milestone.id,
      category: 'Milestones',
      title: milestone.title,
      project: milestone.project,
      date: milestone.updatedAt,
      bucket: milestone.status === 'Complete' ? 'Resolved' : 'Open',
      href: `/dev/milestones?focus=${milestone.id}`,
    })
  }

  for (const batch of getBatches()) {
    events.push({
      id: batch.id,
      category: 'Batches',
      title: `Batch ${batch.batchNumber}`,
      project: milestoneProject[batch.milestone] ?? '',
      date: batch.updatedAt,
      bucket: batch.status === 'Complete' ? 'Resolved' : 'Open',
      href: `/dev/batches?focus=${batch.id}`,
    })
  }

  for (const release of getReleases()) {
    events.push({
      id: release.id,
      category: 'Releases',
      title: release.version,
      project: release.project,
      date: release.date || release.createdAt,
      bucket: 'Resolved',
      href: `/dev/milestones?focus=${release.id}`,
    })
  }

  for (const decision of getDecisions()) {
    events.push({
      id: decision.id,
      category: 'Decisions',
      title: decision.decision,
      project: decision.relatedProject,
      date: decision.updatedAt,
      bucket: decision.status === 'Proposed' ? 'Open' : 'Resolved',
      href: `/dev/decisions?focus=${decision.id}`,
    })
  }

  for (const risk of getRisks()) {
    events.push({
      id: risk.id,
      category: 'Risks',
      title: risk.title,
      project: risk.project,
      date: risk.updatedAt,
      bucket: isOpenRisk(risk) ? 'Open' : 'Resolved',
      href: `/dev/risks?focus=${risk.id}`,
    })
  }

  for (const debt of getTechnicalDebt()) {
    events.push({
      id: debt.id,
      category: 'Technical Debt',
      title: debt.title,
      project: debt.project,
      date: debt.updatedAt,
      bucket: debt.status === 'Resolved' ? 'Resolved' : 'Open',
      href: `/dev/technical-debt?focus=${debt.id}`,
    })
  }

  for (const prompt of getPrompts()) {
    events.push({
      id: prompt.id,
      category: 'Prompts',
      title: prompt.title,
      project: '',
      date: prompt.updatedAt,
      bucket: 'Resolved',
      href: `/dev/prompts?focus=${prompt.id}`,
    })
  }

  return events.sort((a, b) => (a.date < b.date ? 1 : -1))
}

/** Most recently completed items across categories, for dashboard "Recent Progress". */
export function recentlyCompleted(limit = 5): ActivityEvent[] {
  return getActivityEvents()
    .filter(e => e.bucket === 'Resolved')
    .slice(0, limit)
}
