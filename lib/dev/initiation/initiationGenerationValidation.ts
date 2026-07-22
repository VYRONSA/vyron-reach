import { createHash } from 'node:crypto'
import type {
  GeneratedBatchCandidate,
  GeneratedDependencyCandidate,
  GeneratedMilestoneCandidate,
  GeneratedPlanCandidate,
  GeneratedRiskCandidate,
  RiskLevel,
} from './initiationTypes'

/**
 * Hand-rolled structural validator for the LLM's raw JSON output — same
 * defensive style as lib/dev/runtime/runtimeValidation.ts's
 * validateClaudeOutput (every field read defensively, nothing fabricated,
 * malformed output rejected outright rather than partially accepted). No
 * schema library is introduced; this mirrors the house convention rather
 * than adding a new dependency for one call site.
 *
 * This only catches STRUCTURAL problems (wrong shape, dangling
 * references, out-of-enum values, an empty programme). It cannot catch a
 * structurally valid but low-quality programme (e.g. one vague milestone)
 * — that is what the mandatory human Review step is for, not this
 * function.
 */
export type GenerationValidationResult = { valid: true; programme: GeneratedPlanCandidate } | { valid: false; reason: string }

const MAX_MILESTONES = 8
const MIN_MILESTONES = 3
const MAX_BATCHES_PER_MILESTONE = 6
const MIN_BATCHES_PER_MILESTONE = 2
const MAX_STRING_LENGTH = 4000
const RISK_LEVELS: RiskLevel[] = ['Low', 'Medium', 'High']
const COMPLEXITY_LEVELS = ['Low', 'Medium', 'High', 'Very High']

function isNonEmptyString(value: unknown, max = MAX_STRING_LENGTH): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(x => typeof x === 'string')
}

/** sourceRefs is optional attribution (requirement: "every generated recommendation can identify where supporting knowledge originated") — absent is legitimate for genuinely greenfield items with nothing to cite, but if present it must actually be a string array, not a malformed placeholder. */
function validateOptionalSourceRefs(value: unknown): { valid: true; sourceRefs?: string[] } | { valid: false; reason: string } {
  if (value === undefined) return { valid: true }
  if (!isStringArray(value)) return { valid: false, reason: '"sourceRefs", when present, must be an array of strings.' }
  return { valid: true, sourceRefs: value }
}

export function validateGeneratedPlan(raw: string): GenerationValidationResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { valid: false, reason: 'The model did not return valid JSON.' }
  }
  return validateProgrammeCandidate(parsed)
}

/**
 * The structural validator, callable directly against an already-parsed
 * value — not just raw LLM JSON text. This is the single source of truth
 * `validateGeneratedPlan` (the generation path) and
 * initiationService.ts's re-validation checkpoints (Review edits,
 * Approval, Provisioning) all funnel through, so a human-edited
 * `reviewedProgramme` is held to exactly the same rules as the model's own
 * output — TypeScript's compile-time types alone do not enforce runtime
 * constraints like "2-6 batches," so this is what actually catches a
 * Review-board edit that quietly breaks that invariant.
 */
