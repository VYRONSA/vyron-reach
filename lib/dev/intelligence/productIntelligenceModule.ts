import type { Project } from '../projectsData'
import type { Milestone } from '../milestonesStorage'
import type { Batch } from '../batchesStorage'
import type { EngineeringFinding } from './types'

const STALE_MILESTONE_DAYS = 30

function daysSince(iso: string): number | null {
  const ms = new Date(iso).getTime()
  if (Number.isNaN(ms)) return null
  return Math.floor((Date.now() - ms) / (24 * 60 * 60 * 1000))
}

/**
 * Client-side (localStorage-backed) half of Product Intelligence. "Compare
 * implementation against Product Vision" is deliberately narrow: it checks
 * whether a vision statement (tagline/description) exists at all, not
 * whether the code matches it — semantic comparison isn't something a
 * deterministic engine can honestly claim. Everything else is a plain
 * structural read of milestones/batches this project already tracks.
 */
export function scanProductIntelligence(project: Project | undefined, milestones: Milestone[], batches: Batch[]): EngineeringFinding[] {
  const findings: EngineeringFinding[] = []
  if (!project) return findings

  if (!project.tagline && !project.description) {
    findings.push({
      module: 'Product',
      category: 'Product Vision',
      severity: 'Low',
      title: `${project.name} has no product vision recorded`,
      evidence: `Project tagline and description are both empty for "${project.name}".`,
      location: `/dev/admin/projects/${project.slug}`,
      recommendation: `Record a tagline/description for ${project.name} so the runtime can ground its prompts in it.`,
    })
  }

  for (const milestone of milestones) {
    if (milestone.archived || milestone.status === 'Complete') continue
    const age = daysSince(milestone.updatedAt)
    if (age !== null && age >= STALE_MILESTONE_DAYS) {
      findings.push({
        module: 'Product',
        category: 'Unfinished Milestone',
        severity: milestone.status === 'At Risk' ? 'Medium' : 'Low',
        title: `Milestone "${milestone.title}" untouched for ${age} days`,
        evidence: `Status: ${milestone.status}, last updated ${milestone.updatedAt} (${age} days ago).`,
        location: `/dev/milestones?focus=${milestone.id}`,
        recommendation: `Review "${milestone.title}" — either continue it or update its status.`,
      })
    }
  }

  for (const batch of batches) {
    if (batch.archived || batch.status === 'Complete') continue
    findings.push({
      module: 'Product',
      category: 'Incomplete Batch',
      severity: 'Low',
      title: `Batch ${batch.batchNumber} is ${batch.status}`,
      evidence: `Batch ${batch.batchNumber} status: ${batch.status}, created ${batch.createdAt}.`,
      location: `/dev/batches?focus=${batch.id}`,
      recommendation: `Continue or close out Batch ${batch.batchNumber}.`,
    })

    if (batch.objective && !batch.milestone) {
      findings.push({
        module: 'Product',
        category: 'Orphaned Objective',
        severity: 'Low',
        title: `Batch ${batch.batchNumber} has an objective but no linked milestone`,
        evidence: `Batch ${batch.batchNumber}: objective set, milestone: ''.`,
        location: `/dev/batches?focus=${batch.id}`,
        recommendation: `Link Batch ${batch.batchNumber} to a milestone so its progress rolls up correctly.`,
      })
    }
  }

  return findings
}
