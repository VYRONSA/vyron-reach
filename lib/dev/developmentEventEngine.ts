import { getProjects } from './projectsData'
import { getMilestones } from './milestonesStorage'
import { getBatches } from './batchesStorage'
import { getTasks } from './queueStorage'
import { getRisks, isOpenRisk } from './risksStorage'
import { getTechnicalDebt } from './technicalDebtStorage'
import { getDecisions } from './decisionsStorage'
import { getHandovers } from './handoverStorage'
import type { GitIntelligence } from './gitIntelligence'
import type { DeploymentIntelligence } from './deploymentIntelligence'
import type { BuildIntelligence } from './buildIntelligence'

export type DevelopmentEventType =
  | 'Project Created'
  | 'Milestone Created'
  | 'Milestone Completed'
  | 'Batch Started'
  | 'Batch Completed'
  | 'Task Created'
  | 'Task Completed'
  | 'Risk Added'
  | 'Risk Closed'
  | 'Technical Debt Added'
  | 'Technical Debt Resolved'
  | 'Git Commit'
  | 'Build Passed'
  | 'Build Failed'
  | 'Deployment Completed'
  | 'Claude Handover Logged'
  | 'Decision Added'

export type DevelopmentEventSeverity = 'Info' | 'Notice' | 'Warning' | 'Critical'

/**
 * A single detected development event. Never persisted or explicitly
 * "recorded" by callers — every event is derived by reading a
 * timestamp/status already stored on an existing record (or an existing
 * intelligence engine's output), the moment something asks for the
 * event list. Two identical calls always produce the same events.
 */
export type DevelopmentEvent = {
  type: DevelopmentEventType
  timestamp: string
  /** Project slug this event belongs to, or '' for events that aren't scoped to one project (Git/Build/Deployment — see developmentEventsForProject). */
  project: string
  relatedMilestone: string
  relatedBatch: string
  severity: DevelopmentEventSeverity
  description: string
  source: string
  href: string
}

export type DevelopmentEventContext = {
  git?: GitIntelligence
  build?: BuildIntelligence
  deployment?: DeploymentIntelligence
}

function milestoneProjectMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const m of getMilestones()) map[m.id] = m.project
  return map
}

function projectEvents(): DevelopmentEvent[] {
  const events: DevelopmentEvent[] = []
  for (const p of getProjects()) {
    if (!p.createdAt) continue // seed products predate this field — never fabricate a creation time
    events.push({
      type: 'Project Created',
      timestamp: p.createdAt,
      project: p.slug,
      relatedMilestone: '',
      relatedBatch: '',
      severity: 'Info',
      description: `${p.name} added to the portfolio.`,
      source: 'Project Administration',
      href: `/dev/projects/${p.slug}`,
    })
  }
  return events
}

function milestoneEvents(): DevelopmentEvent[] {
  const events: DevelopmentEvent[] = []
  for (const m of getMilestones()) {
    events.push({
      type: 'Milestone Created',
      timestamp: m.createdAt,
      project: m.project,
      relatedMilestone: m.id,
      relatedBatch: '',
      severity: 'Info',
      description: `Milestone "${m.title}" created.`,
      source: 'Milestones',
      href: `/dev/milestones?focus=${m.id}`,
    })
    if (m.status === 'Complete') {
      events.push({
        type: 'Milestone Completed',
        timestamp: m.updatedAt,
        project: m.project,
        relatedMilestone: m.id,
        relatedBatch: '',
        severity: 'Notice',
        description: `Milestone "${m.title}" completed.`,
        source: 'Milestones',
        href: `/dev/milestones?focus=${m.id}`,
      })
    }
  }
  return events
}

