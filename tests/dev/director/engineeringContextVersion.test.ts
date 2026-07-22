import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { computeEngineeringContextVersions, engineeringContextVersionsEqual, describeVersionChange } from '../../../lib/dev/director/engineeringContextVersion'
import * as knowledgeService from '../../../lib/dev/knowledge/knowledgeService'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import { appendDNAEntry } from '../../../lib/dev/learning/learningStorage'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

describe('Engineering Context Version — computeEngineeringContextVersions', () => {
  it('returns 0 planningVersion and stable knowledge/dna versions for a project with no state yet', () => {
    const project = uniqueSlug()
    const versions = computeEngineeringContextVersions(project)
    expect(versions.planningVersion).toBe(0)
    expect(versions.dnaVersion).toBe('none')
    expect(versions.executionContextVersion).toBeTruthy()
  })

  it('is stable across repeated calls with nothing changed', () => {
    const project = uniqueSlug()
    const a = computeEngineeringContextVersions(project)
    const b = computeEngineeringContextVersions(project)
    expect(a).toEqual(b)
  })

  it('reflects a Planning Service change (e.g. a project update) via planningVersion', () => {
    const project = uniqueSlug()
    planningStateService.createProject({ name: project, slug: project, description: '', category: 'test', status: 'active', progress: 0, color: '#000', icon: 'x' })
    const before = computeEngineeringContextVersions(project)
    planningStateService.updateProject(project, { progress: 50 })
    const after = computeEngineeringContextVersions(project)
    expect(after.planningVersion).toBe(before.planningVersion + 1)
    expect(after.executionContextVersion).not.toBe(before.executionContextVersion)
  })

  it('reflects an Architecture Decision recorded through the Knowledge Service', () => {
    const project = uniqueSlug()
    const before = computeEngineeringContextVersions(project)
    knowledgeService.recordArchitectureDecision({ project, decision: 'Use Postgres' })
    const after = computeEngineeringContextVersions(project)
    expect(after.knowledgeVersion).not.toBe(before.knowledgeVersion)
    // Recording an Architecture Decision also mirrors a Planning Service Decision (see knowledgeService.ts), so planningVersion moves too.
    expect(after.planningVersion).toBeGreaterThan(before.planningVersion)
  })

  it('reflects a Business Decision recorded through the Knowledge Service', () => {
    const project = uniqueSlug()
    const before = computeEngineeringContextVersions(project)
    knowledgeService.recordBusinessDecision({ project, decision: 'Delay launch' })
    const after = computeEngineeringContextVersions(project)
    expect(after.knowledgeVersion).not.toBe(before.knowledgeVersion)
  })

  it('reflects a Risk recorded through the Knowledge Service', () => {
    const project = uniqueSlug()
    const before = computeEngineeringContextVersions(project)
    knowledgeService.recordRisk({ project, title: 'Vendor risk', severity: 'High' })
    const after = computeEngineeringContextVersions(project)
    expect(after.knowledgeVersion).not.toBe(before.knowledgeVersion)
  })

  it('reflects Technical Debt recorded through the Knowledge Service', () => {
    const project = uniqueSlug()
    const before = computeEngineeringContextVersions(project)
    knowledgeService.recordTechnicalDebt({ project, title: 'No tests', priority: 'High' })
    const after = computeEngineeringContextVersions(project)
    expect(after.knowledgeVersion).not.toBe(before.knowledgeVersion)
  })

  it('reflects a DNA profile change via dnaVersion, independent of Knowledge Service counts', () => {
    const project = uniqueSlug()
    const before = computeEngineeringContextVersions(project)
    appendDNAEntry({ id: 'd1', productSlug: project, category: 'Architecture', title: 'X', description: '', evidenceExecutionIds: [], version: 1, createdAt: new Date().toISOString(), supersedes: null })
    const after = computeEngineeringContextVersions(project)
    expect(after.dnaVersion).not.toBe(before.dnaVersion)
    expect(after.knowledgeVersion).not.toBe(before.knowledgeVersion) // dna is embedded in the combined knowledgeVersion too
    expect(after.executionContextVersion).not.toBe(before.executionContextVersion)
  })

  it('keeps two projects fully independent', () => {
    const projectA = uniqueSlug('a')
    const projectB = uniqueSlug('b')
    const baseline = computeEngineeringContextVersions(projectB)
    knowledgeService.recordRisk({ project: projectA, title: 'X' })
    expect(computeEngineeringContextVersions(projectB)).toEqual(baseline)
  })
})

describe('Engineering Context Version — engineeringContextVersionsEqual', () => {
  it('treats null as never equal, forcing a refresh whenever there is no prior baseline', () => {
    const project = uniqueSlug()
    const versions = computeEngineeringContextVersions(project)
    expect(engineeringContextVersionsEqual(versions, null)).toBe(false)
  })

  it('is true when knowledgeVersion, planningVersion, and dnaVersion all match, regardless of executionContextVersion identity', () => {
    const project = uniqueSlug()
    const a = computeEngineeringContextVersions(project)
    const b = computeEngineeringContextVersions(project)
    expect(engineeringContextVersionsEqual(a, b)).toBe(true)
  })

  it('is false when only planningVersion differs', () => {
    const project = uniqueSlug()
    const a = computeEngineeringContextVersions(project)
    planningStateService.createProject({ name: project, slug: project, description: '', category: 'test', status: 'active', progress: 0, color: '#000', icon: 'x' })
    const b = computeEngineeringContextVersions(project)
    expect(engineeringContextVersionsEqual(b, a)).toBe(false)
  })
})

describe('Engineering Context Version — describeVersionChange', () => {
  it('describes an initial load when there is no previous baseline', () => {
    const project = uniqueSlug()
    const versions = computeEngineeringContextVersions(project)
    expect(describeVersionChange(versions, null)).toMatch(/initial/i)
  })

  it('names which service changed', () => {
    const project = uniqueSlug()
    const before = computeEngineeringContextVersions(project)
    planningStateService.createProject({ name: project, slug: project, description: '', category: 'test', status: 'active', progress: 0, color: '#000', icon: 'x' })
    const after = computeEngineeringContextVersions(project)
    expect(describeVersionChange(after, before)).toMatch(/Planning Service/)
  })
})
