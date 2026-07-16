'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useDevPreferences } from '@/context/dev/DevPreferencesContext'
import { getDevelopmentSession, type DevelopmentSession } from '@/lib/dev/developmentOrchestrator'
import { getDevelopmentPlan, type DevelopmentPlan } from '@/lib/dev/aiPlanningEngine'
import { PRIORITY_LABEL } from '@/lib/dev/queueStorage'
import type { GitIntelligence } from '@/lib/dev/gitIntelligence'
import type { DeploymentIntelligence } from '@/lib/dev/deploymentIntelligence'
import type { BuildIntelligence } from '@/lib/dev/buildIntelligence'
import { DevBadge, DevCard, DevCardHeader, DevField, DevSectionLabel, DevSkeleton, devReadinessTone, devValidationTone } from './ui'

/**
 * The Executive Command Centre — VYRON DEV's primary operational screen.
 * This is composition only: every value shown here already exists on
 * the Development Session (lib/dev/developmentOrchestrator.ts) or the
 * Development Plan (lib/dev/aiPlanningEngine.ts), which themselves
 * already compose Project/Development/Git/Deployment/Build Intelligence.
 * Nothing is recalculated here — this component just lays the existing
 * engines' output out for a single executive glance.
 */
export function ExecutiveCommandCentre({
  projectSlug,
  buildStatus,
  typescriptStatus,
  git,
  deployment,
  build,
}: {
  projectSlug?: string
  buildStatus?: string
  typescriptStatus?: string
  git?: GitIntelligence
  deployment?: DeploymentIntelligence
  build?: BuildIntelligence
}) {
  const { preferences, hydrated: prefsHydrated } = useDevPreferences()
  const slug = projectSlug ?? preferences.defaultProject
  const [session, setSession] = useState<DevelopmentSession | null>(null)
  const [plan, setPlan] = useState<DevelopmentPlan | null>(null)

  useEffect(() => {
    const context = { buildStatus, typescriptStatus, git, deployment, build }
    setSession(getDevelopmentSession(slug, context))
    setPlan(getDevelopmentPlan(slug, context))
  }, [slug, buildStatus, typescriptStatus, git, deployment, build])

  const ready = session !== null && plan !== null && (Boolean(projectSlug) || prefsHydrated)

  if (!ready) {
    return (
      <DevCard>
        <DevSkeleton className="h-3 w-56" />
        <DevSkeleton className="mt-4 h-6 w-full" />
        <DevSkeleton className="mt-3 h-4 w-5/6" />
        <DevSkeleton className="mt-2 h-4 w-2/3" />
      </DevCard>
    )
  }

  return (
    <DevCard>
      <DevCardHeader
        title="Executive Command Centre"
        badge={<DevBadge tone={devReadinessTone(session.developmentReadiness)}>{session.developmentReadiness}</DevBadge>}
      />
      <h2 className="mt-1 text-lg font-semibold text-[var(--dev-text)]">{session.project?.name ?? 'No project set'}</h2>

      <div className="mt-4 rounded-xl border border-[var(--dev-accent)]/30 bg-[var(--dev-accent-soft)] px-4 py-3">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-accent)]">
          Executive Decision
        </div>
        <p className="mt-1 text-sm font-medium text-[var(--dev-text)]">{plan.executiveDecision}</p>
      </div>

      <div className="mt-4 border-t border-[var(--dev-border)] pt-4">
        <DevSectionLabel>Executive Status</DevSectionLabel>
        <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <DevField label="Executive Health">
            <DevBadge tone={devReadinessTone(session.developmentReadiness)}>{session.developmentReadiness}</DevBadge>
          </DevField>
          <DevField label="Development Readiness">
            <DevBadge tone={devReadinessTone(session.developmentReadiness)}>{session.developmentReadiness}</DevBadge>
          </DevField>
          <DevField label="Current Phase">
            <span className="text-sm text-[var(--dev-text)]">{session.currentPhase}</span>
          </DevField>
          <DevField label="Current Milestone">
            <span className="text-sm text-[var(--dev-text)]">{session.currentMilestone?.title ?? 'None set'}</span>
          </DevField>
        </div>
        <div className="mt-3">
          <DevField label="Current Batch">
            <span className="text-sm text-[var(--dev-text)]">
              {session.currentBatch ? `Batch ${session.currentBatch.batchNumber}` : 'None active'}
            </span>
          </DevField>
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--dev-border)] pt-4">
        <DevSectionLabel>Development</DevSectionLabel>
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DevField label="Current Goal">
            <p className="text-sm text-[var(--dev-text)]">{plan.currentGoal}</p>
          </DevField>
          <DevField label="Current Objective">
            <p className="text-sm text-[var(--dev-text)]">{session.currentObjective ?? 'No objective set'}</p>
          </DevField>
          <DevField label="Current Task">
            {session.currentTask ? (
              <Link href={`/dev/queue?focus=${session.currentTask.id}`} className="text-sm text-[var(--dev-text)] hover:text-[var(--dev-accent)]">
                {session.currentTask.title}
              </Link>
            ) : (
              <span className="text-sm text-[var(--dev-text-faint)]">None in progress</span>
            )}
          </DevField>
          <DevField label="Recommended Next Task">
            {plan.recommendedNextTask.task ? (
              <Link
                href={`/dev/queue?focus=${plan.recommendedNextTask.task.id}`}
                className="flex items-center gap-2 text-sm text-[var(--dev-text)] hover:text-[var(--dev-accent)]"
              >
                {plan.recommendedNextTask.task.title}
                <DevBadge
                  tone={
                    plan.recommendedNextTask.task.priority === 'high'
                      ? 'danger'
                      : plan.recommendedNextTask.task.priority === 'medium'
                        ? 'warning'
                        : 'neutral'
                  }
                >
                  {PRIORITY_LABEL[plan.recommendedNextTask.task.priority]}
                </DevBadge>
              </Link>
            ) : (
              <span className="text-sm text-[var(--dev-text-faint)]">{plan.recommendedNextTask.reason}</span>
            )}
          </DevField>
        </div>
        <div className="mt-3">
          <DevField label="Suggested Next Batch">
            <span className="text-sm text-[var(--dev-text)]">{plan.recommendedNextBatch.label ?? 'Not enough context yet'}</span>
          </DevField>
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--dev-border)] pt-4">
        <DevSectionLabel>Claude</DevSectionLabel>
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DevField label="Latest Executive Summary">
            <p className="text-sm leading-relaxed text-[var(--dev-text-muted)]">
              {session.previousClaudeSummary ?? 'No handovers logged yet.'}
            </p>
          </DevField>
          <DevField label="Latest Recommendation">
            <p className="text-sm leading-relaxed text-[var(--dev-text-muted)]">
              {session.previousRecommendations ?? 'No recommendation on record.'}
            </p>
          </DevField>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <DevField label="Latest Build">
            <DevBadge tone={devValidationTone(session.buildStatus)}>{session.buildStatus}</DevBadge>
          </DevField>
          <DevField label="Latest TypeScript">
            <DevBadge tone={devValidationTone(session.typescriptStatus)}>{session.typescriptStatus}</DevBadge>
          </DevField>
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--dev-border)] pt-4">
        <DevSectionLabel>Git</DevSectionLabel>
        <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <DevField label="Branch">
            <span className="text-sm text-[var(--dev-text)]">{session.gitBranch}</span>
          </DevField>
          <DevField label="Working Tree">
            <span className="text-sm text-[var(--dev-text)]">{session.gitWorkingTreeStatus}</span>
          </DevField>
          <DevField label="Changed Files">
            <span className="text-sm text-[var(--dev-text)]">{session.gitChangedFileCount ?? 'Unavailable'}</span>
          </DevField>
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--dev-border)] pt-4">
        <DevSectionLabel>Build</DevSectionLabel>
        <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <DevField label="Build Status">
            <DevBadge tone={devValidationTone(session.buildStatus)}>{session.buildStatus}</DevBadge>
          </DevField>
          <DevField label="TypeScript Status">
            <DevBadge tone={devValidationTone(session.typescriptStatus)}>{session.typescriptStatus}</DevBadge>
          </DevField>
          <DevField label="Build Confidence">
            <span className="text-sm text-[var(--dev-text)]">{session.buildConfidence}</span>
          </DevField>
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--dev-border)] pt-4">
        <DevSectionLabel>Deployment</DevSectionLabel>
        <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <DevField label="Deployment Status">
            <span className="text-sm text-[var(--dev-text)]">{session.deploymentStatus}</span>
          </DevField>
          <DevField label="Environment">
            <span className="text-sm text-[var(--dev-text)]">{session.deploymentEnvironment}</span>
          </DevField>
          <DevField label="Production URL">
            <span className="truncate text-sm text-[var(--dev-text)]">{session.deploymentUrl}</span>
          </DevField>
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--dev-border)] pt-4">
        <DevSectionLabel>Risks</DevSectionLabel>
        <div className="mt-2 grid grid-cols-3 gap-3">
          <DevField label="Active Risks">
            <Link
              href="/dev/risks"
              className={`font-mono text-sm hover:text-[var(--dev-accent)] ${session.activeRisks.length > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-[var(--dev-text)]'}`}
            >
              {session.activeRisks.length}
            </Link>
          </DevField>
          <DevField label="Technical Debt">
            <Link
              href="/dev/technical-debt"
              className={`font-mono text-sm hover:text-[var(--dev-accent)] ${session.technicalDebt.length > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-[var(--dev-text)]'}`}
            >
              {session.technicalDebt.length}
            </Link>
          </DevField>
          <DevField label="Development Priority">
            {plan.developmentPriorities[0] ? (
              <Link href={plan.developmentPriorities[0].href} className="text-sm text-[var(--dev-text)] hover:text-[var(--dev-accent)]">
                {plan.developmentPriorities[0].label}
              </Link>
            ) : (
              <span className="text-sm text-[var(--dev-text-faint)]">Nothing pending.</span>
            )}
          </DevField>
        </div>
      </div>
    </DevCard>
  )
}
