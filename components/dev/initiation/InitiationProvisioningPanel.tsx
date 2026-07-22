'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DevButton, DevCard, DevCardHeader, DevRow } from '../ui'
import type { InitiationRequest } from '@/lib/dev/initiation/initiationTypes'

/**
 * Step 4/5 of the wizard: Approved -> Provisioning -> Provisioned |
 * ProvisioningFailed. The provision call is fully awaited server-side
 * (not a background job), so this component's own "in flight" state is
 * the only progress indicator needed. `blockedByRiskGate` disables the
 * button proactively — the server enforces the actual gate regardless
 * (initiationService.beginProvisioning), this is purely to avoid a
 * pointless round trip that would just come back as a 409.
 */
export function InitiationProvisioningPanel({
  initiation,
  onUpdated,
  blockedByRiskGate = false,
}: {
  initiation: InitiationRequest
  onUpdated: (next: InitiationRequest) => void
  blockedByRiskGate?: boolean
}) {
  const [provisioning, setProvisioning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleProvision() {
    setProvisioning(true)
    setError(null)
    try {
      const res = await fetch(`/api/dev/initiation/${initiation.id}/provision`, { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? `Failed to provision (${res.status}).`)
      onUpdated(body.initiation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to provision.')
    } finally {
      setProvisioning(false)
    }
  }

  if (initiation.status === 'Approved' || initiation.status === 'ProvisioningFailed') {
    return (
      <DevCard>
        <DevCardHeader title="Provision Programme" />
        <p className="mt-3 text-sm text-[var(--dev-text-muted)]">
          Commits the approved milestones, batches, risks, and dependencies into real Planning Service records and activates the project.
          Autonomous execution does not start automatically — an Executive Go/Hold decision afterward controls that.
        </p>
        {initiation.status === 'ProvisioningFailed' && initiation.provisioningError ? (
          <p className="mt-3 text-sm text-rose-500 dark:text-rose-400">Previous attempt failed: {initiation.provisioningError}</p>
        ) : null}
        {blockedByRiskGate ? (
          <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
            Blocked by the Executive Risk Gate above — every High-severity risk needs a decision before provisioning can proceed.
          </p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-rose-500 dark:text-rose-400">{error}</p> : null}
        <div className="mt-4 flex justify-end">
          <DevButton onClick={handleProvision} disabled={provisioning || blockedByRiskGate}>
            {provisioning ? 'Provisioning…' : initiation.status === 'ProvisioningFailed' ? 'Retry Provisioning' : 'Provision Now'}
          </DevButton>
        </div>
      </DevCard>
    )
  }

  if (initiation.status === 'Provisioning') {
    return (
      <DevCard>
        <DevCardHeader title="Provisioning…" />
        <p className="mt-3 text-sm text-[var(--dev-text-muted)]">Writing milestones, batches, risks, and dependencies to the Planning Service.</p>
      </DevCard>
    )
  }

  if (initiation.status === 'Provisioned') {
    const result = initiation.provisionResult
    return (
      <DevCard>
        <DevCardHeader title="Programme Provisioned" />
        <p className="mt-3 text-sm text-[var(--dev-text-muted)]">
          "{initiation.directiveTitle}" is now a real, active project. See the Executive Go / Hold Control below to decide whether autonomous
          execution starts.
        </p>
        {result ? (
          <div className="mt-4">
            <DevRow label="Milestones created" value={Object.keys(result.milestoneIdByTempId).length} />
            <DevRow label="Batches created" value={Object.keys(result.batchIdByTempId).length} />
            <DevRow label="Risks created" value={result.riskIds.length} />
            <DevRow label="Dependencies created" value={result.dependencyIds.length} />
          </div>
        ) : null}
        {initiation.provisioningError ? (
          <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">{initiation.provisioningError}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/dev/projects/${initiation.project}`}>
            <DevButton>Open Command Centre</DevButton>
          </Link>
          <Link href="/dev/milestones">
            <DevButton variant="secondary">View Milestones</DevButton>
          </Link>
          <Link href="/dev/batches">
            <DevButton variant="secondary">View Batches</DevButton>
          </Link>
        </div>
      </DevCard>
    )
  }

  return null
}
