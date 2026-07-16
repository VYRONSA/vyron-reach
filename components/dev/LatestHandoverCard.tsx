'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getLatestHandover, type Handover } from '@/lib/dev/handoverStorage'
import { getBatches, type Batch } from '@/lib/dev/batchesStorage'
import { DevBadge, DevCard, DevEmptyState, devValidationTone } from './ui'

/**
 * Latest Claude Activity — the single presentation of the most recent
 * handover for a project. Used verbatim on the Dashboard (default project)
 * and every Project Workspace (that project), so this is the only place
 * handover summaries are rendered.
 */
export function LatestHandoverCard({ projectSlug }: { projectSlug: string }) {
  const [handover, setHandover] = useState<Handover | null | undefined>(undefined)
  const [batches, setBatches] = useState<Batch[]>([])

  useEffect(() => {
    setHandover(getLatestHandover(projectSlug))
    setBatches(getBatches())
  }, [projectSlug])

  if (handover === undefined) {
    return (
      <DevCard eyebrow="Claude" title="Latest Claude Activity">
        <div className="mt-2 text-sm text-[var(--dev-text-faint)]">Loading...</div>
      </DevCard>
    )
  }

  if (!handover) {
    return (
      <DevCard eyebrow="Claude" title="Latest Claude Activity">
        <DevEmptyState>No handovers logged yet for this project.</DevEmptyState>
        <Link href="/dev/handovers" className="mt-2 inline-block text-xs text-[var(--dev-accent)] hover:underline">
          Log a handover &rarr;
        </Link>
      </DevCard>
    )
  }

  const batch = batches.find(b => b.id === handover.relatedBatch)
  const batchLabel = batch ? `Batch ${batch.batchNumber}` : handover.phase || 'Unlabelled batch'
  const filesChanged = handover.filesCreated.length + handover.filesModified.length + handover.filesDeleted.length

  return (
    <DevCard eyebrow="Claude" title="Latest Claude Activity">
      <div className="mt-2 flex items-center justify-between gap-2">
        <Link
          href={`/dev/handovers?focus=${handover.id}`}
          className="truncate text-sm font-medium text-[var(--dev-text)] hover:text-[var(--dev-accent)]"
        >
          {batchLabel}
        </Link>
        <span className="shrink-0 text-[11px] text-[var(--dev-text-faint)]">{handover.date}</span>
      </div>

      {handover.executiveSummary ? (
        <p className="mt-2 text-xs leading-relaxed text-[var(--dev-text-muted)]">{handover.executiveSummary}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <DevBadge tone={devValidationTone(handover.buildStatus)}>Build: {handover.buildStatus}</DevBadge>
        <DevBadge tone={devValidationTone(handover.typescriptStatus)}>TypeScript: {handover.typescriptStatus}</DevBadge>
        <DevBadge tone={devValidationTone(handover.runtimeStatus)}>Runtime: {handover.runtimeStatus}</DevBadge>
      </div>

      <div className="mt-3 text-xs text-[var(--dev-text-faint)]">
        {filesChanged} file{filesChanged === 1 ? '' : 's'} changed — {handover.filesCreated.length} created ·{' '}
        {handover.filesModified.length} modified · {handover.filesDeleted.length} deleted
      </div>

      {handover.recommendations ? (
        <div className="mt-3 border-t border-[var(--dev-border)] pt-3">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-text-faint)]">
            Recommendations
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[var(--dev-text-muted)]">{handover.recommendations}</p>
        </div>
      ) : null}

      {handover.nextSuggestedBatch ? (
        <div className="mt-2 text-xs text-[var(--dev-text-faint)]">
          <span className="font-medium text-[var(--dev-text)]">Next suggested:</span> {handover.nextSuggestedBatch}
        </div>
      ) : null}
    </DevCard>
  )
}
