import * as planningStateService from '../planningState/planningStateService'
import { discoverKnowledge, type KnowledgeDiscoveryResult } from './knowledgeDiscovery'
import { callInitiationLlm } from './initiationLlmClient'
import { validateGeneratedPlan } from './initiationGenerationValidation'
import * as initiationService from './initiationService'
import type { GeneratedPlanCandidate, InitiationRequest, KnowledgeItem } from './initiationTypes'

/**
 * Builds the generation prompt and drives the Generating -> Review |
 * GenerationFailed transition around the OpenAI call(s). This is the only
 * generative step in the subsystem — everything downstream (Review,
 * Approve, Provision) is deterministic. See the approved plan's
 * "Generation step" section for the schema/constraint rationale.
 *
 * Before every attempt, Knowledge Discovery (knowledgeDiscovery.ts) runs
 * automatically and its result is folded into the prompt as three
 * distinct sections alongside the Executive Directive itself (Retrieved
 * Organisational Knowledge, Engineering Standards, Constraints) — this
 * file never inspects a specific KnowledgeSourceType or reaches into a
 * specific store itself; it only ever iterates the generic KnowledgeItem
 * shape discovery hands back, which is what keeps this generator
 * compatible with future retrieval sources without needing to change
 * (new sources are added entirely inside knowledgeDiscovery.ts).
 *
 * The validator (initiationGenerationValidation.ts) is the source of
 * truth for what a valid programme looks like and is never relaxed here.
 * Instead, a bad-but-recoverable output (most commonly: a milestone that
 * ended up with only 1 batch) triggers a bounded, self-correcting retry
 * loop that feeds the exact validator rejection reason back to the model
 * and asks for a full regeneration — the fix belongs in the generator,
 * not in loosening what counts as valid.
 */

const MAX_SELF_CORRECTION_ATTEMPTS = 3

