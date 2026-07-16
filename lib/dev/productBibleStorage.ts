import { readLocal, writeLocal } from './localStore'

export type ProductBible = {
  vision: string
  goals: string
  targetMarket: string
  coreFeatures: string
  futureRoadmap: string
  notes: string
  updatedAt: string
}

export const PRODUCT_BIBLE_FIELDS: { key: keyof Omit<ProductBible, 'updatedAt'>; label: string; placeholder: string }[] = [
  { key: 'vision', label: 'Product Vision', placeholder: 'What is this product, at its core?' },
  { key: 'goals', label: 'Goals', placeholder: 'What are we trying to achieve?' },
  { key: 'targetMarket', label: 'Target Market', placeholder: 'Who is this for?' },
  { key: 'coreFeatures', label: 'Core Features', placeholder: '- Feature one\n- Feature two' },
  { key: 'futureRoadmap', label: 'Future Roadmap', placeholder: 'What comes next?' },
  { key: 'notes', label: 'Notes', placeholder: 'Anything else worth recording' },
]

function emptyBible(): ProductBible {
  return { vision: '', goals: '', targetMarket: '', coreFeatures: '', futureRoadmap: '', notes: '', updatedAt: '' }
}

function keyFor(slug: string) {
  return `vyron-dev-product-bible-${slug}-v1`
}

export function getProductBible(slug: string): ProductBible {
  return readLocal<ProductBible>(keyFor(slug), emptyBible())
}

export function saveProductBible(slug: string, bible: Omit<ProductBible, 'updatedAt'>): ProductBible {
  const record: ProductBible = { ...bible, updatedAt: new Date().toISOString() }
  writeLocal(keyFor(slug), record)
  return record
}
