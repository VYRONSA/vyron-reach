import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import type { DNAProfileFields, InitializerStepResult } from './initializerTypes'

/**
 * Server-side, file-backed store for each product's Engineering DNA
 * identity profile — deliberately separate from
 * lib/dev/learning/learningStorage.ts's evidence-based DNA (category/
 * title/description entries evolved from successful executions). That
 * store answers "what has this product's engineering actually proven
 * true"; this one answers "what is this product," seeded once from
 * facts the Project record already knows (name, category) and left
 * blank everywhere else. Server-only — a browser has no fs to write to,
 * so this file must only ever be imported by server code (the
 * Initializer API route), never by a 'use client' component.
 *
 * Wave 4 (Unlocked Stores) remediation — previously read-check-write
 * against raw fs with no lock spanning the three steps: two concurrent
 * initializeDNA calls for the same productSlug could both pass the
 * "doesn't exist yet" check and both write, the second silently
 * clobbering the first. Now the whole check-and-set runs inside
 * fileJsonStore.ts's updateJsonStore, under one real file lock — on-disk
 * format (a Record<productSlug, DNAProfileFields> object) is unchanged.
 */
const STORE_FILE = 'product-dna-profiles.json'

export function readProductDNAProfile(productSlug: string): DNAProfileFields | null {
  return readJsonStore<Record<string, DNAProfileFields>>(STORE_FILE, {})[productSlug] ?? null
}

/**
 * Creates a product's first DNA profile — Version 1, and only ever
 * Version 1 from this function. Product Name and Category come straight
 * off the Project record (already-known facts); every other field
 * starts empty rather than guessed, since nothing about technology
 * stack, architecture style, integrations, or business domain is known
 * until real executions establish it. A profile that already exists is
 * left untouched — DNA is never overwritten, only evolved by real
 * evidence (lib/dev/learning/engineeringDNA.ts).
 */
export function initializeDNA(productSlug: string, productName: string, category: string): InitializerStepResult {
  let result: InitializerStepResult
  updateJsonStore<Record<string, DNAProfileFields>>(STORE_FILE, {}, current => {
    const existing = current[productSlug]
    if (existing) {
      result = { step: 'Engineering DNA', created: [], skipped: [`DNA Version ${existing.dnaVersion} already exists`] }
      return current
    }

    const profile: DNAProfileFields = {
      productSlug,
      productName,
      category,
      technologyStack: '',
      architectureStyle: '',
      knownIntegrations: '',
      businessDomain: '',
      currentVersion: '',
      dnaVersion: 1,
      createdAt: new Date().toISOString(),
    }
    result = { step: 'Engineering DNA', created: ['DNA Version 1'], skipped: [] }
    return { ...current, [productSlug]: profile }
  })
  return result!
}
