'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useDevPreferences } from '@/context/dev/DevPreferencesContext'
import {
  getDevelopmentPlan,
  type ChecklistStatus,
  type DevelopmentPlan,
  type PriorityTier,
} from '@/lib/dev/aiPlanningEngine'
import { PRIORITY_LABEL } from '@/lib/dev/queueStorage'
import type { GitIntelligence } from '@/lib/dev/gitIntelligence'
import type { DeploymentIntelligence } from '@/lib/dev/deploymentIntelligence'
import type { BuildIntelligence } from '@/lib/dev/buildIntelligence'
import { DevBadge, DevButton, DevCard, DevCardHeader, DevField, DevSkeleton } from './ui'

const PRIORITY_TONE: Record<PriorityTier, 'danger' | 'warning' | 'info' | 'neutral'> = {
  Critical: 'danger',
  High: 'warning',
  Medium: 'info',
  Low: 'neutral',
}

const CHECKLIST_TONE: Record<ChecklistStatus, 'success' | 'danger' | 'warning' | 'neutral'> = {
  Passed: 'success',
  Failed: 'danger',
  Attention: 'warning',
  Pending: 'neutral',
}

/**
 * Development Plan — one panel, driven entirely by
 * lib/dev/aiPlanningEngine.ts. Used on the Dashboard (default project) and
 * every Project Workspace (that project), same as every other intelligence
 * card in VYRON DEV.
 */