export function validateProgrammeCandidate(parsed: unknown): GenerationValidationResult {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { valid: false, reason: 'The model output was not a JSON object.' }
  }
  const record = parsed as Record<string, unknown>

  const assessmentResult = validateAssessment(record.assessment)
  if (!assessmentResult.valid) return assessmentResult

  if (!Array.isArray(record.milestones) || record.milestones.length === 0) {
    return { valid: false, reason: 'The model produced no milestones. A mandatory-entry-point programme must have at least one.' }
  }
  if (record.milestones.length < MIN_MILESTONES || record.milestones.length > MAX_MILESTONES) {
    return { valid: false, reason: `Expected ${MIN_MILESTONES}-${MAX_MILESTONES} milestones, got ${record.milestones.length}.` }
  }

  const milestoneIds = new Set<string>()
  const milestones: GeneratedMilestoneCandidate[] = []
  for (const raw of record.milestones) {
    const m = validateMilestone(raw)
    if (!m.valid) return m
    if (milestoneIds.has(m.milestone.tempId)) return { valid: false, reason: `Duplicate milestone tempId "${m.milestone.tempId}".` }
    milestoneIds.add(m.milestone.tempId)
    milestones.push(m.milestone)
  }

  if (!Array.isArray(record.batches) || record.batches.length === 0) {
    return { valid: false, reason: 'The model produced no delivery batches. A mandatory-entry-point programme must have at least one.' }
  }

  const batchIds = new Set<string>()
  const batchNumbers = new Set<string>()
  const batches: GeneratedBatchCandidate[] = []
  const batchCountByMilestone = new Map<string, number>()
  for (const raw of record.batches) {
    const b = validateBatch(raw, milestoneIds)
    if (!b.valid) return b
    if (batchIds.has(b.batch.tempId)) return { valid: false, reason: `Duplicate batch tempId "${b.batch.tempId}".` }
    if (batchNumbers.has(b.batch.batchNumber)) return { valid: false, reason: `Duplicate batchNumber "${b.batch.batchNumber}".` }
    batchIds.add(b.batch.tempId)
    batchNumbers.add(b.batch.batchNumber)
    batches.push(b.batch)
    batchCountByMilestone.set(b.batch.milestoneRef, (batchCountByMilestone.get(b.batch.milestoneRef) ?? 0) + 1)
  }

  for (const milestone of milestones) {
    const count = batchCountByMilestone.get(milestone.tempId) ?? 0
    if (count < MIN_BATCHES_PER_MILESTONE || count > MAX_BATCHES_PER_MILESTONE) {
      return {
        valid: false,
        reason: `Milestone "${milestone.title}" has ${count} batches; expected ${MIN_BATCHES_PER_MILESTONE}-${MAX_BATCHES_PER_MILESTONE}.`,
      }
    }
  }

  const risks: GeneratedRiskCandidate[] = []
  if (record.risks !== undefined) {
    if (!Array.isArray(record.risks)) return { valid: false, reason: '"risks" must be an array.' }
    const riskIds = new Set<string>()
    for (const raw of record.risks) {
      const r = validateRisk(raw, milestoneIds)
      if (!r.valid) return r
      if (riskIds.has(r.risk.tempId)) return { valid: false, reason: `Duplicate risk tempId "${r.risk.tempId}".` }
      riskIds.add(r.risk.tempId)
      risks.push(r.risk)
    }
  }

  const dependencies: GeneratedDependencyCandidate[] = []
  if (record.dependencies !== undefined) {
    if (!Array.isArray(record.dependencies)) return { valid: false, reason: '"dependencies" must be an array.' }
    const refs = new Set<string>([...milestoneIds, ...batchIds])
    for (const raw of record.dependencies) {
      const d = validateDependency(raw, refs)
      if (!d.valid) return d
      dependencies.push(d.dependency)
    }
  }

  return { valid: true, programme: { assessment: assessmentResult.assessment, milestones, batches, risks, dependencies } }
}

function validateAssessment(raw: unknown): { valid: true; assessment: GeneratedPlanCandidate['assessment'] } | { valid: false; reason: string } {
  if (typeof raw !== 'object' || raw === null) return { valid: false, reason: '"assessment" is missing or not an object.' }
  const a = raw as Record<string, unknown>

  if (!isNonEmptyString(a.summary)) return { valid: false, reason: 'assessment.summary is missing or not a string.' }
  if (!isNonEmptyString(a.scope)) return { valid: false, reason: 'assessment.scope is missing or not a string.' }
  if (typeof a.feasibilityNotes !== 'string') return { valid: false, reason: 'assessment.feasibilityNotes must be a string.' }
  if (!Array.isArray(a.assumptions) || !a.assumptions.every(x => typeof x === 'string')) {
    return { valid: false, reason: 'assessment.assumptions must be an array of strings.' }
  }
  if (!Array.isArray(a.openQuestions) || !a.openQuestions.every(x => typeof x === 'string')) {
    return { valid: false, reason: 'assessment.openQuestions must be an array of strings.' }
  }
  if (typeof a.estimatedComplexity !== 'string' || !COMPLEXITY_LEVELS.includes(a.estimatedComplexity)) {
    return { valid: false, reason: `assessment.estimatedComplexity must be one of: ${COMPLEXITY_LEVELS.join(', ')}.` }
  }
  if (!isNonEmptyString(a.recommendedCategory, 200)) return { valid: false, reason: 'assessment.recommendedCategory is missing or not a string.' }
  if (!isStringArray(a.knowledgeSourcesConsidered)) {
    return { valid: false, reason: 'assessment.knowledgeSourcesConsidered is missing or not an array of strings — it must be present (an empty array is fine when no organisational knowledge was available).' }
  }

  return {
    valid: true,
    assessment: {
      summary: a.summary,
      scope: a.scope,
      feasibilityNotes: a.feasibilityNotes,
      assumptions: a.assumptions,
      openQuestions: a.openQuestions,
      estimatedComplexity: a.estimatedComplexity as GeneratedPlanCandidate['assessment']['estimatedComplexity'],
      recommendedCategory: a.recommendedCategory,
      knowledgeSourcesConsidered: a.knowledgeSourcesConsidered,
    },
  }
}

