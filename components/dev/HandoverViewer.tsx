'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { getProjectName } from '@/lib/dev/projectsData'
import { getMilestones, type Milestone } from '@/lib/dev/milestonesStorage'
import { getBatches, type Batch } from '@/lib/dev/batchesStorage'
import type { Handover } from '@/lib/dev/handoverStorage'
import { DevBadge, DevButton, DevCard, devValidationTone } from './ui'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5 border-t border-[var(--dev-border)] pt-4 first:mt-0 first:border-0 first:pt-0">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-accent)]">{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function FileList({ label, files }: { label: string; files: string[] }) {
  if (files.length === 0) return null
  return (
    <div>
      <div className="text-xs font-medium text-[var(--dev-text)]">
        {label} ({files.length})
      </div>
      <ul className="mt-1 space-y-0.5 font-mono text-[12px] text-[var(--dev-text-muted)]">
        {files.map(f => (
          <li key={f} className="truncate">
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function HandoverViewer({
  handover,
  onEdit,
  onDelete,
  onBack,
}: {
  handover: Handover
  onEdit: () => void
  onDelete: () => void
  onBack: () => void
}) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [batches, setBatches] = useState<Batch[]>([])

  useEffect(() => {
    setMilestones(getMilestones())
    setBatches(getBatches())
  }, [])

  const milestone = milestones.find(m => m.id === handover.relatedMilestone)
  const batch = batches.find(b => b.id === handover.relatedBatch)
  const totalFiles = handover.filesCreated.length + handover.filesModified.length + handover.filesDeleted.length

  return (
    <DevCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button type="button" onClick={onBack} className="text-xs text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]">
            &larr; Back to handovers
          </button>
          <h2 className="mt-2 text-lg font-semibold text-[var(--dev-text)]">
            {handover.phase || 'Untitled handover'}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--dev-text-faint)]">
            <span>{getProjectName(handover.project, 'Unassigned')}</span>
            {milestone ? <span>· {milestone.title}</span> : null}
            {batch ? <span>· Batch {batch.batchNumber}</span> : null}
            <span>· {handover.date}</span>
            {handover.claudeModel ? <span>· {handover.claudeModel}</span> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <DevButton variant="secondary" onClick={onEdit}>
            Edit
          </DevButton>
          <DevButton variant="danger" onClick={onDelete}>
            Delete
          </DevButton>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DevBadge tone={devValidationTone(handover.buildStatus)}>Build: {handover.buildStatus}</DevBadge>
        <DevBadge tone={devValidationTone(handover.typescriptStatus)}>TypeScript: {handover.typescriptStatus}</DevBadge>
        <DevBadge tone={devValidationTone(handover.runtimeStatus)}>Runtime: {handover.runtimeStatus}</DevBadge>
      </div>

      {handover.objective ? (
        <Section title="Objective">
          <p className="text-sm text-[var(--dev-text)]">{handover.objective}</p>
        </Section>
      ) : null}

      {handover.executiveSummary ? (
        <Section title="Executive Summary">
          <p className="text-sm leading-relaxed text-[var(--dev-text)]">{handover.executiveSummary}</p>
        </Section>
      ) : null}

      {totalFiles > 0 || handover.sqlScriptsAdded.length > 0 ? (
        <Section title={`Changes (${totalFiles} file${totalFiles === 1 ? '' : 's'})`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FileList label="Created" files={handover.filesCreated} />
            <FileList label="Modified" files={handover.filesModified} />
            <FileList label="Deleted" files={handover.filesDeleted} />
            <FileList label="SQL scripts added" files={handover.sqlScriptsAdded} />
          </div>
        </Section>
      ) : null}

      {handover.risksIdentified ? (
        <Section title="Risks Identified">
          <p className="text-sm leading-relaxed text-[var(--dev-text-muted)]">{handover.risksIdentified}</p>
        </Section>
      ) : null}

      {handover.recommendations ? (
        <Section title="Recommendations">
          <p className="text-sm leading-relaxed text-[var(--dev-text-muted)]">{handover.recommendations}</p>
        </Section>
      ) : null}

      {handover.nextSuggestedBatch ? (
        <Section title="Next Suggested Batch">
          <p className="text-sm text-[var(--dev-text)]">{handover.nextSuggestedBatch}</p>
        </Section>
      ) : null}

      {handover.originalPrompt ? (
        <Section title="Original Prompt">
          <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-black/20 p-3 font-mono text-[12px] leading-relaxed text-[var(--dev-text-muted)]">
            {handover.originalPrompt}
          </pre>
        </Section>
      ) : null}

      {handover.fullResponse ? (
        <Section title="Full Claude Response">
          <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-black/20 p-3 font-mono text-[12px] leading-relaxed text-[var(--dev-text-muted)]">
            {handover.fullResponse}
          </pre>
        </Section>
      ) : null}
    </DevCard>
  )
}
