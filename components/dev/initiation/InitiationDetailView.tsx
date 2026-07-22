'use client'

import { useEffect, useState } from 'react'
import { DevButton, DevCard, DevCardHeader, DevPageHeader, DevRow } from '../ui'
import { InitiationStatusBadge } from './InitiationStatusBadge'
import { InitiationAssessmentPanel } from './InitiationAssessmentPanel'
import { InitiationKnowledgeDiscoveryPanel } from './InitiationKnowledgeDiscoveryPanel'
import { InitiationReviewBoard } from './InitiationReviewBoard'
import { InitiationRiskGatePanel } from './InitiationRiskGatePanel'
import { InitiationProvisioningPanel } from './InitiationProvisioningPanel'
import { InitiationExecutiveControlPanel } from './InitiationExecutiveControlPanel'
import { useDashboardEvents } from '../realtime/useDashboardEvents'
import type { InitiationRequest } from '@/lib/dev/initiation/initiationTypes'

async function fetchInitiation(id: string): Promise<InitiationRequest> {
  const res = await fetch(`/api/dev/initiation/${id}`)
  if (!res.ok) throw new Error(`Failed to load initiation (${res.status})`)
  const body = await res.json()
  return body.initiation as InitiationRequest
}

/**
 * The state-driven wizard controller (Steps 2-5): Draft -> Generating ->
 * Review -> Approved/Provisioning -> Provisioned, or GenerationFailed /
 * ProvisioningFailed / Cancelled at any point. Subscribes to the
 * 'Project Initiation' event category so Generating/Provisioning resolve
 * live via SSE without polling — the same pattern SchedulerStatusPanel
 * uses for 'Scheduler Activity'.
 */
export function InitiationDetailView({ id }: { id: string }) {
  const [initiation, setInitiation] = useState<InitiationRequest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [unresolvedRiskCount, setUnresolvedRiskCount] = useState(0)

  const refresh = () => fetchInitiation(id).then(setInitiation).catch(err => setError(err instanceof Error ? err.message : 'Failed to load.'))

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useDashboardEvents({
    project: initiation?.project,
    categories: ['Project Initiation'],
    onEvent: event => {
      if (event.payload.initiationId === id) refresh()
    },
  })

  async function handleGenerate() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/dev/initiation/${id}/generate`, { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? `Generation failed (${res.status}).`)
      setInitiation(body.initiation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.')
    } finally {
      setBusy(false)
    }
  }

  async function handleCancel() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/dev/initiation/${id}/cancel`, { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? `Cancel failed (${res.status}).`)
      setInitiation(body.initiation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed.')
    } finally {
      setBusy(false)
    }
  }

  if (!initiation) {
    return (
      <div>
        <DevPageHeader eyebrow="Project Initiation" title="Loading…" />
        {error ? <p className="text-sm text-rose-500 dark:text-rose-400">{error}</p> : null}
      </div>
    )
  }

  const canCancel = !['Provisioned', 'Cancelled'].includes(initiation.status)

  return (
    <div>
      <DevPageHeader
        eyebrow="Project Initiation"
        title={initiation.directiveTitle}
        description={`Project: ${initiation.project}`}
        actions={
          <span className="flex items-center gap-2">
            <InitiationStatusBadge status={initiation.status} />
            {canCancel ? (
              <DevButton variant="danger" onClick={handleCancel} disabled={busy}>
                Cancel
              </DevButton>
            ) : null}
          </span>
        }
      />

      {error ? <p className="mb-4 text-sm text-rose-500 dark:text-rose-400">{error}</p> : null}

      <div className="space-y-6">
        {(initiation.status === 'Draft' || initiation.status === 'GenerationFailed') && (
          <DevCard>
            <DevCardHeader title="Executive Directive" />
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--dev-text)]">{initiation.directiveText}</p>
            {initiation.status === 'GenerationFailed' && initiation.lastGenerationError ? (
              <p className="mt-3 text-sm text-rose-500 dark:text-rose-400">
                Generation attempt {initiation.generationAttempts} failed: {initiation.lastGenerationError}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end">
              <DevButton onClick={handleGenerate} disabled={busy}>
                {busy ? 'Generating…' : initiation.status === 'GenerationFailed' ? 'Retry Generation' : 'Generate Programme'}
              </DevButton>
            </div>
          </DevCard>
        )}

        {initiation.status === 'GenerationFailed' && initiation.knowledgeDiscovery ? (
          <InitiationKnowledgeDiscoveryPanel discovery={initiation.knowledgeDiscovery} />
        ) : null}

        {initiation.status === 'Generating' && (
          <DevCard>
            <DevCardHeader title="Generating…" />
            <p className="mt-3 text-sm text-[var(--dev-text-muted)]">Calling the Initiation Assessor to turn this directive into a structured programme.</p>
          </DevCard>
        )}

        {initiation.status === 'Review' && initiation.reviewedProgramme && (
          <>
            <InitiationAssessmentPanel assessment={initiation.reviewedProgramme.assessment} />
            {initiation.knowledgeDiscovery ? <InitiationKnowledgeDiscoveryPanel discovery={initiation.knowledgeDiscovery} /> : null}
            <InitiationReviewBoard initiation={initiation} onUpdated={setInitiation} />
          </>
        )}

        {['Approved', 'Provisioning', 'Provisioned', 'ProvisioningFailed'].includes(initiation.status) && (
          <>
            {initiation.reviewedProgramme ? <InitiationAssessmentPanel assessment={initiation.reviewedProgramme.assessment} /> : null}
            {initiation.knowledgeDiscovery ? <InitiationKnowledgeDiscoveryPanel discovery={initiation.knowledgeDiscovery} /> : null}
            {['Approved', 'ProvisioningFailed'].includes(initiation.status) && (
              <InitiationRiskGatePanel
                initiation={initiation}
                onUpdated={setInitiation}
                onStatusLoaded={s => setUnresolvedRiskCount(s.unresolvedHighRisks.length)}
              />
            )}
            <InitiationProvisioningPanel
              initiation={initiation}
              onUpdated={setInitiation}
              blockedByRiskGate={initiation.status === 'Approved' && unresolvedRiskCount > 0}
            />
            {initiation.status === 'Provisioned' && <InitiationExecutiveControlPanel initiation={initiation} onUpdated={setInitiation} />}
          </>
        )}

        {initiation.status === 'Cancelled' && (
          <DevCard>
            <DevCardHeader title="Cancelled" />
            <DevRow label="Cancelled by" value={initiation.cancelledBy ?? 'Unknown'} />
            <DevRow label="Cancelled at" value={initiation.cancelledAt ? new Date(initiation.cancelledAt).toLocaleString() : 'Unknown'} />
          </DevCard>
        )}
      </div>
    </div>
  )
}
