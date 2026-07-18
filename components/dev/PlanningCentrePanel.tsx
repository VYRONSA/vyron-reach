'use client'

import { useState, type ReactNode } from 'react'
import type { DevelopmentSession } from '@/lib/dev/developmentOrchestrator'
import type { DevelopmentDependencyStatus } from '@/lib/dev/developmentDependencyEngine'
import type { DevelopmentConversationMemory } from '@/lib/dev/developmentConversationMemoryEngine'
import type { ExecutiveActionQueue } from '@/lib/dev/executiveActionEngine'
import type { Handover } from '@/lib/dev/handoverStorage'
import type { GitIntelligence } from '@/lib/dev/gitIntelligence'
import type { BuildIntelligence } from '@/lib/dev/buildIntelligence'
import { computeFullAssessment } from '@/lib/dev/assessment/computeAssessment'
import { buildDevelopmentContext } from '@/lib/dev/runtime/runtimeContextBuilder'
import { evaluateEngineeringStrategy } from '@/lib/dev/director/engineeringDirector'
import { getEngineeringOrganizationState } from '@/lib/dev/initializer/organizationInitializer'
import { tasksForProject } from '@/lib/dev/queueStorage'
import { batchesForProject } from '@/lib/dev/batchesStorage'
import { mapToEngineeringSequence } from '@/lib/dev/planning/planningModels'
import {
  generateEngineeringPlan,
  reviewPlanAsDirector,
  applyHumanApprovalDecision,
  buildApprovalPackage,
  buildPlanningHistoryRecord,
} from '@/lib/dev/planning/planningEngine'
import type { EngineeringPlan, PlanningHistoryRecord } from '@/lib/dev/planning/planningTypes'
import { DevBadge, DevCard, DevCardHeader, DevSectionLabel } from './ui'

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  const body = await res.json()
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`)
  return body as T
}

const PRIORITY_TONE: Record<string, 'danger' | 'warning' | 'info' | 'neutral'> = {
  Critical: 'danger',
  High: 'warning',
  Medium: 'info',
  Low: 'neutral',
}

const RISK_TONE: Record<string, 'danger' | 'warning' | 'success' | 'neutral'> = {
  Critical: 'danger',
  High: 'warning',
  Medium: 'neutral',
  Low: 'success',
}

const APPROVAL_TONE: Record<string, 'neutral' | 'info' | 'success' | 'danger'> = {
  Proposed: 'neutral',
  'Director Reviewed': 'info',
  Approved: 'success',
  Rejected: 'danger',
}

/**
 * The Planning Centre panel — runs the read-only Planning Engine
 * (lib/dev/planning/) on demand: Engineering Assessment + Engineering
 * Director Recommendation + Current Engineering Position + Engineering
 * Organization + DNA + Learning + Repository Facts + History in,
 * Engineering Plan out. Never executes anything, never touches
 * milestones/batches/queue/Runtime — a plan only advances from Proposed
 * to Director Reviewed to Approved/Rejected through the two explicit
 * buttons below, and even Approved plans stay inert records here.
 */
export function PlanningCentrePanel({
  projectSlug,
  session,
  dependencies,
  memory,
  latestHandover,
  queue,
  git,
  build,
}: {
  projectSlug: string
  session: DevelopmentSession
  dependencies: DevelopmentDependencyStatus
  memory: DevelopmentConversationMemory
  latestHandover: Handover | null
  queue: ExecutiveActionQueue
  git?: GitIntelligence
  build?: BuildIntelligence
}) {
  const [plan, setPlan] = useState<EngineeringPlan | null>(null)
  const [historyRecordId, setHistoryRecordId] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [deciding, setDeciding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generatePlan = async () => {
    setRunning(true)
    setError(null)
    try {
      const { assessment, executiveReport, jobs, facts, dnaProfile, learningSummary } = await computeFullAssessment(projectSlug, git, build, false)
      const context = buildDevelopmentContext(projectSlug, session, memory, latestHandover, jobs)
      const directorStrategy = evaluateEngineeringStrategy(context, executiveReport, queue, dependencies)

      const { history } = await fetchJson<{ history: PlanningHistoryRecord[] }>(`/api/dev/planning?project=${encodeURIComponent(projectSlug)}`)

      const openTaskTitles = tasksForProject(projectSlug).filter(t => t.status !== 'done').map(t => t.title)
      const openBatchObjectives = batchesForProject(projectSlug)
        .filter(b => b.status !== 'Complete' && b.objective.trim())
        .map(b => b.objective)

      const currentMilestoneSequence = session.currentMilestone ? mapToEngineeringSequence(session.currentMilestone.title) : null

      let generated = generateEngineeringPlan({
        projectSlug,
        projectName: session.project?.name ?? projectSlug,
        assessment,
        directorStrategy,
        currentPosition: {
          currentPhase: session.currentPhase,
          currentMilestoneTitle: session.currentMilestone?.title ?? null,
          currentMilestoneSequence,
          currentBatchNumber: session.currentBatch?.batchNumber ?? null,
        },
        engineeringOrganizationReady: getEngineeringOrganizationState(projectSlug).engineeringReady,
        dnaProfile,
        learningSummary,
        facts,
        history,
        existingWorkTitles: [...openTaskTitles, ...openBatchObjectives],
      })

      generated = reviewPlanAsDirector(generated)
      setPlan(generated)

      const record = buildPlanningHistoryRecord(generated)
      await fetchJson('/api/dev/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      })
      setHistoryRecordId(record.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run the Planning Engine.')
    } finally {
      setRunning(false)
    }
  }

  const decide = async (decision: 'Approved' | 'Rejected') => {
    if (!plan || !historyRecordId) return
    setDeciding(true)
    setError(null)
    try {
      const decided = applyHumanApprovalDecision(plan, decision)
      setPlan(decided)
      await fetchJson('/api/dev/planning', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: historyRecordId, approvalResult: decided.approvalStatus, approvalStatus: decided.approvalStatus }),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record the approval decision.')
    } finally {
      setDeciding(false)
    }
  }

  const approvalPackage = plan ? buildApprovalPackage(plan) : null

  return (
    <DevCard>
      <DevCardHeader
        title="Planning Centre"
        badge={plan ? <DevBadge tone={APPROVAL_TONE[plan.approvalStatus]}>{plan.approvalStatus}</DevBadge> : undefined}
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={generatePlan}
          disabled={running}
          className="rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? 'Planning…' : plan ? 'Re-run Planning Engine' : 'Generate Engineering Plan'}
        </button>
        {plan ? <span className="text-xs text-[var(--dev-text-faint)]">Generated {new Date(plan.generatedAt).toLocaleString()}</span> : null}
      </div>

      {error ? <p className="mt-2 text-xs text-rose-500 dark:text-rose-400">{error}</p> : null}

      {plan ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-[var(--dev-border)] p-3">
            <DevSectionLabel>Objective</DevSectionLabel>
            <p className="mt-1 text-sm font-medium text-[var(--dev-text)]">{plan.objective}</p>
            <p className="mt-1 text-xs text-[var(--dev-text-faint)]">{plan.reason}</p>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniField label="Complexity" value={plan.complexity} />
              <MiniField label="Confidence" value={plan.confidence} />
              <MiniField label="Estimated Duration" value={plan.estimatedDuration} />
              <MiniField label="Risk Level">
                <DevBadge tone={RISK_TONE[plan.riskLevel]}>{plan.riskLevel}</DevBadge>
              </MiniField>
            </div>
          </div>

          {!plan.validation.valid ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
              <DevSectionLabel>Validation Issues</DevSectionLabel>
              <ul className="mt-1 space-y-1">
                {plan.validation.issues.map((issue, i) => (
                  <li key={i} className="text-xs text-rose-500 dark:text-rose-400">
                    <span className="font-medium">{issue.type}:</span> {issue.description}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {plan.directorReviewNote ? (
            <div className="rounded-xl border border-[var(--dev-border)] p-3">
              <DevSectionLabel>Engineering Director Review</DevSectionLabel>
              <p className="mt-1 text-sm text-[var(--dev-text)]">{plan.directorReviewNote}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <RiskTile label="Technical" risk={plan.risk.technical} />
            <RiskTile label="Business" risk={plan.risk.business} />
            <RiskTile label="Architecture" risk={plan.risk.architecture} />
            <RiskTile label="Delivery" risk={plan.risk.delivery} />
          </div>

          <div>
            <DevSectionLabel>Engineering Tasks ({plan.tasks.length})</DevSectionLabel>
            {plan.tasks.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--dev-text-faint)]">No outstanding work identified.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {plan.tasks.map(task => (
                  <div key={task.id} className="rounded-xl border border-[var(--dev-border)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-medium text-[var(--dev-text)]">{task.title}</span>
                      <div className="flex shrink-0 items-center gap-2">
                        <DevBadge tone={PRIORITY_TONE[task.priority]}>{task.priority}</DevBadge>
                        <DevBadge tone="neutral">{task.status}</DevBadge>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-[var(--dev-text-faint)]">{task.priorityReason}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <MiniField label="Duration" value={`${task.estimatedHours}h`} />
                      <MiniField label="Complexity" value={task.complexity} />
                      <MiniField label="Source" value={task.source} />
                      <MiniField label="Sequence" value={task.engineeringSequence !== null ? String(task.engineeringSequence) : 'Unmapped'} />
                    </div>
                    <div className="mt-2">
                      <div className="text-[10px] uppercase tracking-wide text-[var(--dev-text-faint)]">Dependencies</div>
                      <ul className="mt-1 space-y-0.5">
                        {task.dependencies.map((d, i) => (
                          <li key={i} className="text-xs text-[var(--dev-text)]">
                            <span className="font-medium">{d.relation}</span>
                            {d.relation !== 'Independent' ? ` — ${d.target}` : ''}: {d.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-2">
                      <div className="text-[10px] uppercase tracking-wide text-[var(--dev-text-faint)]">Acceptance Criteria</div>
                      <ul className="mt-1 space-y-0.5">
                        {task.acceptanceCriteria.map((c, i) => (
                          <li key={i} className="text-xs text-[var(--dev-text)]">
                            ✓ {c.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {approvalPackage ? (
            <div className="rounded-xl border border-[var(--dev-border)] p-3">
              <DevSectionLabel>Approval Package</DevSectionLabel>
              <p className="mt-1 text-xs text-[var(--dev-text-faint)]">{approvalPackage.riskSummary}</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => decide('Approved')}
                  disabled={!approvalPackage.readyForHumanApproval || deciding || plan.approvalStatus === 'Approved' || plan.approvalStatus === 'Rejected'}
                  className="rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => decide('Rejected')}
                  disabled={!approvalPackage.readyForHumanApproval || deciding || plan.approvalStatus === 'Approved' || plan.approvalStatus === 'Rejected'}
                  className="rounded-lg border border-rose-500/30 px-4 py-2 text-sm font-semibold text-rose-500 transition-opacity hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-400"
                >
                  Reject
                </button>
                {!approvalPackage.readyForHumanApproval && plan.approvalStatus === 'Proposed' ? (
                  <span className="text-xs text-[var(--dev-text-faint)]">Awaiting a valid Director Review before a human can act.</span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--dev-text-faint)]">
          Read-only until approved — prepares an Engineering Plan for review. Never executes, never edits source code, never creates a
          Runtime job.
        </p>
      )}
    </DevCard>
  )
}

function MiniField({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-[var(--dev-text-faint)]">{label}</div>
      <div className="mt-0.5 text-sm text-[var(--dev-text)]">{children ?? value}</div>
    </div>
  )
}

function RiskTile({ label, risk }: { label: string; risk: { level: string; reason: string } }) {
  return (
    <div className="rounded-xl border border-[var(--dev-border)] p-3" title={risk.reason}>
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-[10px] uppercase tracking-wide text-[var(--dev-text-faint)]">{label} Risk</div>
        <DevBadge tone={RISK_TONE[risk.level]}>{risk.level}</DevBadge>
      </div>
      <p className="mt-1.5 text-xs text-[var(--dev-text-faint)]">{risk.reason}</p>
    </div>
  )
}
