'use client'

import type { ExecutiveValidationExplanation, ValidationSeverity } from '@/lib/dev/planning/executiveValidationTranslator'
import { DevBadge, DevSectionLabel } from './ui'

const SEVERITY_TONE: Record<ValidationSeverity, 'danger' | 'warning' | 'info'> = {
  Critical: 'danger',
  High: 'warning',
  Medium: 'info',
}

/**
 * DEF-003 — the Executive Validation Report. Purely a renderer over
 * ExecutiveValidationExplanation[] (already-translated, read-only data);
 * it never evaluates a plan and never touches planningValidator.ts. Opened
 * from the "View Details" action in PlanningCentrePanel whenever
 * plan.validation.valid is false.
 */
export function ExecutiveValidationReportModal({
  explanations,
  onClose,
}: {
  explanations: ExecutiveValidationExplanation[]
  onClose: () => void
}) {
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
        aria-label="Executive Validation Report"
      >
        <div className="flex items-center justify-between border-b border-[var(--dev-border)] px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-[var(--dev-text)]">Executive Validation Report</div>
            <p className="mt-0.5 text-xs text-[var(--dev-text-faint)]">
              {explanations.length} issue{explanations.length === 1 ? '' : 's'} must be resolved before this plan can proceed.
            </p>
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
          {explanations.map((explanation, i) => (
            <div key={i} className="rounded-xl border border-[var(--dev-border)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--dev-text)]">{explanation.validationRule}</span>
                <DevBadge tone={SEVERITY_TONE[explanation.severity]}>{explanation.severity}</DevBadge>
              </div>

              <p className="mt-2 text-sm text-[var(--dev-text)]">{explanation.executiveSummary}</p>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Root Cause" value={explanation.rootCause} />
                <Field label="Impact" value={explanation.impact} />
              </div>

              <div className="mt-3">
                <DevSectionLabel>Why Execution Was Blocked</DevSectionLabel>
                <p className="mt-1 text-xs text-[var(--dev-text-muted)]">{explanation.whyExecutionWasBlocked}</p>
              </div>

              <div className="mt-3 rounded-lg bg-emerald-500/5 p-2.5">
                <DevSectionLabel>Recommended Action</DevSectionLabel>
                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">{explanation.recommendedAction}</p>
              </div>

              {explanation.affectedTasks.length > 0 ? (
                <div className="mt-3">
                  <DevSectionLabel>Affected Tasks</DevSectionLabel>
                  <ul className="mt-1 space-y-0.5">
                    {explanation.affectedTasks.map(t => (
                      <li key={t.id} className="text-xs text-[var(--dev-text)]">
                        {t.title}
                        {t.engineeringSequence !== null ? ` — Engineering Sequence position ${t.engineeringSequence}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-3 text-[11px] text-[var(--dev-text-faint)]">Applies to the plan as a whole, not a single task.</p>
              )}

              {explanation.evidence.length > 0 ? (
                <div className="mt-3">
                  <DevSectionLabel>Evidence</DevSectionLabel>
                  <ul className="mt-1 space-y-0.5">
                    {explanation.evidence.map((e, idx) => (
                      <li key={idx} className="text-xs text-[var(--dev-text-muted)]">
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <details className="mt-3 border-t border-[var(--dev-border)] pt-3">
                <summary className="cursor-pointer font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-text-faint)]">
                  Technical Details
                </summary>
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-[var(--dev-text-muted)]">{explanation.technicalDetails}</p>
              </details>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <DevSectionLabel>{label}</DevSectionLabel>
      <p className="mt-1 text-xs text-[var(--dev-text-muted)]">{value}</p>
    </div>
  )
}
