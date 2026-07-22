'use client'

import { useState } from 'react'
import { DevBadge, DevButton, DevCard, DevCardHeader, DevEmptyState, DevInput, DevSelect, DevTextarea } from '../ui'
import type { GeneratedPlanCandidate, InitiationRequest, RiskLevel } from '@/lib/dev/initiation/initiationTypes'

const RISK_LEVELS: RiskLevel[] = ['Low', 'Medium', 'High']
const RISK_TONE: Record<RiskLevel, 'success' | 'neutral' | 'danger'> = { Low: 'success', Medium: 'neutral', High: 'danger' }

function removeMilestone(programme: GeneratedPlanCandidate, tempId: string): GeneratedPlanCandidate {
  const removedBatchIds = new Set(programme.batches.filter(b => b.milestoneRef === tempId).map(b => b.tempId))
  return {
    ...programme,
    milestones: programme.milestones.filter(m => m.tempId !== tempId),
    batches: programme.batches.filter(b => b.milestoneRef !== tempId),
    risks: programme.risks.map(r => (r.relatedMilestoneRef === tempId ? { ...r, relatedMilestoneRef: '' } : r)),
    dependencies: programme.dependencies.filter(
      d => !((d.fromType === 'milestone' && d.fromRef === tempId) || (d.toType === 'milestone' && d.toRef === tempId) || (d.fromType === 'batch' && removedBatchIds.has(d.fromRef)) || (d.toType === 'batch' && removedBatchIds.has(d.toRef)))
    ),
  }
}

function removeBatch(programme: GeneratedPlanCandidate, tempId: string): GeneratedPlanCandidate {
  return {
    ...programme,
    batches: programme.batches.filter(b => b.tempId !== tempId),
    dependencies: programme.dependencies.filter(d => !((d.fromType === 'batch' && d.fromRef === tempId) || (d.toType === 'batch' && d.toRef === tempId))),
  }
}

function removeRisk(programme: GeneratedPlanCandidate, index: number): GeneratedPlanCandidate {
  return { ...programme, risks: programme.risks.filter((_, i) => i !== index) }
}

/**
 * Step 3 of the wizard, and the mandatory human review gate: edits happen
 * only against `reviewedProgramme` (a working copy) — `generatedProgramme`,
 * the raw LLM output, is never touched. "Save Changes" persists edits via
 * PATCH while still in Review; "Approve" only flips Review -> Approved and
 * never itself writes to the Planning Service (that's the separate
 * /provision action, driven from the parent page once Approved).
 */
