import { describe, it, expect } from 'vitest'
import { buildValidationActions } from '../../lib/dev/executiveActionEngine'
import type { DevelopmentSession } from '../../lib/dev/developmentOrchestrator'

/**
 * PRAT-1 DEF-001 (Executive Build Validation Navigation) — this file had
 * zero prior test coverage. The reported defect: the Executive's "RUN
 * VALIDATION" button (MissionControl.tsx) and the Executive Action
 * Queue's build-failure item (ExecutiveActionQueuePanel.tsx) both
 * navigated to the generic Git & Build page instead of opening the
 * Executive Build Failure Report (DEF-004) already implemented and
 * correctly wired to ExecutiveCommandCentre's own "View Build Report"
 * button. The fix has both components open the report whenever an
 * action's `category === 'Validation'` and `sourceEngine === 'Build
 * Intelligence'` — the exact signal `buildValidationActions` produces.
 * These tests guard that contract so a future change to this function
 * can't silently break the navigation fix without a test failing here.
 */

function baseSession(overrides: Partial<DevelopmentSession> = {}): DevelopmentSession {
  return {
    buildStatus: 'Passing',
    typescriptStatus: 'Passing',
    ...overrides,
  } as DevelopmentSession
}

describe('buildValidationActions — the signal DEF-001\'s Build Failure Report navigation depends on', () => {
  it('produces a Critical, Validation-category, Build-Intelligence-sourced action when the build is Failing', () => {
    const actions = buildValidationActions(baseSession({ buildStatus: 'Failing' }))
    expect(actions).toHaveLength(1)
    expect(actions[0]).toMatchObject({
      priority: 'Critical',
      category: 'Validation',
      title: 'Build Is Failing',
      sourceEngine: 'Build Intelligence',
    })
  })

  it('produces a Critical, Validation-category, Build-Intelligence-sourced action when TypeScript is Failing', () => {
    const actions = buildValidationActions(baseSession({ typescriptStatus: 'Failing' }))
    expect(actions).toHaveLength(1)
    expect(actions[0]).toMatchObject({
      priority: 'Critical',
      category: 'Validation',
      title: 'TypeScript Is Failing',
      sourceEngine: 'Build Intelligence',
    })
  })

  it('produces both actions when both build and TypeScript are Failing', () => {
    const actions = buildValidationActions(baseSession({ buildStatus: 'Failing', typescriptStatus: 'Failing' }))
    expect(actions).toHaveLength(2)
    expect(actions.every(a => a.category === 'Validation' && a.sourceEngine === 'Build Intelligence')).toBe(true)
  })

  it('produces no action when both are Passing — the Build Failure Report is only ever offered for a genuine failure', () => {
    const actions = buildValidationActions(baseSession())
    expect(actions).toHaveLength(0)
  })

  it('still carries a Git & Build href as the fallback destination, for callers with no report wired in', () => {
    const actions = buildValidationActions(baseSession({ buildStatus: 'Failing' }))
    expect(actions[0].href).toBe('/dev/git-build')
  })
})
