import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'

/**
 * A minimal, server-owned, global home for "Development Rules" (coding
 * standards) — added as part of Version 2.0 Milestone 2.2's Live
 * Knowledge Refresh, whose spec explicitly names Development Rules as a
 * required refresh source. Before this, the only existing home was
 * lib/dev/knowledgeData.ts's `getKnowledgeNote('coding-standards')` —
 * purely localStorage, with no server presence at all — which made it
 * impossible for a headless Director run (no browser, no localStorage) to
 * ever read or refresh it. This does not replace or migrate that client
 * store (still used by the Knowledge Base wiki UI); it is a new,
 * intentionally small parallel source built on the same atomic
 * fileJsonStore primitives every other durable store uses. Global, not
 * per-project — mirrors the original note's own scope (one shared set of
 * coding standards across the whole VYRON DEV instance).
 */

const FILE = 'development-rules.json'

export type DevelopmentRules = {
  content: string
  updatedAt: string
}

const EMPTY_RULES: DevelopmentRules = { content: '', updatedAt: '' }

export function getDevelopmentRules(): DevelopmentRules {
  return readJsonStore<DevelopmentRules>(FILE, EMPTY_RULES)
}

export function setDevelopmentRules(content: string): DevelopmentRules {
  const rules: DevelopmentRules = { content, updatedAt: new Date().toISOString() }
  updateJsonStore<DevelopmentRules>(FILE, EMPTY_RULES, () => rules)
  return rules
}
