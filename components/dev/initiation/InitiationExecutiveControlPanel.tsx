'use client'

import { useEffect, useState } from 'react'
import { DevBadge, DevButton, DevCard, DevCardHeader, DevSelect, DevTextarea } from '../ui'
import type { ExecutiveControlDecision, ExecutiveControlDecisionType, InitiationRequest } from '@/lib/dev/initiation/initiationTypes'

type ExecutiveControlStatus = { started: boolean; decisions: ExecutiveControlDecision[] }

async function fetchExecutiveControlStatus(id: string): Promise<ExecutiveControlStatus> {
  const res = await fetch(`/api/dev/initiation/${id}/executive-control`)
  if (!res.ok) throw new Error(`Failed to load executive control status (${res.status})`)
  return res.json()
}

const DECISION_OPTIONS: ExecutiveControlDecisionType[] = ['Go', 'Hold']
const DECISION_HINT: Record<ExecutiveControlDecisionType, string> = {
  Go: 'Starts autonomous execution now, using the existing handoff mechanism.',
  Hold: 'Leaves the project fully provisioned — nothing starts. Go can be decided later without reprovisioning.',
}

/**
 * The mandatory Executive Go / Hold checkpoint (requirement 1) — rendered
 * whenever the InitiationRequest is Provisioned. Provisioning itself no
 * longer starts autonomous execution; this is the only place that does,
 * and only after an explicit Go.
 */
export function InitiationExecutiveControlPanel({ initiation, onUpdated }: { initiation: InitiationRequest; onUpdated: (next: InitiationRequest) => void }) {
  const [status, setStatus] = useState<ExecutiveControlStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [decision, setDecision] = useState<ExecutiveControlDecisionType>('Go')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const refresh = () => fetchExecutiveControlStatus(initiation.id).then(setStatus).catch(err => setError(err instanceof Error ? err.message : 'Failed to load.'))

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initiation.id])

  async function handleSubmit() {
    if (!reason.trim()) {
      setError('A reason is required.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/dev/initiation/${initiation.id}/executive-control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reason }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? `Failed to submit decision (${res.status}).`)
      onUpdated(body.initiation)
      setReason('')
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit decision.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!status) return null

  return (
    <DevCard>
      <DevCardHeader
        title="Executive Go / Hold Control"
        badge={<DevBadge tone={status.started ? 'success' : 'warning'}>{status.started ? 'Execution started' : 'On Hold'}</DevBadge>}
      />

      {error ? <p className="mt-2 text-sm text-rose-500 dark:text-rose-400">{error}</p> : null}

      {status.started ? (
        <p className="mt-3 text-sm text-[var(--dev-text-muted)]">
          Autonomous execution has started for this project — visible in its Command Centre. No further decision is needed.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-[var(--dev-text-muted)]">
            This project is fully provisioned but autonomous execution has not started. Decide whether to begin now (Go) or leave it on Hold — a
            Hold can be followed by Go later without reprovisioning.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
            <div>
              <DevSelect value={decision} onChange={e => setDecision(e.target.value as ExecutiveControlDecisionType)}>
                {DECISION_OPTIONS.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </DevSelect>
              <p className="mt-1.5 text-xs text-[var(--dev-text-faint)]">{DECISION_HINT[decision]}</p>
            </div>
            <DevTextarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Reason for this decision (required, recorded permanently)" />
          </div>
          <div className="flex justify-end">
            <DevButton onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : `Submit ${decision}`}
            </DevButton>
          </div>
        </div>
      )}

      {status.decisions.length > 0 ? (
        <div className="mt-5 border-t border-[var(--dev-border)] pt-4">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-text-faint)]">Governance history</div>
          <ul className="mt-2 space-y-2">
            {status.decisions.map(d => (
              <li key={d.id} className="text-xs text-[var(--dev-text-muted)]">
                <span className="font-medium text-[var(--dev-text)]">{d.decision}</span> by {d.executive} on {new Date(d.decidedAt).toLocaleString()} —{' '}
                {d.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </DevCard>
  )
}