function batchEvents(): DevelopmentEvent[] {
  const events: DevelopmentEvent[] = []
  const projectOf = milestoneProjectMap()
  for (const b of getBatches()) {
    const project = projectOf[b.milestone] ?? ''
    events.push({
      type: 'Batch Started',
      timestamp: b.createdAt,
      project,
      relatedMilestone: b.milestone,
      relatedBatch: b.id,
      severity: 'Info',
      description: `Batch ${b.batchNumber} started.`,
      source: 'Batches',
      href: `/dev/batches?focus=${b.id}`,
    })
    if (b.status === 'Complete' && b.completionDate) {
      events.push({
        type: 'Batch Completed',
        timestamp: b.completionDate,
        project,
        relatedMilestone: b.milestone,
        relatedBatch: b.id,
        severity: 'Notice',
        description: `Batch ${b.batchNumber} completed.`,
        source: 'Batches',
        href: `/dev/batches?focus=${b.id}`,
      })
    }
  }
  return events
}

function taskEvents(): DevelopmentEvent[] {
  const events: DevelopmentEvent[] = []
  for (const t of getTasks()) {
    events.push({
      type: 'Task Created',
      timestamp: t.createdAt,
      project: t.project,
      relatedMilestone: '',
      relatedBatch: '',
      severity: 'Info',
      description: `Task "${t.title}" added to the queue.`,
      source: 'Development Queue',
      href: `/dev/queue?focus=${t.id}`,
    })
    if (t.status === 'done') {
      events.push({
        type: 'Task Completed',
        timestamp: t.updatedAt,
        project: t.project,
        relatedMilestone: '',
        relatedBatch: '',
        severity: 'Notice',
        description: `Task "${t.title}" completed.`,
        source: 'Development Queue',
        href: `/dev/queue?focus=${t.id}`,
      })
    }
  }
  return events
}

function riskEvents(): DevelopmentEvent[] {
  const events: DevelopmentEvent[] = []
  for (const r of getRisks()) {
    events.push({
      type: 'Risk Added',
      timestamp: r.createdAt,
      project: r.project,
      relatedMilestone: r.relatedMilestone,
      relatedBatch: '',
      severity: r.severity === 'High' ? 'Critical' : 'Warning',
      description: `Risk "${r.title}" identified (${r.severity} severity).`,
      source: 'Risk Register',
      href: `/dev/risks?focus=${r.id}`,
    })
    if (!isOpenRisk(r)) {
      events.push({
        type: 'Risk Closed',
        timestamp: r.updatedAt,
        project: r.project,
        relatedMilestone: r.relatedMilestone,
        relatedBatch: '',
        severity: 'Notice',
        description: `Risk "${r.title}" closed.`,
        source: 'Risk Register',
        href: `/dev/risks?focus=${r.id}`,
      })
    }
  }
  return events
}

function technicalDebtEvents(): DevelopmentEvent[] {
  const events: DevelopmentEvent[] = []
  for (const d of getTechnicalDebt()) {
    events.push({
      type: 'Technical Debt Added',
      timestamp: d.createdAt,
      project: d.project,
      relatedMilestone: '',
      relatedBatch: d.relatedBatch,
      severity: 'Warning',
      description: `Technical debt "${d.title}" recorded.`,
      source: 'Technical Debt Register',
      href: `/dev/technical-debt?focus=${d.id}`,
    })
    if (d.status === 'Resolved') {
      events.push({
        type: 'Technical Debt Resolved',
        timestamp: d.updatedAt,
        project: d.project,
        relatedMilestone: '',
        relatedBatch: d.relatedBatch,
        severity: 'Notice',
        description: `Technical debt "${d.title}" resolved.`,
        source: 'Technical Debt Register',
        href: `/dev/technical-debt?focus=${d.id}`,
      })
    }
  }
  return events
}

function decisionEvents(): DevelopmentEvent[] {
  return getDecisions().map(d => ({
    type: 'Decision Added' as const,
    timestamp: d.createdAt,
    project: d.relatedProject,
    relatedMilestone: d.relatedMilestone,
    relatedBatch: d.relatedBatch,
    severity: 'Info' as const,
    description: d.decision,
    source: 'Architecture Decisions',
    href: `/dev/decisions?focus=${d.id}`,
  }))
}

function handoverEvents(): DevelopmentEvent[] {
  return getHandovers().map(h => ({
    type: 'Claude Handover Logged' as const,
    timestamp: h.createdAt,
    project: h.project,
    relatedMilestone: h.relatedMilestone,
    relatedBatch: h.relatedBatch,
    severity: 'Info' as const,
    description: `Handover logged${h.phase ? ` for ${h.phase}` : ''}.`,
    source: 'Claude Handovers',
    href: `/dev/handovers?focus=${h.id}`,
  }))
}

