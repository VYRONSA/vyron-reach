'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useDevPreferences } from '@/context/dev/DevPreferencesContext'
import type { DevelopmentSession } from '@/lib/dev/developmentOrchestrator'
import type { DevelopmentPlan } from '@/lib/dev/aiPlanningEngine'
import { getSelfDevelopmentStatus } from '@/lib/dev/selfDevelopmentEngine'
import {
  developmentEventsForProject,
  getExecutiveAlerts,
  getSignificantChanges,
  type DevelopmentEvent,
} from '@/lib/dev/developmentEventEngine'
import { developmentDependencyStatusForProject, type DevelopmentDependencyStatus } from '@/lib/dev/developmentDependencyEngine'
import { getDevelopmentConversationMemory } from '@/lib/dev/developmentConversationMemoryEngine'
import { getExecutiveActions } from '@/lib/dev/executiveActionEngine'
import { getGeneratedPrompt } from '@/lib/dev/promptIntelligenceEngine'
import { getLatestHandover, type Handover } from '@/lib/dev/handoverStorage'
import { isEngineeringReady } from '@/lib/dev/initializer/organizationInitializer'
import { PRIORITY_LABEL } from '@/lib/dev/queueStorage'
import type { GitIntelligence } from '@/lib/dev/gitIntelligence'
import type { DeploymentIntelligence } from '@/lib/dev/deploymentIntelligence'
import type { BuildIntelligence } from '@/lib/dev/buildIntelligence'
import { DevBadge, DevCard, DevCardHeader, DevField, DevSectionLabel, DevSkeleton, devReadinessTone, devValidationTone } from './ui'
import { MissionControl } from './MissionControl'
import { ExecutiveActionQueuePanel } from './ExecutiveActionQueuePanel'
import { EngineeringAssessmentPanel } from './EngineeringAssessmentPanel'
import { PlanningCentrePanel } from './PlanningCentrePanel'

