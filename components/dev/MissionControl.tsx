'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { DevelopmentSession } from '@/lib/dev/developmentOrchestrator'
import type { ExecutiveActionQueue } from '@/lib/dev/executiveActionEngine'
import type { GeneratedPrompt } from '@/lib/dev/promptIntelligenceEngine'
import { copyToClipboard, DevBadge, devValidationTone } from './ui'

const ACTION_BUTTON_CLASS =
  'block w-full rounded-lg px-4 py-3.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90'

const PRIORITY_TONE: Record<string, 'danger' | 'warning' | 'info' | 'neutral'> = {
  Critical: 'danger',
  High: 'warning',
  Medium: 'info',
  Low: 'neutral',
}

/**
 * Mission Control — now entirely driven by the Executive Action Engine.
 * Exactly one of two states is shown: an action to resolve (topAction !==
 * null) or the ready state once every Critical/High action is gone. Only
 * one primary button is ever rendered.
 */
export function MissionControl({
  session,
  queue,
  generatedPrompt,
}: {
  session: DevelopmentSession
  queue: ExecutiveActionQueue
  generatedPrompt: GeneratedPrompt
}) {
  const [copied, setCopied] = useState(false)
  const { topAction, focus } = queue

  const handleCopyPrompt = async () => {
    const ok = await copyToClipboard(generatedPrompt.fullText)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--dev-accent)]/30 bg-[var(--dev-accent-soft)] p-5">
      {topAction ? (
        <>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-accent)]">
            Today&apos;s Executive Action
          </div>
          <div className="mt-3 flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-[var(--dev-text)]">{topAction.title}</h3>
            <DevBadge tone={PRIORITY_TONE[topAction.priority]}>{topAction.priority}</DevBadge>
          </div>
          <p className="mt-1.5 text-sm text-[var(--dev-text-muted)]">{topAction.reason}</p>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MissionField label="Recommended Action" value={topAction.recommendedAction} />
            <MissionField label="Estimated Impact" value={topAction.estimatedImpact} />
          </div>
          <div className="mt-3">
            <MissionField label="Executive Focus" value={focus} />
          </div>

          <div className="mt-4">
            <Link
              href={topAction.href}
              className={`${ACTION_BUTTON_CLASS} ${
                topAction.category === 'Validation' ? 'bg-gradient-to-r from-rose-500 to-rose-600' : 'bg-gradient-to-r from-amber-500 to-amber-600'
              }`}
            >
              {topAction.category === 'Validation' ? 'RUN VALIDATION' : 'VIEW CURRENT BLOCKERS'}
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-accent)]">
            Ready To Continue Development
          </div>
          <div className="mt-3">
            <MissionField label="Executive Focus" value={focus} />
          </div>
          <div className="mt-4">
            <button type="button" onClick={handleCopyPrompt} className={`${ACTION_BUTTON_CLASS} bg-gradient-to-r from-sky-500 to-blue-600`}>
              {copied ? 'COPIED' : "COPY TODAY'S CLAUDE PROMPT"}
            </button>
          </div>
        </>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatusPill label="Build" tone={devValidationTone(session.buildStatus)} value={session.buildStatus} />
        <StatusPill label="TypeScript" tone={devValidationTone(session.typescriptStatus)} value={session.typescriptStatus} />
        <StatusPill
          label="Git"
          tone={session.gitWorkingTreeStatus === 'Clean' ? 'success' : session.gitWorkingTreeStatus === 'Unknown' ? 'neutral' : 'danger'}
          value={session.gitWorkingTreeStatus}
        />
        <StatusPill label="Deployment" tone={session.deploymentStatus === 'Available' ? 'success' : 'warning'} value={session.deploymentStatus} />
      </div>
    </div>
  )
}

function MissionField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-[var(--dev-text-faint)]">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-[var(--dev-text)]">{value}</div>
    </div>
  )
}

function StatusPill({ label, value, tone }: { label: string; value: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--dev-border)] px-2.5 py-1.5">
      <span className="text-[11px] text-[var(--dev-text-faint)]">{label}</span>
      <DevBadge tone={tone}>{value}</DevBadge>
    </div>
  )
}
