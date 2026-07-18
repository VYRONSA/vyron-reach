'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { getProjects } from '@/lib/dev/projectsData'
import { getMilestones, type Milestone } from '@/lib/dev/milestonesStorage'
import { getBatches, type Batch } from '@/lib/dev/batchesStorage'
import {
  createHandover,
  updateHandover,
  VALIDATION_STATUS_OPTIONS,
  type Handover,
  type HandoverInput,
  type ValidationStatus,
} from '@/lib/dev/handoverStorage'
import { DevButton, DevInput, DevSelect, DevTextarea } from './ui'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function toLines(value: string): string[] {
  return value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

type FormState = {
  project: string
  phase: string
  relatedMilestone: string
  relatedBatch: string
  date: string
  claudeModel: string
  objective: string
  originalPrompt: string
  fullResponse: string
  executiveSummary: string
  filesCreatedText: string
  filesModifiedText: string
  filesDeletedText: string
  sqlScriptsAddedText: string
  buildStatus: ValidationStatus
  typescriptStatus: ValidationStatus
  runtimeStatus: ValidationStatus
  risksIdentified: string
  recommendations: string
  nextSuggestedBatch: string
}

function emptyForm(projectFilter?: string): FormState {
  return {
    project: projectFilter ?? '',
    phase: '',
    relatedMilestone: '',
    relatedBatch: '',
    date: todayISO(),
    claudeModel: '',
    objective: '',
    originalPrompt: '',
    fullResponse: '',
    executiveSummary: '',
    filesCreatedText: '',
    filesModifiedText: '',
    filesDeletedText: '',
    sqlScriptsAddedText: '',
    buildStatus: 'Unknown',
    typescriptStatus: 'Unknown',
    runtimeStatus: 'Unknown',
    risksIdentified: '',
    recommendations: '',
    nextSuggestedBatch: '',
  }
}

function formFromHandover(h: Handover): FormState {
  return {
    project: h.project,
    phase: h.phase,
    relatedMilestone: h.relatedMilestone,
    relatedBatch: h.relatedBatch,
    date: h.date,
    claudeModel: h.claudeModel,
    objective: h.objective,
    originalPrompt: h.originalPrompt,
    fullResponse: h.fullResponse,
    executiveSummary: h.executiveSummary,
    filesCreatedText: h.filesCreated.join('\n'),
    filesModifiedText: h.filesModified.join('\n'),
    filesDeletedText: h.filesDeleted.join('\n'),
    sqlScriptsAddedText: h.sqlScriptsAdded.join('\n'),
    buildStatus: h.buildStatus,
    typescriptStatus: h.typescriptStatus,
    runtimeStatus: h.runtimeStatus,
    risksIdentified: h.risksIdentified,
    recommendations: h.recommendations,
    nextSuggestedBatch: h.nextSuggestedBatch,
  }
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-2 mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-accent)] first:mt-0">
      {children}
    </div>
  )
}

