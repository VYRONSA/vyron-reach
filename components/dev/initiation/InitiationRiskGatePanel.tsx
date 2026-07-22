'use client'

import { useEffect, useState } from 'react'
import { DevBadge, DevButton, DevCard, DevCardHeader, DevEmptyState, DevSelect, DevTextarea } from '../ui'
import type { GeneratedRiskCandidate, InitiationRequest, RiskGateDecision, RiskGateDecisionType } from '@/lib/dev/initiation/initiationTypes'

type RiskGateStatus = { unresolvedHighRisks: GeneratedRiskCandidate[]; decisions: RiskGateDecision[] }

async function fetchRiskGateStatus(id: string): Promise<RiskGateStatus> {
  const res = await fetch(`/api/dev/initiation/${id}/risk-gate`)
  if (!res.ok) throw new Error(`Failed to load risk gate status (${res.status})`)
  return res.json()
}

const DECISION_OPTIONS: RiskGateDecisionType[] = ['Accept Risk', 'Mitigate Risk', 'Reject Programme']
const DECISION_HINT: Record<RiskGateDecisionType, string> = {
  'Accept Risk': 'Acknowledges the risk and unblocks Provisioning for it — the risk remains visible in the Risk Register, marked Monitoring.',
  'Mitigate Risk': 'Sends the programme back to Review so the risk (or programme) can be reworked. Provisioning is blocked until it is re-validated and re-approved.',
  'Reject Programme': 'Sends the whole programme back to Review without accepting any risk.',
}

/**
 * The mandatory Executive Risk Gate checkpoint (requirement 1) — rendered
 * whenever the InitiationRequest is Approved. Every High-severity risk
 * must have an Accept Risk decision before /provision will succeed
 * (enforced server-side in initiationService.beginProvisioning
 * regardless of what this UI does); Mitigate Risk and Reject Programme
 * both immediately return the whole record to Review.
 */
export function InitiationRiskGatePanel({
  initiation,
  onUpdated,
  onStatusLoaded,
}: {
  initiation: InitiationRequest
  onUpdated: (next: InitiationRequest) => void
  onStatusLoaded?: (status: RiskGateStatus) => void
}) {
  const [status, setStatus] = useState<RiskGateStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [decision, setDecision] = useState<RiskGateDecisionType>('Accept Risk')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const refresh = () =>
    fetchRiskGateStatus(initiation.id)
      .then(s => {
        setStatus(s)
        onStatusLoaded?.(s)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load.'))

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initiation.id])

  function toggle(tempId: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(tempId)) next.delete(tempId)
      else next.add(tempId)
      return next
    })
  }

  async function handleSubmit() {
    if (!reason.trim()) {
      setError('A reason is required.')
      return
    }
    if (decision !== 'Reject Programme' && selected.size === 0) {
      setError('Select at least one risk this decision applies to.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/dev/initiation/${initiation.id}/risk-gate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reason, riskTempIds: Array.from(selected) }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? `Failed to submit decision (${res.status}).`)
      onUpdated(body.initiation)
      setSelected(new Set())
      setReason('')
      if (body.initiation.status === 'Approved') refresh()
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
        title="Executive Risk Gate"
        badge={
          <DevBadge tone={status.unresolvedHighRisks.length > 0 ? 'danger' : 'success'}>
            {status.unresolvedHighRisks.length > 0 ? `${status.unresolvedHighRisks.length} unresolved` : 'Clear'}
          </DevBadge>
        }
      />

      {error ? <p className="mt-2 text-sm text-rose-500 dark:text-rose-400">{error}</p> : null}

      {status.unresolvedHighRisks.length > 0 ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-[var(--dev-text-muted)]">
            Provisioning is blocked until every High-severity risk below has an Executive decision.
          </p>
          <ul className="space-y-2">
            {status.unresolvedHighRisks.map(risk => (
              <li key={risk.tempId} className="flex items-start gap-3 rounded-lg border border-[var(--dev-border)] p-3">
                <input type="checkbox" className="mt-1" checked={selected.has(risk.tempId)} onChange={() => toggle(risk.tempId)} />
                <div>
                  <div className="text-sm font-medium text-[var(--dev-text)]">{risk.title}</div>
                  <div className="text-xs text-[var(--dev-text-faint)]">{risk.description}</div>
                  <div className="mt-1 text-xs text-[var(--dev-text-muted)]">Mitigation on file: {risk.mitigation || 'none recorded'}</div>
                </div>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[200px_1fr]">
            <div>
              <DevSelect value={decision} onChange={e => setDecision(e.target.value as RiskGateDecisionType)}>
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
              {submitting ? 'Submitting…' : 'Submit Decision'}
            </DevButton>
          </div>
        </div>
      ) : (
        <DevEmptyState>No unresolved High-severity risks — Provisioning is not blocked by the Risk Gate.</DevEmptyState>
      )}

      {status.decisions.length > 0 ? (
        <div className="mt-5 border-t border-[var(--dev-border)] pt-4">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-text-faint)]">Governance history</div>
          <ul className="mt-2 space-y-2">
            {status.decisions.map(d => (
              <li key={d.id} className="text-xs text-[var(--dev-text-muted)]">
                <span className="font-medium text-[var(--dev-text)]">{d.decision}</span> by {d.executive} on {new Date(d.decidedAt).toLocaleString()} —{' '}
                {d.reason}
                {d.risks.length ? <span> (risk(s): {d.risks.map(r => r.title).join(', ')})</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </DevCard>
  )
}
