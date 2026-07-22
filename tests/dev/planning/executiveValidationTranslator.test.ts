import { describe, it, expect } from 'vitest'
import { validatePlan } from '../../../lib/dev/planning/planningValidator'
import { buildExecutiveValidationReport, translateValidationIssue } from '../../../lib/dev/planning/executiveValidationTranslator'
import type { EngineeringPlan, EngineeringTask, ValidationIssueType } from '../../../lib/dev/planning/planningTypes'
import type { RepositoryFacts } from '../../../lib/dev/assessment/assessmentModels'

function makeFacts(overrides: Partial<RepositoryFacts> = {}): RepositoryFacts {
  return {
    readmeExists: true,
    agentsFileExists: true,
    authFileExists: false,
    nextConfigExists: true,
    envLocalExists: true,
    packageManager: 'npm',
    frameworks: ['Next.js'],
    languages: ['TypeScript'],
    filesScanned: 100,
    totalLines: 10000,
    moduleCount: 10,
    componentCount: 10,
    apiCount: 10,
    cachingUsageCount: 0,
    supabaseConfigured: false,
    openaiDependency: false,
    hasLintScript: true,
    testFileCount: 10,
    ...overrides,
  }
}

function makeTask(overrides: Partial<EngineeringTask> = {}): EngineeringTask {
  return {
    id: `task_${Math.random().toString(36).slice(2)}`,
    title: 'Add payments webhook handler',
    description: 'Handle incoming payment webhooks.',
    reason: 'Needed for billing.',
    estimatedHours: 4,
    complexity: 'Medium',
    dependencies: [],
    priority: 'Medium',
    priorityReason: 'Normal priority.',
    status: 'Proposed',
    acceptanceCriteria: [{ text: 'Webhook returns 200 on valid payload.' }],
    engineeringSequence: null,
    source: 'Assessment',
    ...overrides,
  }
}

function makePlan(overrides: Partial<EngineeringPlan> = {}): EngineeringPlan {
  return {
    id: 'plan_1',
    projectSlug: 'test-project',
    projectName: 'Test Project',
    generatedAt: new Date().toISOString(),
    objective: 'Ship payments integration.',
    reason: 'Customer commitment.',
    expectedOutcome: 'Payments go live.',
    complexity: 'Medium',
    confidence: 'High',
    estimatedDuration: '2 weeks',
    riskLevel: 'Low',
    dependencies: [],
    acceptanceCriteria: [{ text: 'Payments flow end-to-end in staging.' }],
    tasks: [],
    risk: {
      technical: { level: 'Low', reason: 'x' },
      business: { level: 'Low', reason: 'x' },
      architecture: { level: 'Low', reason: 'x' },
      delivery: { level: 'Low', reason: 'x' },
      overall: { level: 'Low', reason: 'x' },
    },
    effort: { hours: 4, complexity: 'Medium', confidence: 'High', assumptions: [] },
    validation: { valid: true, issues: [] },
    approvalStatus: 'Proposed',
    directorReviewNote: null,
    ...overrides,
  }
}

const ALL_TYPES: ValidationIssueType[] = [
  'Missing Objective',
  'Missing Acceptance Criteria',
  'Duplicate Work',
  'Missing Dependency',
  'Invalid Engineering Order',
  'Architecture Conflict',
]

describe('Executive Validation Translator — presentation layer over the unchanged validator', () => {
  it('produces every required Executive field for every ValidationIssueType, without altering the technical text', () => {
    for (const type of ALL_TYPES) {
      const task = makeTask({ engineeringSequence: 3 })
      const plan = makePlan({ tasks: [task] })
      const issue = { type, description: `raw validator text for ${type}`, taskId: task.id }

      const explanation = translateValidationIssue(issue, plan)

      expect(explanation.issueType).toBe(type)
      expect(explanation.validationRule).toBeTruthy()
      expect(['Critical', 'High', 'Medium']).toContain(explanation.severity)
      expect(explanation.executiveSummary.length).toBeGreaterThan(0)
      expect(explanation.rootCause.length).toBeGreaterThan(0)
      expect(explanation.impact.length).toBeGreaterThan(0)
      expect(explanation.whyExecutionWasBlocked.length).toBeGreaterThan(0)
      expect(explanation.recommendedAction.length).toBeGreaterThan(0)
      // Technical Details is a verbatim passthrough of the validator's own text — never rewritten.
      expect(explanation.technicalDetails).toBe(issue.description)
    }
  })

  it('resolves affected tasks from taskId, and reports plan-level scope when taskId is null', () => {
    const task = makeTask({ title: 'Build reporting dashboard', engineeringSequence: 5 })
    const plan = makePlan({ tasks: [task] })

    const taskLevel = translateValidationIssue({ type: 'Invalid Engineering Order', description: 'd', taskId: task.id }, plan)
    expect(taskLevel.affectedTasks).toEqual([{ id: task.id, title: 'Build reporting dashboard', engineeringSequence: 5 }])

    const planLevel = translateValidationIssue({ type: 'Missing Objective', description: 'd', taskId: null }, plan)
    expect(planLevel.affectedTasks).toEqual([])
  })

  it('never invents a passing plan as failing or vice versa — buildExecutiveValidationReport mirrors validatePlan exactly', () => {
    const facts: RepositoryFacts = makeFacts()

    const validPlan = makePlan({ tasks: [makeTask({ title: 'Unique task A' })] })
    const validResult = validatePlan(validPlan, [], facts)
    expect(validResult.valid).toBe(true)
    expect(buildExecutiveValidationReport({ ...validPlan, validation: validResult })).toHaveLength(0)

    const noObjectivePlan = makePlan({ objective: '', tasks: [makeTask({ title: 'Unique task B' })] })
    const invalidResult = validatePlan(noObjectivePlan, [], facts)
    expect(invalidResult.valid).toBe(false)
    const report = buildExecutiveValidationReport({ ...noObjectivePlan, validation: invalidResult })
    expect(report.length).toBe(invalidResult.issues.length)
    expect(report[0].issueType).toBe(invalidResult.issues[0].type)
    expect(report[0].technicalDetails).toBe(invalidResult.issues[0].description)
  })

  it('surfaces the real Invalid Engineering Order case (this defect\'s own reported symptom) in Executive language', () => {
    const facts: RepositoryFacts = makeFacts()
    const sequencedTask = makeTask({
      title: 'Implement production deployment pipeline',
      engineeringSequence: 4,
      priority: 'Low',
      dependencies: [{ relation: 'Requires', target: 'Core Data Model', reason: 'Needs the data model in place first.' }],
      priorityReason: 'Sequence violation: "Implement production deployment pipeline" is position 4 in the Engineering Sequence, but the project is currently at position 1 — "Core Data Model" (position 2) has not been reached yet. Demoted rather than skipped ahead.',
    })
    const plan = makePlan({ tasks: [sequencedTask] })
    const result = validatePlan(plan, [], facts)

    expect(result.valid).toBe(false)
    expect(result.issues[0].type).toBe('Invalid Engineering Order')

    const [explanation] = buildExecutiveValidationReport({ ...plan, validation: result })
    expect(explanation.validationRule).toBe('Invalid Engineering Order')
    expect(explanation.executiveSummary).not.toMatch(/Sequence violation/)
    expect(explanation.technicalDetails).toBe(sequencedTask.priorityReason)
    expect(explanation.affectedTasks[0].title).toBe('Implement production deployment pipeline')
  })
})
