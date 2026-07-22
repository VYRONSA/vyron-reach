import type { InterventionReasonType, InterventionSeverity } from '../director/directorRuntimeTypes'
import type { ProjectStatus } from '../projectsData'
import type { EscalationRule, EscalationLevelDefinition } from './escalationTypes'

/**
 * Pure rule-matching + escalation-decision functions — no file I/O, no
 * wall-clock reads (every "now" is an explicit input), mirroring
 * lib/dev/scheduler/schedulingPolicy.ts's identical philosophy: the same
 * inputs always produce the same decision, restart or not.
 */

export type InboxItemMatchInput = {
  reasonType: InterventionReasonType
  severity: InterventionSeverity
  project: string
  /** The owning project's Project.status, reused as the "priority" match dimension — see escalationTypes.ts's EscalationRule.priority. */
  projectStatus: ProjectStatus
}

function matches(rule: EscalationRule, item: InboxItemMatchInput): boolean {
  if (!rule.enabled) return false
  if (rule.reasonType !== null && rule.reasonType !== item.reasonType) return false
  if (rule.severity !== null && rule.severity !== item.severity) return false
  if (rule.project !== null && rule.project !== item.project) return false
  if (rule.priority !== null && rule.priority !== item.projectStatus) return false
  return true
}

function specificity(rule: EscalationRule): number {
  return [rule.reasonType, rule.severity, rule.project, rule.priority].filter(v => v !== null).length
}

/** The most specific enabled rule matching this item, or null if none match (an item with no matching rule is simply never escalated — configuration-driven means no config, no escalation). Ties broken by rule id so selection never depends on store iteration order. */
export function selectRule(item: InboxItemMatchInput, rules: EscalationRule[]): EscalationRule | null {
  const candidates = rules.filter(r => matches(r, item))
  if (candidates.length === 0) return null
  return [...candidates].sort((a, b) => specificity(b) - specificity(a) || a.id.localeCompare(b.id))[0]
}

function sortedLevels(rule: EscalationRule): EscalationLevelDefinition[] {
  return [...rule.levels].sort((a, b) => a.level - b.level)
}

function topLevel(rule: EscalationRule): EscalationLevelDefinition | null {
  const levels = sortedLevels(rule)
  return levels.length > 0 ? levels[levels.length - 1] : null
}

/** The highest configured level whose `afterMs` threshold the item's open duration has crossed, or 0 if none has been reached yet. `maxOpenDurationMs` is a separate safety ceiling — beyond it, the item is treated as having reached the top configured level even if intermediate thresholds were skipped. */
function computeTargetLevel(rule: EscalationRule, openDurationMs: number): EscalationLevelDefinition | null {
  if (openDurationMs >= rule.maxOpenDurationMs) return topLevel(rule)
  const levels = sortedLevels(rule)
  let reached: EscalationLevelDefinition | null = null
  for (const level of levels) {
    if (openDurationMs >= level.afterMs) reached = level
  }
  return reached
}

export type EscalationDecisionInput = {
  rule: EscalationRule
  openDurationMs: number
  currentLevel: number
  reminderCount: number
}

export type EscalationDecision =
  | { shouldSendReminder: true; level: EscalationLevelDefinition }
  | { shouldSendReminder: false; level: null }

/**
 * Deterministic: a reminder is due exactly when the item has crossed into
 * a level strictly higher than the one already reminded for, AND the
 * rule's maxNotificationCount hasn't already been hit — the hard cap that
 * guarantees escalation can never spam indefinitely regardless of how
 * many levels are configured.
 */
export function computeEscalationDecision(input: EscalationDecisionInput): EscalationDecision {
  if (input.reminderCount >= input.rule.maxNotificationCount) return { shouldSendReminder: false, level: null }
  const target = computeTargetLevel(input.rule, input.openDurationMs)
  if (!target || target.level <= input.currentLevel) return { shouldSendReminder: false, level: null }
  return { shouldSendReminder: true, level: target }
}

/** For the dashboard's "Next scheduled reminder" — the earliest wall-clock time at which the next not-yet-reached level's `afterMs` threshold (or, if sooner, `maxOpenDurationMs`) will be crossed. Null once the rule's max notification count or top level has already been reached — there is no "next" reminder in that case. */
export function estimateNextReminderAt(rule: EscalationRule, currentLevel: number, reminderCount: number, openedAt: string): string | null {
  if (reminderCount >= rule.maxNotificationCount) return null
  const top = topLevel(rule)
  if (!top || currentLevel >= top.level) return null
  const nextLevel = sortedLevels(rule).find(l => l.level > currentLevel)
  if (!nextLevel) return null
  const nextThresholdMs = Math.min(nextLevel.afterMs, rule.maxOpenDurationMs)
  return new Date(new Date(openedAt).getTime() + nextThresholdMs).toISOString()
}