export function InitiationReviewBoard({ initiation, onUpdated }: { initiation: InitiationRequest; onUpdated: (next: InitiationRequest) => void }) {
  const [programme, setProgramme] = useState<GeneratedPlanCandidate>(initiation.reviewedProgramme as GeneratedPlanCandidate)
  const [reviewNotes, setReviewNotes] = useState(initiation.reviewNotes)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function mutate(next: GeneratedPlanCandidate) {
    setProgramme(next)
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/dev/initiation/${initiation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewedProgramme: programme, reviewNotes }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? `Failed to save (${res.status}).`)
      onUpdated(body.initiation)
      setDirty(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  /** Explicit "does my current draft still pass?" check — a convenience read, never a substitute for the mandatory re-validation Approve and Provision each enforce themselves. */
  async function handleValidate() {
    if (dirty) await handleSave()
    setValidating(true)
    setError(null)
    try {
      const res = await fetch(`/api/dev/initiation/${initiation.id}/validate`, { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? `Failed to validate (${res.status}).`)
      onUpdated(body.initiation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate.')
    } finally {
      setValidating(false)
    }
  }

  /** Discards this entire draft programme (edits included) and asks the model for a fresh one — Review -> Generating -> Review|GenerationFailed, the same self-correcting generation path as the initial Draft -> Review step. */
  async function handleRegenerate() {
    setRegenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/dev/initiation/${initiation.id}/generate`, { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? `Failed to regenerate (${res.status}).`)
      onUpdated(body.initiation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate.')
    } finally {
      setRegenerating(false)
    }
  }

  async function handleApprove() {
    if (dirty) {
      await handleSave()
    }
    setApproving(true)
    setError(null)
    try {
      const res = await fetch(`/api/dev/initiation/${initiation.id}/approve`, { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? `Failed to approve (${res.status}).`)
      onUpdated(body.initiation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve.')
    } finally {
      setApproving(false)
    }
  }

  const reviewValidation = initiation.reviewValidation
  const validationStatus: { tone: 'neutral' | 'success' | 'danger' | 'warning'; label: string; detail?: string } = dirty
    ? { tone: 'warning', label: 'Unsaved edits', detail: 'Save before validating — edits invalidate the last result.' }
    : reviewValidation === null
      ? { tone: 'neutral', label: 'Not yet validated', detail: 'Approval and Provisioning both re-run the validator regardless.' }
      : reviewValidation.valid
        ? { tone: 'success', label: 'Validated', detail: `As of ${new Date(reviewValidation.validatedAt).toLocaleString()}` }
        : { tone: 'danger', label: 'Invalid', detail: reviewValidation.reason ?? 'Failed validation.' }

  return (
    <div className="space-y-6">
      <DevCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <DevBadge tone={validationStatus.tone}>{validationStatus.label}</DevBadge>
            {validationStatus.detail ? <span className="text-xs text-[var(--dev-text-faint)]">{validationStatus.detail}</span> : null}
          </div>
          <DevButton variant="secondary" onClick={handleValidate} disabled={validating || saving || regenerating}>
            {validating ? 'Validating…' : 'Validate Now'}
          </DevButton>
        </div>
      </DevCard>

      <DevCard>
        <DevCardHeader title={`Milestones (${programme.milestones.length})`} />
        <div className="mt-4 space-y-4">
          {programme.milestones.length === 0 ? (
            <DevEmptyState>No milestones remain in this programme.</DevEmptyState>
          ) : (
            [...programme.milestones]
              .sort((a, b) => a.sequence - b.sequence)
              .map(milestone => {
                const batches = programme.batches.filter(b => b.milestoneRef === milestone.tempId).sort((a, b) => a.sequence - b.sequence)
                return (
                  <div key={milestone.tempId} className="rounded-xl border border-[var(--dev-border)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <DevInput
                        value={milestone.title}
                        onChange={e =>
                          mutate({
                            ...programme,
                            milestones: programme.milestones.map(m => (m.tempId === milestone.tempId ? { ...m, title: e.target.value } : m)),
                          })
                        }
                        className="font-medium"
                      />
                      <DevButton variant="danger" onClick={() => mutate(removeMilestone(programme, milestone.tempId))}>
                        Remove
                      </DevButton>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <DevInput
                        value={milestone.phase}
                        placeholder="Phase"
                        onChange={e =>
                          mutate({ ...programme, milestones: programme.milestones.map(m => (m.tempId === milestone.tempId ? { ...m, phase: e.target.value } : m)) })
                        }
                      />
                    </div>
                    <DevTextarea
                      value={milestone.description}
                      rows={2}
                      className="mt-3"
                      onChange={e =>
                        mutate({
                          ...programme,
                          milestones: programme.milestones.map(m => (m.tempId === milestone.tempId ? { ...m, description: e.target.value } : m)),
                        })
                      }
                    />

                    <div className="mt-4 space-y-2 border-t border-[var(--dev-border)] pt-3">
                      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-text-faint)]">
                        Batches ({batches.length})
                      </div>
                      {batches.map(batch => (
                        <div key={batch.tempId} className="rounded-lg bg-[var(--dev-surface-hover)] p-3">
                          <div className="flex items-start justify-between gap-3">
                            <DevInput
                              value={batch.batchNumber}
                              onChange={e =>
                                mutate({ ...programme, batches: programme.batches.map(b => (b.tempId === batch.tempId ? { ...b, batchNumber: e.target.value } : b)) })
                              }
                              className="max-w-[120px] font-mono text-xs"
                            />
                            <DevButton variant="danger" onClick={() => mutate(removeBatch(programme, batch.tempId))}>
                              Remove
                            </DevButton>
                          </div>
                          <DevTextarea
                            value={batch.objective}
                            rows={2}
                            className="mt-2"
                            placeholder="Objective — the concrete instruction the autonomous worker acts on"
                            onChange={e =>
                              mutate({ ...programme, batches: programme.batches.map(b => (b.tempId === batch.tempId ? { ...b, objective: e.target.value } : b)) })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
          )}
        </div>
      </DevCard>

      <DevCard>
        <DevCardHeader title={`Risks (${programme.risks.length})`} />
        <div className="mt-4 space-y-3">
          {programme.risks.length === 0 ? (
            <DevEmptyState>No risks identified.</DevEmptyState>
          ) : (
            programme.risks.map((risk, index) => (
              <div key={index} className="rounded-xl border border-[var(--dev-border)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <DevInput
                    value={risk.title}
                    onChange={e => mutate({ ...programme, risks: programme.risks.map((r, i) => (i === index ? { ...r, title: e.target.value } : r)) })}
                    className="font-medium"
                  />
                  <DevButton variant="danger" onClick={() => mutate(removeRisk(programme, index))}>
                    Remove
                  </DevButton>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <DevBadge tone={RISK_TONE[risk.severity]}>Severity</DevBadge>
                    <DevSelect
                      value={risk.severity}
                      onChange={e => mutate({ ...programme, risks: programme.risks.map((r, i) => (i === index ? { ...r, severity: e.target.value as RiskLevel } : r)) })}
                    >
                      {RISK_LEVELS.map(level => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </DevSelect>
                  </div>
                  <div className="flex items-center gap-2">
                    <DevBadge tone={RISK_TONE[risk.probability]}>Probability</DevBadge>
                    <DevSelect
                      value={risk.probability}
                      onChange={e => mutate({ ...programme, risks: programme.risks.map((r, i) => (i === index ? { ...r, probability: e.target.value as RiskLevel } : r)) })}
                    >
                      {RISK_LEVELS.map(level => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </DevSelect>
                  </div>
                </div>
                <DevTextarea
                  value={risk.mitigation}
                  rows={2}
                  className="mt-3"
                  placeholder="Mitigation"
                  onChange={e => mutate({ ...programme, risks: programme.risks.map((r, i) => (i === index ? { ...r, mitigation: e.target.value } : r)) })}
                />
              </div>
            ))
          )}
        </div>
      </DevCard>

      <DevCard>
        <DevCardHeader title="Review Notes" />
        <DevTextarea
          value={reviewNotes}
          rows={3}
          className="mt-3"
          placeholder="Optional — notes for the record on what was changed and why."
          onChange={e => {
            setReviewNotes(e.target.value)
            setDirty(true)
          }}
        />
      </DevCard>

      {error ? <p className="text-sm text-rose-500 dark:text-rose-400">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <DevButton variant="danger" onClick={handleRegenerate} disabled={regenerating || saving || approving}>
            {regenerating ? 'Regenerating…' : 'Regenerate Programme'}
          </DevButton>
          <p className="mt-1 text-xs text-[var(--dev-text-faint)]">Discards this draft (including any edits above) and asks the model for a fresh one.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DevButton variant="secondary" onClick={handleSave} disabled={!dirty || saving || regenerating}>
            {saving ? 'Saving…' : 'Save Changes'}
          </DevButton>
          <DevButton
            onClick={handleApprove}
            disabled={
              approving ||
              regenerating ||
              programme.milestones.length === 0 ||
              programme.batches.length === 0 ||
              (!dirty && reviewValidation !== null && !reviewValidation.valid)
            }
          >
            {approving ? 'Approving…' : 'Approve Programme'}
          </DevButton>
        </div>
      </div>
    </div>
  )
}
