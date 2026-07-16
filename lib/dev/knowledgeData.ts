import { readLocal, writeLocal } from './localStore'

export type KnowledgeSection = {
  slug: string
  title: string
  description: string
}

export const KNOWLEDGE_SECTIONS: KnowledgeSection[] = [
  { slug: 'architecture', title: 'Architecture', description: 'System diagrams, canonical structure, consolidation reports.' },
  { slug: 'product-bibles', title: 'Product Bibles', description: 'Vision, scope, and product definition documents per project.' },
  { slug: 'coding-standards', title: 'Coding Standards', description: 'Conventions, review checklists, and style guides.' },
  { slug: 'sql', title: 'SQL', description: 'Schema references, migrations, and query notes.' },
  { slug: 'prompts', title: 'Prompts', description: 'Reusable prompts and agent instructions.' },
  { slug: 'meeting-notes', title: 'Meeting Notes', description: 'Decisions and notes from planning sessions.' },
]

export function getKnowledgeSection(slug: string): KnowledgeSection | undefined {
  return KNOWLEDGE_SECTIONS.find(s => s.slug === slug)
}

type KnowledgeNote = {
  content: string
  updatedAt: string
}

function keyFor(slug: string) {
  return `vyron-dev-knowledge-${slug}-v1`
}

export function getKnowledgeNote(slug: string): KnowledgeNote {
  return readLocal<KnowledgeNote>(keyFor(slug), { content: '', updatedAt: '' })
}

export function saveKnowledgeNote(slug: string, content: string): KnowledgeNote {
  const note: KnowledgeNote = { content, updatedAt: new Date().toISOString() }
  writeLocal(keyFor(slug), note)
  return note
}
