import { afterEach, describe, it, expect, vi } from 'vitest'
import { computeFullAssessment } from '../../../lib/dev/assessment/computeAssessment'
import type { RepositoryFacts } from '../../../lib/dev/assessment/assessmentModels'
import type { ExecutionAnalyticsSummary } from '../../../lib/dev/learning/executionAnalytics'

function makeFacts(): RepositoryFacts {
  return {
    readmeExists: true,
    agentsFileExists: true,
    authFileExists: true,
    nextConfigExists: true,
    envLocalExists: true,
    packageManager: 'npm',
    frameworks: ['Next.js'],
    languages: ['TypeScript'],
    filesScanned: 10,
    totalLines: 1000,
    moduleCount: 5,
    componentCount: 5,
    apiCount: 5,
    cachingUsageCount: 0,
    supabaseConfigured: false,
    openaiDependency: false,
    hasLintScript: true,
    testFileCount: 5,
  }
}

function makeLearningSummary(): ExecutionAnalyticsSummary {
  return { totalExecutions: 0, successRate: null, averageCost: null, averageDurationMs: null, outcomeBreakdown: { Succeeded: 0, Failed: 0, RolledBack: 0, Rejected: 0, Unknown: 0 } }
}

/** Routes a fake fetch to the same three GET endpoints computeFullAssessment always calls, plus the POST /api/dev/assessment persist step — a real network layer is never involved. */
function stubFetch(options: { persistOk: boolean }) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = String(input)
      if (init?.method === 'POST' && url.includes('/api/dev/assessment')) {
        if (options.persistOk) {
          return new Response(JSON.stringify({ snapshot: {}, trend: null, written: true }), { status: 201 })
        }
        return new Response(JSON.stringify({ error: 'Simulated persist failure.' }), { status: 500 })
      }
      if (url.includes('/api/dev/intelligence/report')) {
        return new Response(JSON.stringify({ findings: [] }), { status: 200 })
      }
      if (url.includes('/api/dev/runtime/jobs')) {
        return new Response(JSON.stringify({ jobs: [] }), { status: 200 })
      }
      if (url.includes('/api/dev/assessment')) {
        return new Response(JSON.stringify({ facts: makeFacts(), dnaProfile: null, learningSummary: makeLearningSummary() }), { status: 200 })
      }
      throw new Error(`Unexpected fetch in test: ${url}`)
    })
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('computeFullAssessment — PRA-P1-006 (persist failure never discards the computed report)', () => {
  it('returns the fully-computed assessment with persistError set when only the persist step fails', async () => {
    stubFetch({ persistOk: false })

    const result = await computeFullAssessment('test-project', undefined, undefined, true)

    expect(result.assessment).toBeTruthy()
    expect(result.assessment.projectSlug).toBe('test-project')
    expect(result.persistError).toBeTruthy()
    expect(result.persistError).toMatch(/Simulated persist failure/)
  })

  it('persistError is null when persist succeeds', async () => {
    stubFetch({ persistOk: true })

    const result = await computeFullAssessment('test-project', undefined, undefined, true)

    expect(result.assessment).toBeTruthy()
    expect(result.persistError).toBeNull()
  })

  it('persistError is null when persist was never requested', async () => {
    stubFetch({ persistOk: false }) // would fail if ever called

    const result = await computeFullAssessment('test-project', undefined, undefined, false)

    expect(result.assessment).toBeTruthy()
    expect(result.persistError).toBeNull()
  })

  it('still throws when the read pipeline itself fails (nothing to show, unlike a persist-only failure)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'down' }), { status: 500 }))
    )

    await expect(computeFullAssessment('test-project', undefined, undefined, true)).rejects.toThrow()
  })
})
