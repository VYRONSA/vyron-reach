import { describe, it, expect } from 'vitest'
import { buildWorkerTaskResult, validateWorkerOutput } from '../../../lib/dev/director/workforce/workerReview'
import { parseClaudeReport } from '../../../lib/dev/developmentCompletionEngine'

const SAMPLE_REPORT = `
Executive Summary
Implemented the login form.

Files Created
- components/LoginForm.tsx

Files Modified
- app/login/page.tsx

Risks Identified
- Session token is not yet rotated on login

Technical Debt Identified
- Form validation is duplicated between client and server

Architecture Decisions
- Use React Hook Form for form state

Remaining Recommendations
- Add rate limiting to the login endpoint
`

describe('Worker Review — buildWorkerTaskResult maps ParsedClaudeReport 1:1', () => {
  it('maps every field to the six required outputs', () => {
    const parsed = parseClaudeReport(SAMPLE_REPORT)
    const result = buildWorkerTaskResult('task-1', 'Frontend Engineer', parsed)

    expect(result.taskId).toBe('task-1')
    expect(result.role).toBe('Frontend Engineer')
    expect(result.summary).toMatch(/login form/i)
    expect(result.filesChanged.created).toEqual(['components/LoginForm.tsx'])
    expect(result.filesChanged.modified).toEqual(['app/login/page.tsx'])
    expect(result.filesChanged.deleted).toEqual([])
    expect(result.engineeringFindings).toEqual(['Use React Hook Form for form state'])
    expect(result.risksDiscovered).toEqual(['Session token is not yet rotated on login'])
    expect(result.technicalDebtIntroduced).toEqual(['Form validation is duplicated between client and server'])
    expect(result.recommendations).toEqual(['Add rate limiting to the login endpoint'])
  })

  it('never fabricates a finding — an empty report section produces an empty array, not a guess', () => {
    const parsed = parseClaudeReport('Executive Summary\nDid nothing notable.')
    const result = buildWorkerTaskResult('task-2', 'Backend Engineer', parsed)
    expect(result.risksDiscovered).toEqual([])
    expect(result.technicalDebtIntroduced).toEqual([])
    expect(result.engineeringFindings).toEqual([])
  })
})

describe('Worker Review — validateWorkerOutput (the "only validated work updates Planning/Knowledge" gate)', () => {
  function validResult() {
    return buildWorkerTaskResult('task-1', 'Backend Engineer', parseClaudeReport(SAMPLE_REPORT))
  }

  it('approves a well-formed result with a passing build/TS status', () => {
    const outcome = validateWorkerOutput(validResult(), 'Passing', 'Passing')
    expect(outcome.decision).toBe('Approved')
    expect(outcome.reasons).toEqual([])
  })

  it('rejects when the build is failing, even with an otherwise valid report', () => {
    const outcome = validateWorkerOutput(validResult(), 'Failing', 'Passing')
    expect(outcome.decision).toBe('Rejected')
    expect(outcome.reasons.join(' ')).toMatch(/build/i)
  })

  it('rejects when TypeScript is failing', () => {
    const outcome = validateWorkerOutput(validResult(), 'Passing', 'Failing')
    expect(outcome.decision).toBe('Rejected')
  })

  it('rejects a result with no executive summary', () => {
    const result = buildWorkerTaskResult('task-1', 'Backend Engineer', parseClaudeReport(''))
    const outcome = validateWorkerOutput({ ...result, summary: '' }, 'Passing', 'Passing')
    expect(outcome.decision).toBe('Rejected')
    expect(outcome.reasons.join(' ')).toMatch(/summary/i)
  })

  it('rejects a result reporting zero file changes', () => {
    const result = validResult()
    const outcome = validateWorkerOutput({ ...result, filesChanged: { created: [], modified: [], deleted: [] } }, 'Passing', 'Passing')
    expect(outcome.decision).toBe('Rejected')
    expect(outcome.reasons.join(' ')).toMatch(/no files/i)
  })

  it('accumulates every failing reason, not just the first', () => {
    const result = validResult()
    const outcome = validateWorkerOutput({ ...result, summary: '', filesChanged: { created: [], modified: [], deleted: [] } }, 'Failing', 'Failing')
    expect(outcome.reasons.length).toBeGreaterThanOrEqual(4)
  })

  it('is a pure function — identical input produces byte-identical output', () => {
    const result = validResult()
    expect(JSON.stringify(validateWorkerOutput(result, 'Passing', 'Passing'))).toBe(JSON.stringify(validateWorkerOutput(result, 'Passing', 'Passing')))
  })
})