const SYSTEM_PROMPT = `You are VYRON DEV's Initiation Assessor. Given a free-text Executive Directive describing a product or feature to build, together with retrieved organisational knowledge and engineering standards, you produce a structured engineering programme as a single JSON object.

Your user message is organized into four clearly labeled sections — treat them differently:
- EXECUTIVE DIRECTIVE: the actual ask. This is what you are building.
- RETRIEVED ORGANISATIONAL KNOWLEDGE: real prior decisions, risks, technical debt, milestones, batches, and directives already in this organisation, ranked by relevance to this directive. Use it to avoid contradicting prior decisions, to reuse existing risk/debt findings instead of re-discovering them, and to build on (not duplicate) existing milestones/batches for the same or a related project. It may be empty — if so, a KNOWLEDGE GAPS list explains why, and you must proceed using only the Executive Directive.
- ENGINEERING STANDARDS: how this organisation actually builds software and any house coding rules — every batch's objective must respect these.
- CONSTRAINTS: the hard structural rules your JSON output must satisfy, restated below.

Output EXACTLY this JSON shape (no prose, no markdown fences, no extra top-level keys):
{
  "assessment": {
    "summary": string,
    "scope": string,
    "feasibilityNotes": string,
    "assumptions": string[],
    "openQuestions": string[],
    "estimatedComplexity": "Low" | "Medium" | "High" | "Very High",
    "recommendedCategory": string,
    "knowledgeSourcesConsidered": string[]
  },
  "milestones": [
    { "tempId": string, "title": string, "description": string, "phase": string, "sequence": number, "sourceRefs": string[] }
  ],
  "batches": [
    { "tempId": string, "milestoneRef": string, "batchNumber": string, "objective": string, "summary": string, "claudePrompt": string, "sequence": number, "sourceRefs": string[] }
  ],
  "risks": [
    { "tempId": string, "title": string, "description": string, "relatedMilestoneRef": string, "severity": "Low"|"Medium"|"High", "probability": "Low"|"Medium"|"High", "mitigation": string, "sourceRefs": string[] }
  ],
  "dependencies": [
    { "fromType": "milestone"|"batch", "fromRef": string, "toType": "milestone"|"batch", "toRef": string, "note": string }
  ]
}

Attribution rules (this is how supporting knowledge stays traceable):
- "assessment.knowledgeSourcesConsidered" must be a REQUIRED array — list the exact "sourceRef" values (from RETRIEVED ORGANISATIONAL KNOWLEDGE) that actually informed your assessment. Use an empty array only if nothing retrieved was actually relevant.
- Every milestone/batch/risk's "sourceRefs" is optional but, when a specific retrieved item genuinely informed that specific item, include its exact "sourceRef" string there. Do not fabricate a sourceRef that wasn't given to you. Leave it an empty array for genuinely new/greenfield items with nothing to cite.

CONSTRAINTS (mechanically enforced — violating any of these gets the entire submission rejected):
- Produce 3 to 8 milestones.
- EVERY milestone must have BETWEEN 2 AND 6 batches whose "milestoneRef" equals that milestone's "tempId" — never 0, never 1, never more than 6. If a milestone's scope only naturally produces one unit of work, split that work into two or more batches instead (e.g. a "design/setup" batch plus an "implementation" batch, or split by sub-component/endpoint/screen/data model). If a milestone's scope is genuinely too thin to support 2 real batches, merge it into an adjacent milestone rather than emitting it standalone with too few.
- Every batch must represent meaningful, concrete engineering work per ENGINEERING STANDARDS — a specific artifact to build, modify, or automate. A batch whose objective is purely a meeting, interview, discussion, sign-off, or other activity with no buildable deliverable is not acceptable output. Even discovery/planning/assessment-style milestones must be delivered as concrete artifacts (e.g. "write and store a structured Product Knowledge Pack document via the Knowledge Service," not "hold a meeting").
- Every "tempId" must be unique within its own list (milestones, batches, and risks each use separate id spaces).
- Every risk needs its own "tempId" (e.g. "r1", "r2") so a specific risk can be referenced unambiguously later — a High-severity risk you emit will require an explicit Executive decision (accept it, ask for it to be mitigated, or reject the programme) before this project can be provisioned, so only mark a risk "High" when it genuinely warrants that.
- Every "batchNumber" must be unique across the whole programme (e.g. "1.1", "1.2", "2.1").
- Every "milestoneRef", "relatedMilestoneRef" (if non-empty), "fromRef", and "toRef" must exactly equal a "tempId" you emitted for a milestone or batch.
- "severity", "probability" are restricted to "Low" | "Medium" | "High". "estimatedComplexity" is restricted to "Low" | "Medium" | "High" | "Very High".
- "objective" must be a concrete, actionable engineering instruction for the batch, specific enough that an autonomous coding agent knows exactly what artifact to produce — this is the field that actually drives that agent, not "claudePrompt" (which only exists for schema parity and can restate the objective).
- "risks" and "dependencies" may be empty arrays if genuinely none apply, but prefer identifying at least the obvious ones — and reuse a retrieved Risk Register/Technical Debt item (with sourceRefs) instead of re-inventing one that already exists.
- Sequence numbers should reflect a sensible build order, starting at 1 within each list.
- Do not invent milestone/batch ids that look like real database ids — use short readable tempIds like "m1", "b1".

Before you finish, silently self-check three times: (1) for every milestone tempId, count how many batches reference it via "milestoneRef" — if any count is below 2 or above 6, revise until every milestone satisfies 2-6; (2) re-read every batch's "objective" and confirm it names a concrete artifact, not an activity — rewrite any that don't; (3) confirm "knowledgeSourcesConsidered" is present and, if RETRIEVED ORGANISATIONAL KNOWLEDGE was non-empty, actually reflects what you used. Only THEN output the final JSON. Never output a programme you have not already verified against all three checks.`

function formatKnowledgeItemsAsJson(items: KnowledgeItem[]): string {
  return JSON.stringify(
    items.map(i => ({
      sourceType: i.sourceType,
      sourceRef: i.sourceRef,
      project: i.project,
      title: i.title,
      summary: i.summary,
      relevanceScore: Math.round(i.relevanceScore * 100) / 100,
    })),
    null,
    2
  )
}

