import fs from 'node:fs'
import path from 'node:path'
import type { DNAProfileFields, InitializerStepResult } from './initializerTypes'

/**
 * Server-side, file-backed store for each product's Engineering DNA
 * identity profile — deliberately separate from
 * lib/dev/learning/learningStorage.ts's evidence-based DNA (category/
 * title/description entries evolved from successful executions). That
 * store answers "what has this product's engineering actually proven
 * true"; this one answers "what is this product," seeded once from
 * facts the Project record already knows (name, category) and left
 * blank everywhere else. Same server-only fs pattern as
 * runtimeStorage.ts and learningStorage.ts — a browser has no fs to
 * write to, so this file must only ever be imported by server code
 * (the Initializer API route), never by a 'use client' component.
 */
const STORE_DIR = path.join(process.cwd(), '.vyron-dev')
const STORE_FILE = path.join(STORE_DIR, 'product-dna-profiles.json')

function ensureFile(): void {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true })
  if (!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, '{}', 'utf-8')
}

function readAll(): Record<string, DNAProfileFields> {
  ensureFile()
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8')) as Record<string, DNAProfileFields>
  } catch {
    return {}
  }
}

function writeAll(profiles: Record<string, DNAProfileFields>): void {
  ensureFile()
  fs.writeFileSync(STORE_FILE, JSON.stringify(profiles, null, 2), 'utf-8')
}

export function readProductDNAProfile(productSlug: string): DNAProfileFields | null {
  return readAll()[productSlug] ?? null
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
  const profiles = readAll()
  if (profiles[productSlug]) {
    return { step: 'Engineering DNA', created: [], skipped: [`DNA Version ${profiles[productSlug].dnaVersion} already exists`] }
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
  profiles[productSlug] = profile
  writeAll(profiles)

  return { step: 'Engineering DNA', created: ['DNA Version 1'], skipped: [] }
}