/**
 * The Executive Command Centre — VYRON DEV's primary operational screen.
 * Completely driven by the Self Development Engine (lib/dev/
 * selfDevelopmentEngine.ts): one call returns the Session and Plan this
 * component renders, so nothing here is recalculated and nothing here
 * fetches Session/Plan independently anymore.
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
  const [events, setEvents] = useState<DevelopmentEvent[]>([])
  const [dependencies, setDependencies] = useState<DevelopmentDependencyStatus | null>(null)
  const [latestHandover, setLatestHandover] = useState<Handover | null>(null)
  const [engineeringReady, setEngineeringReady] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    const context = { buildStatus, typescriptStatus, git, deployment, build }
    const status = getSelfDevelopmentStatus(slug, context)
    setSession(status.session)
    setPlan(status.plan)
    setEvents(developmentEventsForProject(slug, { git, build, deployment }))
    setDependencies(developmentDependencyStatusForProject(slug, context))
    setLatestHandover(getLatestHandover(slug))
    setEngineeringReady(isEngineeringReady(slug))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, buildStatus, typescriptStatus, git, deployment, build, refreshToken])

  const ready = session !== null && plan !== null && dependencies !== null && (Boolean(projectSlug) || prefsHydrated)

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

  const significantChanges = getSignificantChanges(events)
  const alerts = getExecutiveAlerts(events)
  const memory = getDevelopmentConversationMemory(slug, session, plan, dependencies, events)
  const generatedPrompt = getGeneratedPrompt(slug, session, dependencies, events, memory)
  const actionQueue = getExecutiveActions(session, plan, dependencies, events, memory)

  return (
    <div>
      <MissionControl
        slug={slug}
        session={session}
        dependencies={dependencies}
        memory={memory}
        latestHandover={latestHandover}
        queue={actionQueue}
        generatedPrompt={generatedPrompt}
        git={git}
        deployment={deployment}
        onApplied={() => setRefreshToken(t => t + 1)}
      />

      <div className="mt-4">
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
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <DevField label="Current Batch">
            <span className="text-sm text-[var(--dev-text)]">
              {session.currentBatch ? `Batch ${session.currentBatch.batchNumber}` : 'None active'}
            </span>
          </DevField>
          <DevField label="Engineering Organization">
            <DevBadge tone={engineeringReady ? 'success' : 'neutral'}>{engineeringReady ? 'Ready' : 'Unknown'}</DevBadge>
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

        {latestHandover ? (
          <div className="mt-4 border-t border-[var(--dev-border)] pt-4">
            <DevSectionLabel>Last Execution Details</DevSectionLabel>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DevField label="Objective Executed">
                <p className="text-sm text-[var(--dev-text)]">{latestHandover.objective || 'Not recorded'}</p>
              </DevField>
              <DevField label="Next Development Task">
                <p className="text-sm text-[var(--dev-text)]">{latestHandover.nextSuggestedBatch || 'None suggested'}</p>
              </DevField>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <DevField label="Files Created">
                <Link href={`/dev/handovers?focus=${latestHandover.id}`} className="font-mono text-sm text-[var(--dev-text)] hover:text-[var(--dev-accent)]">
                  {latestHandover.filesCreated.length}
                </Link>
              </DevField>
              <DevField label="Files Modified">
                <Link href={`/dev/handovers?focus=${latestHandover.id}`} className="font-mono text-sm text-[var(--dev-text)] hover:text-[var(--dev-accent)]">
                  {latestHandover.filesModified.length}
                </Link>
              </DevField>
              <DevField label="Claude Duration">
                <span className="text-sm text-[var(--dev-text)]">
                  {latestHandover.runtimeDurationMs !== null ? `${Math.round(latestHandover.runtimeDurationMs / 1000)}s` : 'Unavailable'}
                </span>
              </DevField>
              <DevField label="Claude Cost">
                <span className="text-sm text-[var(--dev-text)]">
                  {latestHandover.runtimeCostUsd !== null ? `$${latestHandover.runtimeCostUsd.toFixed(4)}` : 'Unavailable'}
                </span>
              </DevField>
            </div>
            {latestHandover.gitDiffSummary ? (
              <div className="mt-3">
                <DevField label="Git Diff Summary">
                  <pre className="whitespace-pre-wrap rounded-lg bg-black/20 p-2.5 font-mono text-[11px] leading-relaxed text-[var(--dev-text-muted)]">
                    {latestHandover.gitDiffSummary}
                  </pre>
                </DevField>
              </div>
            ) : null}
          </div>
        ) : null}
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

      <div className="mt-4 border-t border-[var(--dev-border)] pt-4">
        <DevSectionLabel>Development Events</DevSectionLabel>
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DevField label="Latest Development Events">
            {events.length > 0 ? (
              <ul className="space-y-1">
                {events.slice(0, 5).map((e, i) => (
                  <li key={i} className="truncate text-sm text-[var(--dev-text)]">
                    <Link href={e.href} className="hover:text-[var(--dev-accent)]">
                      {e.type}: {e.description}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-sm text-[var(--dev-text-faint)]">No events recorded yet.</span>
            )}
          </DevField>
          <DevField label="Significant Changes">
            <span className={`font-mono text-sm ${significantChanges.length > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-[var(--dev-text)]'}`}>
              {significantChanges.length}
            </span>
          </DevField>
        </div>
        <div className="mt-3">
          <DevField label="Executive Alerts">
            {alerts.length > 0 ? (
              <ul className="space-y-1">
                {alerts.map((a, i) => (
                  <li key={i} className="text-sm text-rose-500 dark:text-rose-400">
                    <Link href={a.href} className="hover:underline">
                      {a.description}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-sm text-[var(--dev-text)]">No active alerts.</span>
            )}
          </DevField>
        </div>
      </div>

      <div id="ecc-dependencies" className="mt-4 scroll-mt-24 border-t border-[var(--dev-border)] pt-4">
        <DevSectionLabel>Dependencies</DevSectionLabel>
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DevField label="Critical Path">
            <p className="text-sm text-[var(--dev-text)]">
              {dependencies.criticalPathProject?.reason ?? 'No project is currently the critical path.'}
            </p>
          </DevField>
          <DevField label="Recommended Next Executable Task">
            {dependencies.recommendedNextExecutableTask ? (
              <Link
                href={dependencies.recommendedNextExecutableTask.href}
                className="text-sm text-[var(--dev-text)] hover:text-[var(--dev-accent)]"
              >
                {dependencies.recommendedNextExecutableTask.label}
              </Link>
            ) : (
              <span className="text-sm text-[var(--dev-text-faint)]">Nothing executable right now.</span>
            )}
          </DevField>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <DevField label="Current Blockers">
            <span className={`font-mono text-sm ${dependencies.blockers.length > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-[var(--dev-text)]'}`}>
              {dependencies.blockers.length}
            </span>
          </DevField>
          <DevField label="Ready Work">
            <span className="font-mono text-sm text-[var(--dev-text)]">{dependencies.readyWork.length}</span>
          </DevField>
          <DevField label="Waiting Work">
            <span className="font-mono text-sm text-[var(--dev-text)]">{dependencies.waitingWork.length}</span>
          </DevField>
        </div>
        <div className="mt-3">
          <DevField label="Dependency Graph Summary">
            <p className="text-sm text-[var(--dev-text-muted)]">
              {dependencies.readyWork.length} batch{dependencies.readyWork.length === 1 ? '' : 'es'} ready &middot;{' '}
              {dependencies.waitingWork.length} waiting &middot; {dependencies.blockers.length} blocker
              {dependencies.blockers.length === 1 ? '' : 's'} for this project.
            </p>
          </DevField>
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--dev-border)] pt-4">
        <DevSectionLabel>Development Memory</DevSectionLabel>
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DevField label="Previous Objective">
            <p className="text-sm text-[var(--dev-text)]">{memory.previousObjective ?? 'Unknown'}</p>
          </DevField>
          <DevField label="Completion Status">
            <DevBadge tone={memory.completionStatus === 'Completed' ? 'success' : memory.completionStatus === 'Unknown' ? 'neutral' : 'warning'}>
              {memory.completionStatus}
            </DevBadge>
          </DevField>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DevField label="Development Drift">
            <DevBadge tone={memory.drift === 'No Drift' ? 'success' : memory.drift === 'Minor Drift' ? 'warning' : 'danger'}>
              {memory.drift}
            </DevBadge>
            <p className="mt-1 text-xs text-[var(--dev-text-faint)]">{memory.driftExplanation}</p>
          </DevField>
          <DevField label="Development Momentum">
            <DevBadge
              tone={
                memory.momentum === 'Accelerating'
                  ? 'success'
                  : memory.momentum === 'Steady'
                    ? 'info'
                    : memory.momentum === 'Slowing'
                      ? 'warning'
                      : 'danger'
              }
            >
              {memory.momentum}
            </DevBadge>
          </DevField>
        </div>
        <div className="mt-3">
          <DevField label="Executive Continuity Summary">
            <p className="text-sm leading-relaxed text-[var(--dev-text-muted)]">{memory.continuitySummary}</p>
          </DevField>
        </div>
        <div className="mt-3">
          <DevField label="Remaining Work">
            {memory.remainingWork.length > 0 ? (
              <ul className="space-y-1">
                {memory.remainingWork.slice(0, 5).map((item, i) => (
                  <li key={i} className="truncate text-sm text-[var(--dev-text)]">
                    <Link href={item.href} className="hover:text-[var(--dev-accent)]">
                      {item.source}: {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-sm text-[var(--dev-text-faint)]">Nothing outstanding.</span>
            )}
          </DevField>
        </div>
      </div>

      <ExecutiveActionQueuePanel actions={actionQueue.actions} />
      </DevCard>
      </div>

      <div className="mt-4">
        <EngineeringAssessmentPanel projectSlug={slug} git={git} build={build} />
      </div>

      <div className="mt-4">
        <PlanningCentrePanel
          projectSlug={slug}
          session={session}
          dependencies={dependencies}
          memory={memory}
          latestHandover={latestHandover}
          queue={actionQueue}
          git={git}
          build={build}
        />
      </div>
    </div>
  )
}