function buildUserPrompt(request: InitiationRequest, existingCategories: string[], discovery: KnowledgeDiscoveryResult, correction: string | null): string {
  const categoryHint = existingCategories.length ? `Existing product categories in this portfolio (for consistency, not mandatory): ${existingCategories.join(', ')}.` : ''

  const knowledgeSection =
    discovery.organisationalKnowledge.length > 0
      ? formatKnowledgeItemsAsJson(discovery.organisationalKnowledge)
      : '[] (none found — see KNOWLEDGE GAPS below; proceed using only the Executive Directive)'

  const gapsSection = discovery.gaps.length
    ? discovery.gaps.map(g => `- ${g.sourceType}: ${g.reason}`).join('\n')
    : 'None — every source was consulted and returned at least one result.'

  const standardsSection = formatKnowledgeItemsAsJson(discovery.engineeringStandards)

  const correctionNote = correction
    ? [
        '',
        'Your previous attempt at this same directive was REJECTED for the following reason:',
        correction,
        '',
        'Produce a corrected, COMPLETE JSON object from scratch that fixes this specific problem (most likely by splitting/merging milestones-batches so every milestone has 2-6 batches, or by rewriting a batch objective into a concrete artifact) while preserving the rest of the intent. Do not repeat the same mistake.',
      ]
    : []

  return [
    '## EXECUTIVE DIRECTIVE',
    `Project slug (already reserved): ${request.project}`,
    `Directive title: ${request.directiveTitle}`,
    categoryHint,
    '',
    request.directiveText,
    '',
    '## RETRIEVED ORGANISATIONAL KNOWLEDGE (ranked by relevance, most relevant first)',
    knowledgeSection,
    '',
    'KNOWLEDGE GAPS (sources with nothing found, or structurally unavailable):',
    gapsSection,
    '',
    '## ENGINEERING STANDARDS',
    standardsSection,
    ...correctionNote,
  ]
    .filter(Boolean)
    .join('\n')
}

type AttemptResult = { ok: true; programme: GeneratedPlanCandidate; model: string } | { ok: false; reason: string }

async function attemptGeneration(
  request: InitiationRequest,
  existingCategories: string[],
  discovery: KnowledgeDiscoveryResult,
  correction: string | null
): Promise<AttemptResult> {
  const userPrompt = buildUserPrompt(request, existingCategories, discovery, correction)

  let content: string
  let model: string
  try {
    const result = await callInitiationLlm(SYSTEM_PROMPT, userPrompt)
    content = result.content
    model = result.model
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'The generation call failed.' }
  }

  const validation = validateGeneratedPlan(content)
  if (!validation.valid) return { ok: false, reason: validation.reason }

  return { ok: true, programme: validation.programme, model }
}

/**
 * Runs one full generation attempt: Draft/GenerationFailed/Review ->
 * Generating -> Review | GenerationFailed. Knowledge Discovery runs
 * exactly once per call (its result is reused across every internal
 * self-correction retry — the organisational knowledge doesn't change
 * between attempts a few seconds apart) and is recorded on the
 * InitiationRequest regardless of whether generation itself ultimately
 * succeeds, so "what did we know when we tried this" survives even a
 * failed attempt. Internally this may make up to
 * MAX_SELF_CORRECTION_ATTEMPTS OpenAI calls — each rejected output's exact
 * validator reason is fed back to the model so it can regenerate a
 * corrected programme, rather than surfacing every transient constraint
 * miss as a user-facing failure. Only exhausting every internal attempt
 * produces a GenerationFailed record. Never throws for a bad LLM response;
 * only throws for a state-machine conflict (id not found / not in a
 * generate-able status), which the caller maps to 404/409.
 */
export async function runGeneration(id: string): Promise<InitiationRequest> {
  const started = initiationService.beginGeneration(id)
  const existingCategories = Array.from(new Set(planningStateService.listProjects().map(p => p.category).filter(Boolean)))

  const discovery = discoverKnowledge({
    project: started.project,
    directiveTitle: started.directiveTitle,
    directiveText: started.directiveText,
    excludeInitiationId: id,
  })
  initiationService.recordKnowledgeDiscovery(id, {
    retrievedAt: discovery.retrievedAt,
    sourcesConsulted: discovery.sourcesConsulted,
    itemsFound: discovery.organisationalKnowledge.length,
    topItems: discovery.organisationalKnowledge
      .slice(0, 10)
      .map(i => ({ sourceType: i.sourceType, sourceRef: i.sourceRef, title: i.title, relevanceScore: i.relevanceScore })),
    gaps: discovery.gaps,
  })

  let correction: string | null = null
  let lastReason = 'The generation call failed.'

  for (let attempt = 1; attempt <= MAX_SELF_CORRECTION_ATTEMPTS; attempt++) {
    const result = await attemptGeneration(started, existingCategories, discovery, correction)
    if (result.ok) {
      return initiationService.completeGeneration(id, result.programme, result.model)
    }
    lastReason = result.reason
    correction = result.reason
    if (attempt < MAX_SELF_CORRECTION_ATTEMPTS) {
      console.warn(`[initiation:${id}] generation attempt ${attempt} rejected, retrying with corrective feedback: ${result.reason}`)
    }
  }

  return initiationService.failGeneration(id, `${lastReason} (rejected after ${MAX_SELF_CORRECTION_ATTEMPTS} self-correction attempts)`)
}