export function HandoverForm({
  editing,
  projectFilter,
  onDone,
  onCancel,
}: {
  editing?: Handover
  projectFilter?: string
  onDone: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<FormState>(() => (editing ? formFromHandover(editing) : emptyForm(projectFilter)))
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [batches, setBatches] = useState<Batch[]>([])

  useEffect(() => {
    setMilestones(getMilestones())
    setBatches(getBatches())
  }, [])

  const milestoneOptions = useMemo(
    () => (form.project ? milestones.filter(m => m.project === form.project) : milestones),
    [milestones, form.project]
  )
  const batchOptions = useMemo(
    () => (form.relatedMilestone ? batches.filter(b => b.milestone === form.relatedMilestone) : batches),
    [batches, form.relatedMilestone]
  )

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.executiveSummary.trim() && !form.objective.trim()) return

    const input: HandoverInput = {
      project: form.project,
      phase: form.phase.trim(),
      relatedMilestone: form.relatedMilestone,
      relatedBatch: form.relatedBatch,
      date: form.date,
      claudeModel: form.claudeModel.trim(),
      objective: form.objective.trim(),
      originalPrompt: form.originalPrompt,
      fullResponse: form.fullResponse,
      executiveSummary: form.executiveSummary.trim(),
      filesCreated: toLines(form.filesCreatedText),
      filesModified: toLines(form.filesModifiedText),
      filesDeleted: toLines(form.filesDeletedText),
      sqlScriptsAdded: toLines(form.sqlScriptsAddedText),
      buildStatus: form.buildStatus,
      typescriptStatus: form.typescriptStatus,
      runtimeStatus: form.runtimeStatus,
      risksIdentified: form.risksIdentified.trim(),
      recommendations: form.recommendations.trim(),
      nextSuggestedBatch: form.nextSuggestedBatch.trim(),
      // Manually-entered handovers never come from the Execution Runtime.
      runtimeJobId: '',
      runtimeDurationMs: null,
      runtimeCostUsd: null,
      claudeSessionId: null,
      gitDiffSummary: '',
    }

    if (editing) {
      updateHandover(editing.id, input)
    } else {
      createHandover(input)
    }
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-5">
      <SectionLabel>Context</SectionLabel>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {!projectFilter ? (
          <DevSelect
            value={form.project}
            onChange={e => setForm(prev => ({ ...prev, project: e.target.value, relatedMilestone: '', relatedBatch: '' }))}
          >
            <option value="">Unassigned</option>
            {getProjects().map(p => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </DevSelect>
        ) : null}
        <DevInput value={form.phase} onChange={e => setForm(prev => ({ ...prev, phase: e.target.value }))} placeholder="Phase, e.g. Phase 2 — Batch 3" />
        <DevInput type="date" value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <DevSelect
          value={form.relatedMilestone}
          onChange={e => setForm(prev => ({ ...prev, relatedMilestone: e.target.value, relatedBatch: '' }))}
        >
          <option value="">No linked milestone</option>
          {milestoneOptions.map(m => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </DevSelect>
        <DevSelect value={form.relatedBatch} onChange={e => setForm(prev => ({ ...prev, relatedBatch: e.target.value }))}>
          <option value="">No linked batch</option>
          {batchOptions.map(b => (
            <option key={b.id} value={b.id}>
              Batch {b.batchNumber}
            </option>
          ))}
        </DevSelect>
        <DevInput
          value={form.claudeModel}
          onChange={e => setForm(prev => ({ ...prev, claudeModel: e.target.value }))}
          placeholder="Claude model, e.g. Claude Sonnet 5"
        />
      </div>

      <SectionLabel>Prompt &amp; Response</SectionLabel>
      <DevInput
        value={form.objective}
        onChange={e => setForm(prev => ({ ...prev, objective: e.target.value }))}
        placeholder="Objective"
      />
      <DevTextarea
        className="mt-3"
        value={form.executiveSummary}
        onChange={e => setForm(prev => ({ ...prev, executiveSummary: e.target.value }))}
        placeholder="Executive summary"
        rows={3}
      />
      <DevTextarea
        className="mt-3"
        value={form.originalPrompt}
        onChange={e => setForm(prev => ({ ...prev, originalPrompt: e.target.value }))}
        placeholder="Original prompt"
        rows={4}
      />
      <DevTextarea
        className="mt-3 font-mono text-[12px]"
        value={form.fullResponse}
        onChange={e => setForm(prev => ({ ...prev, fullResponse: e.target.value }))}
        placeholder="Full Claude response"
        rows={8}
      />

      <SectionLabel>Changes</SectionLabel>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DevTextarea
          value={form.filesCreatedText}
          onChange={e => setForm(prev => ({ ...prev, filesCreatedText: e.target.value }))}
          placeholder="Files created (one per line)"
          rows={4}
          className="font-mono text-[12px]"
        />
        <DevTextarea
          value={form.filesModifiedText}
          onChange={e => setForm(prev => ({ ...prev, filesModifiedText: e.target.value }))}
          placeholder="Files modified (one per line)"
          rows={4}
          className="font-mono text-[12px]"
        />
        <DevTextarea
          value={form.filesDeletedText}
          onChange={e => setForm(prev => ({ ...prev, filesDeletedText: e.target.value }))}
          placeholder="Files deleted (one per line)"
          rows={3}
          className="font-mono text-[12px]"
        />
        <DevTextarea
          value={form.sqlScriptsAddedText}
          onChange={e => setForm(prev => ({ ...prev, sqlScriptsAddedText: e.target.value }))}
          placeholder="SQL scripts added (one per line)"
          rows={3}
          className="font-mono text-[12px]"
        />
      </div>

      <SectionLabel>Validation</SectionLabel>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-[var(--dev-text-faint)]">Build status</label>
          <DevSelect value={form.buildStatus} onChange={e => setForm(prev => ({ ...prev, buildStatus: e.target.value as ValidationStatus }))}>
            {VALIDATION_STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </DevSelect>
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--dev-text-faint)]">TypeScript status</label>
          <DevSelect
            value={form.typescriptStatus}
            onChange={e => setForm(prev => ({ ...prev, typescriptStatus: e.target.value as ValidationStatus }))}
          >
            {VALIDATION_STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </DevSelect>
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--dev-text-faint)]">Runtime status</label>
          <DevSelect value={form.runtimeStatus} onChange={e => setForm(prev => ({ ...prev, runtimeStatus: e.target.value as ValidationStatus }))}>
            {VALIDATION_STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </DevSelect>
        </div>
      </div>

      <SectionLabel>Outcome</SectionLabel>
      <DevTextarea
        value={form.risksIdentified}
        onChange={e => setForm(prev => ({ ...prev, risksIdentified: e.target.value }))}
        placeholder="Risks identified"
        rows={2}
      />
      <DevTextarea
        className="mt-3"
        value={form.recommendations}
        onChange={e => setForm(prev => ({ ...prev, recommendations: e.target.value }))}
        placeholder="Recommendations"
        rows={2}
      />
      <DevInput
        className="mt-3"
        value={form.nextSuggestedBatch}
        onChange={e => setForm(prev => ({ ...prev, nextSuggestedBatch: e.target.value }))}
        placeholder="Next suggested batch"
      />

      <div className="mt-5 flex items-center gap-2">
        <DevButton type="submit">{editing ? 'Save changes' : 'Save handover'}</DevButton>
        <DevButton type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </DevButton>
      </div>
    </form>
  )
}
