import type { DevelopmentSession } from './developmentOrchestrator'
import type { DevelopmentDependencyStatus } from './developmentDependencyEngine'
import type { DevelopmentEvent } from './developmentEventEngine'
import type { DevelopmentConversationMemory } from './developmentConversationMemoryEngine'
import { getLatestHandover, handoversForBatch, type Handover } from './handoverStorage'

/** The two commands every batch in this project is validated against — not project-specific "business logic", just this repo's fixed validation convention. */
export const PROMPT_VALIDATION_REQUIREMENTS: string[] = [
  'npx tsc --noEmit must pass with no errors.',
  'npm run build must complete successfully.',
]

/** The "Return ONLY" shape used consistently across VYRON DEV's own batch prompts. */
export const PROMPT_EXPECTED_RETURN_FORMAT: string[] = [
  'Files Created',
  'Files Modified',
  'Features Implemented',
  'Build Status',
  'TypeScript Status',
  'Technical Debt Identified',
  'Architecture Decisions',
  'Remaining Recommendations',
]

export type PromptSection = {
  heading: string
  content: string
}

export type GeneratedPrompt = {
  project: string
  sections: PromptSection[]
  fullText: string
}

function buildDevelopmentStateSummary(session: DevelopmentSession): string {
  const lines: string[] = [`- Development Readiness: ${session.developmentReadiness}`]
  if (session.buildStatus !== 'Unknown') lines.push(`- Build Status: ${session.buildStatus}`)
  if (session.typescriptStatus !== 'Unknown') lines.push(`- TypeScript Status: ${session.typescriptStatus}`)
  if (session.gitWorkingTreeStatus !== 'Unknown') lines.push(`- Git Working Tree: ${session.gitWorkingTreeStatus}`)
  lines.push(`- Deployment Status: ${session.deploymentStatus}`)
  return lines.join('\n')
}

/**
 * The handover most relevant to what's likely still in scope: one already
 * logged against the current batch if it exists, otherwise the project's
 * most recent handover overall (labelled accordingly so it's read as a
 * historical hint, not a prediction). Never guesses file paths that were
 * never actually recorded anywhere.
 */
function pickRelevantHandover(slug: string, session: DevelopmentSession): { handover: Handover; scopedToCurrentBatch: boolean } | null {
  if (session.currentBatch) {
    const batchHandovers = handoversForBatch(session.currentBatch.id)
    if (batchHandovers.length > 0) {
      const latest = [...batchHandovers].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0]
      return { handover: latest, scopedToCurrentBatch: true }
    }
  }
  const latest = getLatestHandover(slug)
  return latest ? { handover: latest, scopedToCurrentBatch: false } : null
}

function buildFilesLikelyAffected(slug: string, session: DevelopmentSession): string | null {
  const picked = pickRelevantHandover(slug, session)
  if (!picked) return null
  const files = [...picked.handover.filesCreated, ...picked.handover.filesModified]
  if (files.length === 0) return null
  const label = picked.scopedToCurrentBatch
    ? "Files touched in the current batch's most recent handover:"
    : "Files touched in the project's most recent handover (confirm still relevant):"
  return [label, ...files.map(f => `- ${f}`)].join('\n')
}

/**
 * Omitted entirely when there's no previous objective on record (first-ever
 * session for this project) — never a fabricated "no history" claim, just
 * nothing to show. Placed before "Objective" so the next Claude session
 * reads what happened yesterday before what's being asked today.
 */
function buildPreviousCycleSection(memory: DevelopmentConversationMemory): string | null {
  if (!memory.previousObjective) return null
  const lines: string[] = [`- Previous Objective: ${memory.previousObjective}`, `- Completion Status: ${memory.completionStatus}`]
  if (memory.remainingWork.length > 0) {
    lines.push('- Remaining Work:')
    for (const item of memory.remainingWork.slice(0, 5)) lines.push(`  - ${item.label}`)
  } else {
    lines.push('- Remaining Work: None outstanding.')
  }
  lines.push(`- Development Drift: ${memory.drift} — ${memory.driftExplanation}`)
  lines.push(`- Continuity Summary: ${memory.continuitySummary}`)
  return lines.join('\n')
}

/**
 * The Prompt Intelligence Engine — deterministic template assembly over
 * already-computed engine outputs. It never calls an AI model and never
 * derives a new fact: every section either reads straight off the
 * Development Session (which already composes Project/Development/Git/
 * Build/Deployment/Handover Intelligence), the Development Dependency
 * Engine, or the Development Event Engine — all passed in precomputed so
 * this never recalculates any of them. A section is included only when
 * the underlying data genuinely exists; otherwise it's omitted entirely,
 * never guessed.
 */
export function getGeneratedPrompt(
  slug: string,
  session: DevelopmentSession,
  dependencies: DevelopmentDependencyStatus,
  events: DevelopmentEvent[],
  memory: DevelopmentConversationMemory
): GeneratedPrompt {
  const sections: PromptSection[] = []

  if (session.project) sections.push({ heading: 'Current Project', content: session.project.name })
  if (session.currentPhase && session.currentPhase !== 'Unknown') {
    sections.push({ heading: 'Current Phase', content: session.currentPhase })
  }
  if (session.currentMilestone) sections.push({ heading: 'Current Milestone', content: session.currentMilestone.title })
  if (session.currentBatch) {
    sections.push({
      heading: 'Current Batch',
      content: `Batch ${session.currentBatch.batchNumber}${session.currentBatch.objective ? `: ${session.currentBatch.objective}` : ''}`,
    })
  }

  const previousCycle = buildPreviousCycleSection(memory)
  if (previousCycle) sections.push({ heading: 'Previous Development Cycle', content: previousCycle })

  if (session.currentObjective) sections.push({ heading: 'Objective', content: session.currentObjective })

  sections.push({ heading: 'Current Development State', content: buildDevelopmentStateSummary(session) })

  if (events.length > 0) {
    sections.push({
      heading: 'Latest Development Events',
      content: events.slice(0, 5).map(e => `- ${e.type}: ${e.description}`).join('\n'),
    })
  }

  if (dependencies.blockers.length > 0) {
    sections.push({
      heading: 'Current Blockers',
      content: dependencies.blockers.map(b => `- ${b.description}`).join('\n'),
    })
  }

  if (dependencies.milestoneDependencies.length > 0) {
    sections.push({
      heading: 'Current Dependencies',
      content: dependencies.milestoneDependencies.map(d => `- ${d.reason}`).join('\n'),
    })
  }

  if (dependencies.recommendedNextExecutableTask) {
    sections.push({ heading: 'Recommended Next Executable Task', content: dependencies.recommendedNextExecutableTask.label })
  }

  const filesLikelyAffected = buildFilesLikelyAffected(slug, session)
  if (filesLikelyAffected) sections.push({ heading: 'Files Likely to Be Affected', content: filesLikelyAffected })

  sections.push({
    heading: 'Validation Requirements',
    content: PROMPT_VALIDATION_REQUIREMENTS.map(v => `- ${v}`).join('\n'),
  })
  sections.push({
    heading: 'Expected Claude Return Format',
    content: PROMPT_EXPECTED_RETURN_FORMAT.map(v => `- ${v}`).join('\n'),
  })

  const fullText = sections.map(s => `## ${s.heading}\n${s.content}`).join('\n\n')

  return { project: slug, sections, fullText }
}