function validateMilestone(raw: unknown): { valid: true; milestone: GeneratedMilestoneCandidate } | { valid: false; reason: string } {
  if (typeof raw !== 'object' || raw === null) return { valid: false, reason: 'A milestone entry was not an object.' }
  const m = raw as Record<string, unknown>
  if (!isNonEmptyString(m.tempId, 100)) return { valid: false, reason: 'A milestone is missing a valid tempId.' }
  if (!isNonEmptyString(m.title, 300)) return { valid: false, reason: `Milestone "${m.tempId}" is missing a valid title.` }
  if (typeof m.description !== 'string') return { valid: false, reason: `Milestone "${m.tempId}" description must be a string.` }
  if (typeof m.phase !== 'string') return { valid: false, reason: `Milestone "${m.tempId}" phase must be a string.` }
  if (!isFiniteNumber(m.sequence)) return { valid: false, reason: `Milestone "${m.tempId}" sequence must be a number.` }
  const sourceRefs = validateOptionalSourceRefs(m.sourceRefs)
  if (!sourceRefs.valid) return { valid: false, reason: `Milestone "${m.tempId}": ${sourceRefs.reason}` }
  return {
    valid: true,
    milestone: { tempId: m.tempId, title: m.title, description: m.description, phase: m.phase, sequence: m.sequence, ...(sourceRefs.sourceRefs ? { sourceRefs: sourceRefs.sourceRefs } : {}) },
  }
}

function validateBatch(raw: unknown, milestoneIds: Set<string>): { valid: true; batch: GeneratedBatchCandidate } | { valid: false; reason: string } {
  if (typeof raw !== 'object' || raw === null) return { valid: false, reason: 'A batch entry was not an object.' }
  const b = raw as Record<string, unknown>
  if (!isNonEmptyString(b.tempId, 100)) return { valid: false, reason: 'A batch is missing a valid tempId.' }
  if (!isNonEmptyString(b.milestoneRef, 100) || !milestoneIds.has(b.milestoneRef)) {
    return { valid: false, reason: `Batch "${b.tempId}" has milestoneRef "${String(b.milestoneRef)}" that does not resolve to any generated milestone.` }
  }
  if (!isNonEmptyString(b.batchNumber, 100)) return { valid: false, reason: `Batch "${b.tempId}" is missing a valid batchNumber.` }
  if (!isNonEmptyString(b.objective)) return { valid: false, reason: `Batch "${b.tempId}" is missing a valid objective.` }
  if (typeof b.summary !== 'string') return { valid: false, reason: `Batch "${b.tempId}" summary must be a string.` }
  if (typeof b.claudePrompt !== 'string') return { valid: false, reason: `Batch "${b.tempId}" claudePrompt must be a string.` }
  if (!isFiniteNumber(b.sequence)) return { valid: false, reason: `Batch "${b.tempId}" sequence must be a number.` }
  const sourceRefs = validateOptionalSourceRefs(b.sourceRefs)
  if (!sourceRefs.valid) return { valid: false, reason: `Batch "${b.tempId}": ${sourceRefs.reason}` }
  return {
    valid: true,
    batch: {
      tempId: b.tempId,
      milestoneRef: b.milestoneRef,
      batchNumber: b.batchNumber,
      objective: b.objective,
      summary: b.summary,
      claudePrompt: b.claudePrompt,
      sequence: b.sequence,
      ...(sourceRefs.sourceRefs ? { sourceRefs: sourceRefs.sourceRefs } : {}),
    },
  }
}

