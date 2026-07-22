import type { EvidencePack, FeatureCertification, ProjectCertificationSummary, PlatformCertificationSummary } from './certificationTypes'

/**
 * "Support: JSON, CSV, PDF-ready structured output (The PDF rendering
 * itself can come later.)" — the PDF-ready shape is a generic
 * heading/rows document any future PDF renderer can consume directly;
 * nothing here produces PDF bytes.
 */

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function toCsv<T extends Record<string, unknown>>(rows: T[]): string {
  if (rows.length === 0) return ''
  const keys = Object.keys(rows[0])
  const header = keys.map(csvCell).join(',')
  const body = rows.map(row => keys.map(k => csvCell(row[k])).join(','))
  return [header, ...body].join('\n') + '\n'
}

export function exportFeaturesAsJson(features: FeatureCertification[]): string {
  return JSON.stringify(features, null, 2)
}

export function exportFeaturesAsCsv(features: FeatureCertification[]): string {
  return toCsv(
    features.map(f => ({
      project: f.project,
      batchId: f.batchId,
      batchNumber: f.batchNumber ?? '',
      status: f.status,
      result: f.result ?? '',
      startedAt: f.startedAt,
      completedAt: f.completedAt ?? '',
      deliveryDurationMs: f.deliveryDurationMs ?? '',
      tasksGenerated: f.tasksGenerated,
      tasksCompleted: f.tasksCompleted,
      testsExecuted: f.testsExecuted,
      documentationGenerated: f.documentationGenerated,
      recoveryEvents: f.recoveryEvents,
      ceoInterventions: f.ceoInterventions,
      manualOverrides: f.manualOverrides,
    }))
  )
}

export function exportSummaryAsJson(summary: ProjectCertificationSummary | PlatformCertificationSummary): string {
  return JSON.stringify(summary, null, 2)
}

export function exportSummaryAsCsv(summary: ProjectCertificationSummary | PlatformCertificationSummary): string {
  return toCsv([summary as unknown as Record<string, unknown>])
}

export type PdfReadySection = { heading: string; rows: { label: string; value: string }[] }
export type PdfReadyDocument = { title: string; generatedAt: string; sections: PdfReadySection[] }

/** A structured, print-oriented document — headings and label/value rows a future PDF renderer (or, today, any generic template engine) can lay out directly, with no further transformation of the underlying evidence data. */
export function toPdfReadyDocument(pack: EvidencePack): PdfReadyDocument {
  return {
    title: `Certification Evidence — ${pack.project} / ${pack.batchId}`,
    generatedAt: pack.generatedAt,
    sections: [
      {
        heading: 'Final Certification',
        rows: [
          { label: 'Result', value: pack.finalCertification ?? 'Not certified' },
          { label: 'Automation Score', value: `${pack.automationScore.toFixed(1)}%` },
        ],
      },
      {
        heading: 'Metrics',
        rows: [
          { label: 'Tasks Generated', value: String(pack.metrics.tasksGenerated) },
          { label: 'Tasks Completed', value: String(pack.metrics.tasksCompleted) },
          { label: 'Delivery Duration', value: pack.metrics.deliveryDurationMs !== null ? `${pack.metrics.deliveryDurationMs}ms` : 'Unknown' },
        ],
      },
      {
        heading: 'Recovery History',
        rows: [{ label: 'Recovery Events', value: String(pack.recoveryHistory.recoveryEvents) }],
      },
      {
        heading: 'Testing Summary',
        rows: [
          { label: 'Test Runs Observed', value: String(pack.testingSummary.runs) },
          { label: 'Executed', value: String(pack.testingSummary.executed) },
          { label: 'Passed', value: String(pack.testingSummary.passed) },
          { label: 'Failed', value: String(pack.testingSummary.failed) },
        ],
      },
      {
        heading: 'Architecture Summary',
        rows: pack.architectureSummary.map(a => ({ label: a.timestamp, value: a.decision })),
      },
      {
        heading: 'Knowledge Summary',
        rows: pack.knowledgeSummary.map(k => ({ label: k.domain, value: String(k.count) })),
      },
      {
        heading: 'CEO Involvement',
        rows: [
          { label: 'CEO Interventions', value: String(pack.ceoInvolvement.ceoInterventions) },
          { label: 'Manual Overrides', value: String(pack.ceoInvolvement.manualOverrides) },
          ...pack.ceoInvolvement.resolvedItems.map(i => ({ label: i.timestamp, value: `${i.reason}${i.resolutionNote ? ` — ${i.resolutionNote}` : ''}` })),
        ],
      },
      {
        heading: 'Timeline',
        rows: pack.timeline.map(t => ({ label: `${t.timestamp} — ${t.category}`, value: t.title })),
      },
    ],
  }
}
