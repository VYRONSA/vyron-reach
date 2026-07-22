import type { DashboardEvent } from '../events/eventTypes'
import type { MetricsState } from './metricsTypes'

/**
 * The single place a raw DashboardEvent becomes a named metric increment,
 * duration sample, or span. Pure: given the same (state, event), always
 * returns the same next state — no I/O, no wall-clock read, no
 * randomness. metricsService.ts is the only caller, inside one
 * updateJsonStore lock per event (see its doc comment for why).
 *
 * "No duplicate metrics": `event.seq` is eventBus.ts's monotonic
 * sequence number. An event whose seq is not strictly greater than
 * `state.lastEventSeq` has already been applied — returned unchanged,
 * not reprocessed. This is what makes redelivery (a reconnect replay, a
 * defensive re-subscribe) safe by construction rather than by care at
 * every call site.
 *
 * Proxy quality metrics, defined precisely here (see the QualityKpis
 * type for the caveat that these are not machine-learning-validated
 * predictions):
 *   - "Assessment accuracy" = the proportion of Assessment Updates events
 *     whose engineeringHealth was Healthy or Attention Required (i.e.
 *     not At Risk/Critical) at the moment they were recorded — "how
 *     often does an assessment indicate a healthy trajectory."
 *   - "Risk prediction accuracy" = the proportion of High risk-level
 *     assessments for a project that were followed by at least one
 *     Escalation reminder for that same project on the same calendar day
 *     — "did flagging high risk actually predict something needing
 *     escalation," not a validated ML metric.
 */
