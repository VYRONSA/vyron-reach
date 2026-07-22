import { DevBadge, DevCard, DevCardHeader, DevField } from '../ui'
import type { InitiationAssessment } from '@/lib/dev/initiation/initiationTypes'

const COMPLEXITY_TONE: Record<InitiationAssessment['estimatedComplexity'], 'neutral' | 'success' | 'warning' | 'danger'> = {
  Low: 'success',
  Medium: 'neutral',
  High: 'warning',
  'Very High': 'danger',
}

/** Read-only render of the LLM's InitiationAssessment — never editable, unlike the milestones/batches/risks in InitiationReviewBoard, since it's a narrative judgment rather than structured programme data. */
export function InitiationAssessmentPanel({ assessment }: { assessment: InitiationAssessment }) {
  return (
    <DevCard>
      <DevCardHeader title="Initiation Assessment" badge={<DevBadge tone={COMPLEXITY_TONE[assessment.estimatedComplexity]}>{assessment.estimatedComplexity} complexity</DevBadge>} />

      <div className="mt-4 space-y-4">
        <DevField label="Summary">
          <p className="text-sm leading-relaxed text-[var(--dev-text)]">{assessment.summary}</p>
        </DevField>
        <DevField label="Scope">
          <p className="text-sm leading-relaxed text-[var(--dev-text)]">{assessment.scope}</p>
        </DevField>
        {assessment.feasibilityNotes ? (
          <DevField label="Feasibility Notes">
            <p className="text-sm leading-relaxed text-[var(--dev-text-muted)]">{assessment.feasibilityNotes}</p>
          </DevField>
        ) : null}
        <DevField label="Recommended Category">
          <span className="text-sm text-[var(--dev-text)]">{assessment.recommendedCategory}</span>
        </DevField>
        {assessment.assumptions.length > 0 ? (
          <DevField label="Assumptions">
            <ul className="list-disc space-y-1 pl-4 text-sm text-[var(--dev-text-muted)]">
              {assessment.assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </DevField>
        ) : null}
        {assessment.openQuestions.length > 0 ? (
          <DevField label="Open Questions">
            <ul className="list-disc space-y-1 pl-4 text-sm text-amber-600 dark:text-amber-400">
              {assessment.openQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </DevField>
        ) : null}
        <DevField label="Knowledge Sources Considered">
          {assessment.knowledgeSourcesConsidered.length > 0 ? (
            <ul className="space-y-1 text-sm text-[var(--dev-text-muted)]">
              {assessment.knowledgeSourcesConsidered.map((ref, i) => (
                <li key={i} className="font-mono text-xs">
                  {ref}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--dev-text-faint)]">None cited — this assessment relied on the Executive Directive alone.</p>
          )}
        </DevField>
      </div>
    </DevCard>
  )
}