function validateRisk(raw: unknown, milestoneIds: Set<string>): { valid: true; risk: GeneratedRiskCandidate } | { valid: false; reason: string } {
  if (typeof raw !== 'object' || raw === null) return { valid: false, reason: 'A risk entry was not an object.' }
  const r = raw as Record<string, unknown>
  if (!isNonEmptyString(r.tempId, 100)) return { valid: false, reason: 'A risk is missing a valid tempId.' }
  if (!isNonEmptyString(r.title, 300)) return { valid: false, reason: 'A risk is missing a valid title.' }
  if (typeof r.description !== 'string') return { valid: false, reason: `Risk "${r.title}" description must be a string.` }
  const relatedMilestoneRef = r.relatedMilestoneRef
  if (relatedMilestoneRef !== undefined && relatedMilestoneRef !== '' && typeof relatedMilestoneRef === 'string' && !milestoneIds.has(relatedMilestoneRef)) {
    return { valid: false, reason: `Risk "${r.title}" has relatedMilestoneRef that does not resolve to any generated milestone.` }
  }
  if (typeof r.severity !== 'string' || !RISK_LEVELS.includes(r.severity as RiskLevel)) {
    return { valid: false, reason: `Risk "${r.title}" severity must be one of: ${RISK_LEVELS.join(', ')}.` }
  }
  if (typeof r.probability !== 'string' || !RISK_LEVELS.includes(r.probability as RiskLevel)) {
    return { valid: false, reason: `Risk "${r.title}" probability must be one of: ${RISK_LEVELS.join(', ')}.` }
  }
  if (typeof r.mitigation !== 'string') return { valid: false, reason: `Risk "${r.title}" mitigation must be a string.` }
  const sourceRefs = validateOptionalSourceRefs(r.sourceRefs)
  if (!sourceRefs.valid) return { valid: false, reason: `Risk "${r.title}": ${sourceRefs.reason}` }
  return {
    valid: true,
    risk: {
      tempId: r.tempId,
      title: r.title,
      description: r.description,
      relatedMilestoneRef: typeof relatedMilestoneRef === 'string' ? relatedMilestoneRef : '',
      severity: r.severity as RiskLevel,
      probability: r.probability as RiskLevel,
      mitigation: r.mitigation,
      ...(sourceRefs.sourceRefs ? { sourceRefs: sourceRefs.sourceRefs } : {}),
    },
  }
}

function validateDependency(raw: unknown, refs: Set<string>): { valid: true; dependency: GeneratedDependencyCandidate } | { valid: false; reason: string } {
  if (typeof raw !== 'object' || raw === null) return { valid: false, reason: 'A dependency entry was not an object.' }
  const d = raw as Record<string, unknown>
  if (d.fromType !== 'milestone' && d.fromType !== 'batch') return { valid: false, reason: 'dependency.fromType must be "milestone" or "batch".' }
  if (d.toType !== 'milestone' && d.toType !== 'batch') return { valid: false, reason: 'dependency.toType must be "milestone" or "batch".' }
  if (!isNonEmptyString(d.fromRef, 100) || !refs.has(d.fromRef)) return { valid: false, reason: 'dependency.fromRef does not resolve to any generated milestone/batch.' }
  if (!isNonEmptyString(d.toRef, 100) || !refs.has(d.toRef)) return { valid: false, reason: 'dependency.toRef does not resolve to any generated milestone/batch.' }
  if (typeof d.note !== 'string') return { valid: false, reason: 'dependency.note must be a string.' }
  return { valid: true, dependency: { fromType: d.fromType, fromRef: d.fromRef, toType: d.toType, toRef: d.toRef, note: d.note } }
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = canonicalize((value as Record<string, unknown>)[key])
    }
    return sorted
  }
  return value
}

/**
 * A content fingerprint for a programme — sorted-key JSON before hashing,
 * so two structurally identical objects built through different code
 * paths (e.g. object-literal construction vs. spread) never produce
 * different fingerprints purely from key-insertion order. This is what
 * lets initiationService.ts detect "the reviewed programme changed since
 * it was last validated/approved" without storing a full second copy of
 * the programme for comparison.
 */
export function computeProgrammeFingerprint(programme: GeneratedPlanCandidate): string {
  return createHash('sha256').update(JSON.stringify(canonicalize(programme))).digest('hex')
}

/**
 * A content fingerprint for exactly one risk (title/description/severity/
 * probability/mitigation/relatedMilestoneRef — deliberately excluding
 * `tempId` and `sourceRefs`, which are identity/attribution metadata, not
 * the risk's substance). This is what lets an Executive Risk Gate
 * decision (lib/dev/initiation/riskGate.ts) be scoped to ONE risk: editing
 * a different risk in the same programme never invalidates this one's
 * already-recorded decision, but editing THIS risk's own content does.
 */
export function computeRiskFingerprint(risk: GeneratedRiskCandidate): string {
  const { title, description, relatedMilestoneRef, severity, probability, mitigation } = risk
  return createHash('sha256').update(JSON.stringify(canonicalize({ title, description, relatedMilestoneRef, severity, probability, mitigation }))).digest('hex')
}
