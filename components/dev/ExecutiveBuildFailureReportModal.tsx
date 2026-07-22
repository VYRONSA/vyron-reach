'use client'

import type { ExecutiveBuildFailureReport } from '@/lib/dev/executiveBuildFailureTranslator'
import { DevBadge, DevSectionLabel } from './ui'

/**
 * DEF-004 — the Executive Build Failure Report. Purely a renderer over
 * ExecutiveBuildFailureReport (already-translated, read-only data); it
 * never runs a build, never re-checks TypeScript, and never touches
 * buildIntelligence.ts. Opened from the "View Build Report" action in
 * ExecutiveCommandCentre whenever the Build Intelligence Engine reports
 * the last build as Failing. Informational only — this report never
 * triggers a retry.
 */
export function ExecutiveBuildFailureReportModal({
  report,
  onClose,
}: {
  report: ExecutiveBuildFailureReport
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
        aria-label="Executive Build Failure Report"
      >
        <div className="flex items-center justify-between border-b border-[var(--dev-border)] px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-[var(--dev-text)]">Executive Build Failure Report</div>
            <p className="mt-0.5 text-xs text-[var(--dev-text-faint)]">
              Branch "{report.repositoryBranch}" — last checked {report.lastCheckedAt}
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
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[var(--dev-text)]">{report.failureCategory}</span>
              <DevBadge tone="danger">Build Failing</DevBadge>
            </div>

            <p className="mt-2 text-sm text-[var(--dev-text)]">{report.executiveSummary}</p>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Root Cause" value={report.rootCause} />
              <Field label="Impact" value={report.impact} />
            </div>

            <div className="mt-3">
              <Field label="Commit" value={report.repositoryCommit} />
            </div>

            <div className="mt-3 rounded-lg bg-emerald-500/5 p-2.5">
              <DevSectionLabel>Recommended Engineering Action</DevSectionLabel>
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">{report.recommendedEngineeringAction}</p>
            </div>

            <div className="mt-3 rounded-lg bg-sky-500/5 p-2.5">
              <DevSectionLabel>AI Engineering Recommendation</DevSectionLabel>
              <p className="mt-1 text-xs text-sky-700 dark:text-sky-400">{report.aiEngineeringRecommendation}</p>
            </div>

            <div className="mt-3">
              <DevSectionLabel>Files Involved</DevSectionLabel>
              {report.filesInvolved.length > 0 ? (
                <ul className="mt-1 space-y-0.5">
                  {report.filesInvolved.map((f, i) => (
                    <li key={i} className="font-mono text-xs text-[var(--dev-text)]">
                      {f}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-[var(--dev-text-faint)]">Not available for this build result.</p>
              )}
            </div>

            <div className="mt-3">
              <DevSectionLabel>Build Command</DevSectionLabel>
              <p className="mt-1 font-mono text-xs text-[var(--dev-text)]">{report.buildCommand}</p>
            </div>

            <details className="mt-3 border-t border-[var(--dev-border)] pt-3">
              <summary className="cursor-pointer font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-text-faint)]">
                Build Output
              </summary>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-[var(--dev-text-muted)]">{report.buildOutput}</p>
            </details>

            <details className="mt-3 border-t border-[var(--dev-border)] pt-3">
              <summary className="cursor-pointer font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-text-faint)]">
                TypeScript / ESLint Diagnostics
              </summary>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-[var(--dev-text-muted)]">{report.typescriptDiagnostics}</p>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-[var(--dev-text-muted)]">{report.eslintDiagnostics}</p>
            </details>

            <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
              <DevSectionLabel>Retry Recommendation</DevSectionLabel>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{report.retryRecommendation}</p>
            </div>
          </div>
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
