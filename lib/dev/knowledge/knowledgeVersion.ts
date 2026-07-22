import { readDNAProfile } from '../learning/learningStorage'
import { countKnowledgeRecords } from './knowledgeStore'

/**
 * THE authoritative knowledge-version algorithm (Version 2.0, Milestone
 * 2.1) — the single replacement for two implementations that used to
 * disagree:
 *   1. lib/dev/runtime/executionIdentity.ts's old computeKnowledgeVersion,
 *      a content fingerprint of a browser-supplied RelevantKnowledge blob.
 *   2. lib/dev/director/serverExecutionLoop.ts's old inline
 *      `debt:${n}|risk:${n}|dec:${n}@${now}` — count-based but salted with
 *      the current timestamp, so it changed on every single run even when
 *      nothing about the underlying knowledge did, which is exactly what
 *      broke "knowledge version remains stable across restart."
 *
 * This version takes only a project slug and reads server-owned state
 * directly — no caller anywhere needs to assemble or pass in a knowledge
 * blob anymore, since the Knowledge Service (not the browser) is now the
 * source of truth. It is a pure function of durable, on-disk state:
 * calling it twice with nothing written in between always returns the
 * exact same string, restart or not. It changes if and only if a new
 * fact was actually recorded (a DNA entry, or any Knowledge Service
 * domain record) — never from the current time, a random id, or anything
 * else that varies without a real underlying change.
 *
 * Deliberately excludes lib/dev/learning/learningTypes.ts's
 * EngineeringMemoryEntry from the fingerprint: those entries carry no
 * `project` field in the current schema (a pre-existing gap in the
 * Learning module, not something this milestone touches), so there is no
 * correct way to scope them to one project's version — including them
 * would make every project's version move in lockstep with unrelated
 * projects' memory writes, which is worse than omitting them.
 */
export function computeKnowledgeVersion(project: string): string {
  const dna = computeDNAVersion(project)
  const domainCounts = [
    ['handover', countKnowledgeRecords('handovers', project)],
    ['arch', countKnowledgeRecords('architectureDecisions', project)],
    ['biz', countKnowledgeRecords('businessDecisions', project)],
    ['debt', countKnowledgeRecords('technicalDebt', project)],
    ['risk', countKnowledgeRecords('risks', project)],
    ['journal', countKnowledgeRecords('journal', project)],
    ['milestone', countKnowledgeRecords('milestoneCompletions', project)],
    ['batch', countKnowledgeRecords('batchCompletions', project)],
  ]
    .map(([key, count]) => `${key}:${count}`)
    .join('|')

  return `dna:${dna}|${domainCounts}`
}

/**
 * The DNA-only fingerprint, factored out of computeKnowledgeVersion (which
 * still embeds it) so Version 2.0 Milestone 2.2's Live Knowledge Refresh
 * can track "did the DNA profile specifically change" as its own signal,
 * distinct from the coarser combined Knowledge Version — the same
 * computation lives in exactly one place either way.
 */
export function computeDNAVersion(project: string): string {
  const dna = readDNAProfile(project)
    .current.map(entry => `${entry.id}@${entry.version}`)
    .sort()
    .join(',')
  return dna || 'none'
}