export function DevelopmentPlanPanel({
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
  const [plan, setPlan] = useState<DevelopmentPlan | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setPlan(getDevelopmentPlan(slug, { buildStatus, typescriptStatus, git, deployment, build }))
  }, [slug, buildStatus, typescriptStatus, git, deployment, build])

  const ready = plan !== null && (Boolean(projectSlug) || prefsHydrated)

  if (!ready) {
    return (
      <DevCard>
        <DevSkeleton className="h-3 w-32" />
        <DevSkeleton className="mt-4 h-5 w-72" />
        <DevSkeleton className="mt-3 h-4 w-full" />
      </DevCard>
    )
  }

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(plan.suggestedClaudePrompt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <DevCard>
      <DevCardHeader title="Development Plan" />
      <p className="mt-2 text-base font-semibold leading-snug text-[var(--dev-text)]">{plan.currentGoal}</p>

      <div className="mt-4 grid grid-cols-1 gap-4 border-t border-[var(--dev-border)] pt-4 sm:grid-cols-2">
        <DevField label="Current Objective">
          <p className="text-sm text-[var(--dev-text)]">{plan.currentObjective ?? 'No objective set'}</p>
        </DevField>
        <DevField label="Development Priority">
          {plan.developmentPriorities[0] ? (
            <Link
              href={plan.developmentPriorities[0].href}
              className="flex items-center justify-between gap-2 hover:text-[var(--dev-accent)]"
            >
              <span className="truncate text-sm text-[var(--dev-text)]">{plan.developmentPriorities[0].label}</span>
              <DevBadge tone={PRIORITY_TONE[plan.developmentPriorities[0].tier]}>{plan.developmentPriorities[0].tier}</DevBadge>
            </Link>
          ) : (
            <span className="text-sm text-[var(--dev-text-faint)]">Nothing pending.</span>
          )}
        </DevField>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 border-t border-[var(--dev-border)] pt-4 sm:grid-cols-2">
        <DevField label="Recommended Next Task">
          {plan.recommendedNextTask.task ? (
            <Link
              href={`/dev/queue?focus=${plan.recommendedNextTask.task.id}`}
              className="flex items-center justify-between gap-2 hover:text-[var(--dev-accent)]"
            >
              <span className="truncate text-sm text-[var(--dev-text)]">{plan.recommendedNextTask.task.title}</span>
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
            <p className="text-sm text-[var(--dev-text)]">{plan.recommendedNextTask.reason}</p>
          )}
          <p className="mt-1 text-xs text-[var(--dev-text-faint)]">{plan.recommendedNextTask.reason}</p>
        </DevField>
        <DevField label="Recommended Next Batch">
          <p className="text-sm text-[var(--dev-text)]">{plan.recommendedNextBatch.label ?? 'Not enough context yet'}</p>
          <p className="mt-1 text-xs text-[var(--dev-text-faint)]">{plan.recommendedNextBatch.reason}</p>
        </DevField>
      </div>

      {plan.developmentPriorities.length > 0 ? (
        <div className="mt-4 border-t border-[var(--dev-border)] pt-4">
          <DevField label={`Development Priorities (${plan.developmentPriorities.length})`}>
            <ul className="mt-1 space-y-1.5">
              {plan.developmentPriorities.slice(0, 6).map((item, idx) => (
                <li key={`${item.tier}-${idx}-${item.label}`}>
                  <Link href={item.href} className="flex items-center justify-between gap-2 text-sm text-[var(--dev-text)] hover:text-[var(--dev-accent)]">
                    <span className="truncate">{item.label}</span>
                    <DevBadge tone={PRIORITY_TONE[item.tier]}>{item.tier}</DevBadge>
                  </Link>
                </li>
              ))}
            </ul>
          </DevField>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[var(--dev-border)] pt-4">
        <DevField label="Blocking Risks">
          <Link href="/dev/risks" className={`font-mono text-sm hover:text-[var(--dev-accent)] ${plan.blockingRisks.length > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-[var(--dev-text)]'}`}>
            {plan.blockingRisks.length}
          </Link>
        </DevField>
        <DevField label="Technical Debt">
          <Link href="/dev/technical-debt" className={`font-mono text-sm hover:text-[var(--dev-accent)] ${plan.technicalDebt.length > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-[var(--dev-text)]'}`}>
            {plan.technicalDebt.length}
          </Link>
        </DevField>
      </div>

      <div className="mt-4 border-t border-[var(--dev-border)] pt-4">
        <DevField label="Validation Checklist">
          <ul className="mt-1 space-y-1.5">
            {plan.validationChecklist.map(item => (
              <li key={item.label} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-[var(--dev-text)]">{item.label}</span>
                <DevBadge tone={CHECKLIST_TONE[item.status]}>{item.status}</DevBadge>
              </li>
            ))}
          </ul>
        </DevField>
      </div>

      <div className="mt-4 border-t border-[var(--dev-border)] pt-4">
        <DevField label="Git Checklist">
          <ul className="mt-1 space-y-1.5">
            {plan.gitChecklist.map(item => (
              <li key={item.label} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-[var(--dev-text)]">{item.label}</span>
                <DevBadge tone={CHECKLIST_TONE[item.status]}>{item.status}</DevBadge>
              </li>
            ))}
          </ul>
        </DevField>
      </div>

      <div className="mt-4 border-t border-[var(--dev-border)] pt-4">
        <DevField label="Deployment Checklist">
          <ul className="mt-1 space-y-1.5">
            {plan.deploymentChecklist.map(item => (
              <li key={item.label} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-[var(--dev-text)]">{item.label}</span>
                <DevBadge tone={CHECKLIST_TONE[item.status]}>{item.status}</DevBadge>
              </li>
            ))}
          </ul>
        </DevField>
      </div>

      <div className="mt-4 border-t border-[var(--dev-border)] pt-4">
        <DevField label="Build Checklist">
          <ul className="mt-1 space-y-1.5">
            {plan.buildChecklist.map(item => (
              <li key={item.label} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-[var(--dev-text)]">{item.label}</span>
                <DevBadge tone={CHECKLIST_TONE[item.status]}>{item.status}</DevBadge>
              </li>
            ))}
          </ul>
        </DevField>
      </div>

      <div className="mt-4 border-t border-[var(--dev-border)] pt-4">
        <DevField label="Definition of Done">
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-[var(--dev-text-muted)]">
            {plan.definitionOfDone.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </DevField>
      </div>

      <div className="mt-4 border-t border-[var(--dev-border)] pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-text-faint)]">
            Suggested Claude Prompt
          </div>
          <DevButton variant="secondary" onClick={handleCopyPrompt}>
            {copied ? 'Copied' : 'Copy'}
          </DevButton>
        </div>
        <pre className="mt-2 max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-black/20 p-3 font-mono text-[12px] leading-relaxed text-[var(--dev-text-muted)]">
          {plan.suggestedClaudePrompt}
        </pre>
      </div>
    </DevCard>
  )
}
