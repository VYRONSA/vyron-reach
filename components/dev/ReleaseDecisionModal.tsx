'use client'

import { useEffect, useState } from 'react'
import { DevBadge, DevButton, DevSectionLabel, DevTextarea } from './ui'
import type { ReleaseControlDecisionType, ReleaseRequest } from '@/lib/dev/director/releaseManagement/releaseManagementTypes'

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  const body = await res.json()
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`)
  return body as T
}

const ACTIVITY_TONE: Record<string, 'success' | 'danger' | 'neutral' | 'warning'> = {
  Passed: 'success',
  Failed: 'danger',
  'Not Applicable': 'neutral',
  Skipped: 'neutral',
}

/**
 * PRA-P1-032 remediation — the Executive Release Go/Hold decision panel.
 * Before this existed, the ONLY UI action available for a
 * "Release Go/Hold Required" Engineering Inbox item was the generic
 * Approve/Reject buttons, which never called
 * POST /api/dev/director/[project]/release/[releaseId]/decision — the
 * one route through which a real Go/Hold decision can ever be recorded
 * (see that route's own doc comment). A CEO clicking "Approve" believed
 * they had approved the release; in reality the release stayed
 * 'Prepared' forever. This modal is a thin, purely presentational caller
 * of that same unchanged endpoint — it never decides anything itself,
 * never touches git/gh/vercel, and never retries automatically (Hold
 * simply records Hold; Go's real mutating sequence is entirely the
 * server's, exactly as before).
 */
export function ReleaseDecisionModal({
  project,
  onClose,
  onDecided,
}: {
  project: string
  onClose: () => void
  onDecided: () => void
}) {
  const [releases, setReleases] = useState<ReleaseRequest[] | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState<ReleaseControlDecisionType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = () =>
    fetchJson<{ releases: ReleaseRequest[] }>(`/api/dev/director/${encodeURIComponent(project)}/release`)
      .then(({ releases }) => setReleases(releases))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load release status.'))

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project])

  const release = releases?.find(r => r.status === 'Prepared') ?? releases?.[0] ?? null

  async function decide(decision: ReleaseControlDecisionType) {
    if (!release || !reason.trim()) {
      setError('A reason is required.')
      return
    }
    setSubmitting(decision)
    setError(null)
    try {
      await fetchJson(`/api/dev/director/${encodeURIComponent(project)}/release/${encodeURIComponent(release.id)}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reason }),
      })
      onDecided()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record the decision.')
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-[6vh]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-[var(--dev-border-strong)] bg-[var(--dev-surface)] shadow-2xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Executive Release Go/Hold Decision"
      >
        <div className="flex items-center justify-between border-b border-[var(--dev-border)] px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-[var(--dev-text)]">Executive Release Decision</div>
            <p className="mt-0.5 text-xs text-[var(--dev-text-faint)]">{project}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--dev-border-strong)] px-2 py-1 text-xs text-[var(--dev-text-muted)] transition-colors hover:border-[var(--dev-accent)]/40 hover:text-[var(--dev-text)]"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          {error ? <p className="text-sm text-rose-500 dark:text-rose-400">{error}</p> : null}

          {!releases ? (
            <p className="text-sm text-[var(--dev-text-faint)]">Loading release status…</p>
          ) : !release ? (
            <p className="text-sm text-[var(--dev-text-faint)]">No release found for this project.</p>
          ) : release.status !== 'Prepared' ? (
            <div className="rounded-xl border border-[var(--dev-border)] p-4">
              <p className="text-sm text-[var(--dev-text)]">
                Release v{release.version} is already <DevBadge tone="neutral">{release.status}</DevBadge> — no decision is pending.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--dev-border)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--dev-text)]">Release v{release.version}</span>
                <DevBadge tone={release.preparationReport.passed ? 'success' : 'danger'}>
                  {release.preparationReport.passed ? 'Preparation Passed' : 'Preparation Found Issues'}
                </DevBadge>
              </div>
              <p className="mt-1 font-mono text-xs text-[var(--dev-text-muted)]">{release.branchName}</p>

              <div className="mt-3">
                <DevSectionLabel>Preparation Report</DevSectionLabel>
                <ul className="mt-1 space-y-1">
                  {release.preparationReport.activities.map((a, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-[var(--dev-text)]">{a.activity}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-[var(--dev-text-faint)]">{a.summary}</span>
                        <DevBadge tone={ACTIVITY_TONE[a.status] ?? 'neutral'}>{a.status}</DevBadge>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <DevSectionLabel>Reason (required, recorded permanently)</DevSectionLabel>
                <DevTextarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Reason for this Go/Hold decision" />
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <DevButton variant="secondary" onClick={() => decide('Hold')} disabled={submitting !== null}>
                  {submitting === 'Hold' ? 'Recording…' : 'Hold'}
                </DevButton>
                <DevButton onClick={() => decide('Go')} disabled={submitting !== null}>
                  {submitting === 'Go' ? 'Recording…' : 'Go — Execute Release'}
                </DevButton>
              </div>

              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Go kicks off the real commit/branch/push/PR/deployment sequence immediately. Builds and releases are never retried
                  automatically — governance is unchanged by this panel.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
