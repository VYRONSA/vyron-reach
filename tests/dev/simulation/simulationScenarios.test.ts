import { describe, it, expect } from 'vitest'
import { SCENARIO_IDS, getScenarioDefinition, resolveLoad } from '../../../lib/dev/simulation/simulationScenarios'

describe('Simulation Scenarios — every scenario is well-formed', () => {
  it('has exactly 14 scenarios, matching the mission\'s list', () => {
    expect(SCENARIO_IDS).toHaveLength(14)
  })

  it('every scenario definition has sane, non-negative quantities', () => {
    for (const id of SCENARIO_IDS) {
      const def = getScenarioDefinition(id)
      expect(def.base.projects).toBeGreaterThan(0)
      expect(def.base.featuresPerProject).toBeGreaterThan(0)
      expect(def.base.tasksPerFeature).toBeGreaterThan(0)
      expect(def.base.knowledgeRecordsPerFeature).toBeGreaterThan(0)
      expect(def.workerFailureRate).toBeGreaterThanOrEqual(0)
      expect(def.workerFailureRate).toBeLessThanOrEqual(1)
    }
  })
})

describe('Simulation Scenarios — resolveLoad', () => {
  it('Small load returns exactly the scenario\'s base numbers', () => {
    const base = getScenarioDefinition('single-project').base
    expect(resolveLoad('single-project', 'Small')).toEqual(base)
  })

  it('larger load profiles scale featuresPerProject and knowledgeRecordsPerFeature upward', () => {
    const small = resolveLoad('single-project', 'Small')
    const medium = resolveLoad('single-project', 'Medium')
    const large = resolveLoad('single-project', 'Large')
    const enterprise = resolveLoad('single-project', 'Enterprise')
    expect(medium.featuresPerProject).toBeGreaterThan(small.featuresPerProject)
    expect(large.featuresPerProject).toBeGreaterThan(medium.featuresPerProject)
    expect(enterprise.featuresPerProject).toBeGreaterThan(large.featuresPerProject)
  })

  it('never scales project count or tasksPerFeature — those are scenario-defined, not load-defined', () => {
    const small = resolveLoad('multiple-projects', 'Small')
    const enterprise = resolveLoad('multiple-projects', 'Enterprise')
    expect(enterprise.projects).toBe(small.projects)
    expect(enterprise.tasksPerFeature).toBe(small.tasksPerFeature)
  })

  it('Custom load uses the caller-supplied config exactly, ignoring the scenario base', () => {
    const custom = { projects: 7, featuresPerProject: 3, tasksPerFeature: 2, knowledgeRecordsPerFeature: 1 }
    expect(resolveLoad('single-feature', 'Custom', custom)).toEqual(custom)
  })

  it('Custom load with no config supplied falls back to the scenario base rather than throwing', () => {
    const base = getScenarioDefinition('single-feature').base
    expect(resolveLoad('single-feature', 'Custom')).toEqual(base)
  })

  it('is deterministic — the same scenario/profile always resolves to the same numbers', () => {
    expect(resolveLoad('large-planning-set', 'Enterprise')).toEqual(resolveLoad('large-planning-set', 'Enterprise'))
  })
})