/**
 * Git/Build/Deployment events are never fabricated: each is only
 * emitted when the underlying engine actually has a determinable
 * timestamp (e.g. Deployment Intelligence's lastDeploymentTime is
 * always "Unavailable" in this architecture — no Vercel API — so
 * "Deployment Completed" will practically never appear, which is
 * honest, not a bug). They're scoped project: '' — a git commit in
 * this repository isn't semantically tied to whichever tracked
 * product you happen to be viewing.
 */
function engineEvents(context: DevelopmentEventContext): DevelopmentEvent[] {
  const events: DevelopmentEvent[] = []

  const git = context.git
  if (git?.repositoryAvailable && git.commitHash !== 'Unavailable' && git.commitDate !== 'Unavailable') {
    events.push({
      type: 'Git Commit',
      timestamp: git.commitDate,
      project: '',
      relatedMilestone: '',
      relatedBatch: '',
      severity: 'Info',
      description: git.commitMessage !== 'Unavailable' ? git.commitMessage : `Commit ${git.commitHash} on ${git.branch}.`,
      source: 'Git Intelligence',
      href: '/dev/git-build',
    })
  }

  const build = context.build
  if (build && build.buildTimestamp !== 'Unavailable' && build.lastBuildStatus !== 'Unknown') {
    events.push({
      type: build.lastBuildStatus === 'Passing' ? 'Build Passed' : 'Build Failed',
      timestamp: build.buildTimestamp,
      project: '',
      relatedMilestone: '',
      relatedBatch: '',
      severity: build.lastBuildStatus === 'Passing' ? 'Notice' : 'Critical',
      description: build.lastBuildStatus === 'Passing' ? 'Build passing.' : 'Build failing — requires attention.',
      source: 'Build Intelligence',
      href: '/dev/git-build',
    })
  }

  const deployment = context.deployment
  if (deployment && deployment.lastDeploymentTime !== 'Unavailable') {
    events.push({
      type: 'Deployment Completed',
      timestamp: deployment.lastDeploymentTime,
      project: '',
      relatedMilestone: '',
      relatedBatch: '',
      severity: 'Notice',
      description: `Deployed to ${deployment.environment}.`,
      source: 'Deployment Intelligence',
      href: '/dev/git-build',
    })
  }

  return events
}

/**
 * The Development Event Engine — pure composition over every existing
 * store and intelligence engine. Nothing is persisted or explicitly
 * "recorded": each event is detected by reading a timestamp/status that
 * already exists (createdAt/updatedAt/completionDate on a record, or a
 * field already computed by Git/Build/Deployment Intelligence). Calling
 * this twice with the same underlying data always returns the same
 * events — same guarantee as every other engine in VYRON DEV.
 */
export function getDevelopmentEvents(context: DevelopmentEventContext = {}): DevelopmentEvent[] {
  const events = [
    ...projectEvents(),
    ...milestoneEvents(),
    ...batchEvents(),
    ...taskEvents(),
    ...riskEvents(),
    ...technicalDebtEvents(),
    ...decisionEvents(),
    ...handoverEvents(),
    ...engineEvents(context),
  ]
  return events.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
}

/** Events scoped to one project, plus unscoped Git/Build/Deployment events (which apply regardless of which product you're viewing — see engineEvents). */
export function developmentEventsForProject(slug: string, context: DevelopmentEventContext = {}): DevelopmentEvent[] {
  return getDevelopmentEvents(context).filter(e => e.project === slug || e.project === '')
}

/** Anything beyond routine creation — completions, closures, resolutions, and anything Warning/Critical. */
export function getSignificantChanges(events: DevelopmentEvent[]): DevelopmentEvent[] {
  return events.filter(e => e.severity !== 'Info')
}

/** What actually needs executive attention right now — failing builds, high-severity risks. */
export function getExecutiveAlerts(events: DevelopmentEvent[]): DevelopmentEvent[] {
  return events.filter(e => e.severity === 'Critical')
}