export function applyEvent(state: MetricsState, event: DashboardEvent): MetricsState {
  if (event.seq <= state.lastEventSeq) return state

  let counters = state.counters
  let durations = state.durations
  let spans = state.spans
  let pendingRiskFlags = state.pendingRiskFlags

  const inc = (name: string, by = 1) => {
    counters = { ...counters, [name]: (counters[name] ?? 0) + by }
  }
  const sample = (name: string, ms: number) => {
    if (ms < 0) return // clock skew / malformed payload — never let a negative sample corrupt the average
    const current = durations[name] ?? { count: 0, totalMs: 0 }
    durations = { ...durations, [name]: { count: current.count + 1, totalMs: current.totalMs + ms } }
  }
  const openSpan = (spanId: string, name: string, startedAt: string) => {
    spans = { ...spans, [spanId]: { name, startedAt } }
  }
  const openSpanIfAbsent = (spanId: string, name: string, startedAt: string) => {
    if (spans[spanId]) return
    openSpan(spanId, name, startedAt)
  }
  const closeSpan = (spanId: string, endedAt: string) => {
    const span = spans[spanId]
    if (!span) return
    sample(span.name, new Date(endedAt).getTime() - new Date(span.startedAt).getTime())
    const next = { ...spans }
    delete next[spanId]
    spans = next
  }

  switch (event.category) {
    case 'Project Status': {
      if (event.type === 'director-state-changed') {
        const directorState = (event.payload as { state?: string }).state
        inc('automation.directorDecisions')
        inc('automation.autonomousDecisions')
        if (directorState === 'Planning') {
          openSpan(`planning:${event.project}`, 'performance.planningDuration', event.timestamp)
        }
        if (directorState === 'Running') {
          closeSpan(`planning:${event.project}`, event.timestamp)
          inc('throughput.projectsStarted')
          openSpanIfAbsent(`project:${event.project}`, 'throughput.projectDuration', event.timestamp)
        }
        if (directorState === 'Completed') {
          inc('throughput.projectsCompleted')
          closeSpan(`project:${event.project}`, event.timestamp)
        }
      }
      break
    }

    case 'Worker Assignment': {
      const taskId = (event.payload as { taskId: string }).taskId
      inc('automation.workerDecisions')
      inc('automation.autonomousDecisions')
      inc('throughput.tasksAssigned')
      openSpan(`worker:${taskId}`, 'performance.workerDuration', event.timestamp)
      break
    }

    case 'Worker Completion': {
      const taskId = (event.payload as { taskId: string }).taskId
      inc('automation.workerDecisions')
      inc('automation.autonomousDecisions')
      inc('throughput.tasksCompleted')
      closeSpan(`worker:${taskId}`, event.timestamp)
      break
    }

    case 'Planning Changes': {
      if (event.type === 'batch-created') {
        const batchId = (event.payload as { batchId: string }).batchId
        inc('throughput.featuresPlanned')
        openSpan(`feature:${batchId}`, 'throughput.featureDuration', event.timestamp)
      } else if (event.type === 'batch-completed') {
        const batchId = (event.payload as { batchId: string }).batchId
        inc('throughput.featuresDelivered')
        closeSpan(`feature:${batchId}`, event.timestamp)
      } else if (event.type === 'technical-debt-resolved') {
        inc('quality.technicalDebtResolved')
      }
      break
    }

    case 'Knowledge Updates': {
      inc('quality.knowledgeUpdates')
      const timelineCategory = (event.payload as { timelineCategory?: string }).timelineCategory
      if (timelineCategory === 'Technical Debt') inc('quality.technicalDebtCreated')
      if (timelineCategory === 'Handover') inc('quality.documentationGenerated')
      break
    }

    case 'Assessment Updates': {
      const payload = event.payload as { engineeringHealth?: string; riskLevel?: string; durationMs?: number }
      inc('quality.assessmentsTotal')
      if (payload.engineeringHealth === 'Healthy' || payload.engineeringHealth === 'Attention Required') inc('quality.assessmentsHealthy')
      if (typeof payload.durationMs === 'number') sample('performance.assessmentDuration', payload.durationMs)
      if (payload.riskLevel === 'High') {
        inc('quality.riskFlagsHigh')
        pendingRiskFlags = { ...pendingRiskFlags, [event.project]: event.timestamp }
      }
      break
    }

    case 'Scheduler Activity': {
      const payload = event.payload as { started: string[]; waiting: string[]; durationMs?: number }
      inc('reliability.schedulerCycles')
      const decisions = payload.started.length + payload.waiting.length
      inc('automation.schedulerDecisions', decisions)
      inc('automation.autonomousDecisions', decisions)
      if (typeof payload.durationMs === 'number') sample('performance.schedulingDuration', payload.durationMs)
      break
    }

    case 'Notification Delivery': {
      const payload = event.payload as { deliveryId: string; status?: string }
      if (event.type === 'delivery-queued') {
        openSpan(`delivery:${payload.deliveryId}`, 'performance.notificationDuration', event.timestamp)
      } else if (event.type === 'delivery-status-changed') {
        if (payload.status === 'Delivered' || payload.status === 'Failed' || payload.status === 'Cancelled') {
          closeSpan(`delivery:${payload.deliveryId}`, event.timestamp)
        }
        if (payload.status === 'Failed') inc('reliability.notificationFailures')
        if (payload.status === 'Retrying') inc('reliability.retryCounts')
      }
      break
    }

    case 'Engineering Inbox': {
      if (event.type === 'item-opened') {
        const reasonType = (event.payload as { reasonType?: string }).reasonType
        if (reasonType === 'Worker Review Required') inc('reliability.workerFailures')
      } else if (event.type === 'item-closed') {
        inc('automation.manualOverrides')
      }
      break
    }

    case 'Escalation': {
      const inboxItemId = (event.payload as { inboxItemId: string }).inboxItemId
      if (event.type === 'monitoring-started') {
        openSpan(`escalation:${inboxItemId}`, 'performance.escalationDuration', event.timestamp)
      } else if (event.type === 'reminder-sent') {
        inc('reliability.escalationFrequency')
        const flaggedAt = pendingRiskFlags[event.project]
        if (flaggedAt && sameCalendarDay(flaggedAt, event.timestamp)) {
          inc('quality.riskFlagsConfirmed')
          const next = { ...pendingRiskFlags }
          delete next[event.project]
          pendingRiskFlags = next
        }
      } else if (event.type === 'monitoring-closed') {
        closeSpan(`escalation:${inboxItemId}`, event.timestamp)
      }
      break
    }

    case 'Recovery': {
      const durationMs = (event.payload as { durationMs?: number }).durationMs
      inc('reliability.recoveryCount')
      inc('automation.recoveryEvents')
      if (typeof durationMs === 'number') sample('reliability.recoveryDuration', durationMs)
      break
    }

    case 'Operations': {
      if (event.type === 'incident-opened') {
        inc('reliability.incidentsOpened')
      } else if (event.type === 'incident-resolved') {
        const durationMs = (event.payload as { durationMs?: number }).durationMs
        inc('reliability.incidentsResolved')
        if (typeof durationMs === 'number') sample('reliability.incidentDuration', durationMs)
      } else if (event.type === 'rollback-decision') {
        // A rollback Go/Hold is a human executive decision, not an
        // autonomous one — deliberately never counted toward
        // automation.autonomousDecisions, matching how every other
        // Executive/Manual decision in this classifier is treated.
        const decision = (event.payload as { decision?: string }).decision
        if (decision === 'Go') inc('reliability.rollbacksApproved')
      }
      // 'incident-refreshed' and 'rollback-pending' are re-observations of
      // an already-counted incident, not a new distinct fact — counting
      // them here would inflate incidentsOpened every monitoring cycle for
      // one ongoing incident, a fabricated metric this classifier avoids.
      break
    }
  }

  return { counters, durations, spans, pendingRiskFlags, lastEventSeq: event.seq }
}

function sameCalendarDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10)
}
