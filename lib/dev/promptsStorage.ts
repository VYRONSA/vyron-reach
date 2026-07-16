import { readLocal, writeLocal } from './localStore'

export const PROMPT_CATEGORIES = [
  'Development',
  'SQL',
  'Marketing',
  'Architecture',
  'Supabase',
  'Next.js',
  'OpenAI',
  'Claude',
] as const

export type PromptCategory = (typeof PROMPT_CATEGORIES)[number]

export type Prompt = {
  id: string
  title: string
  category: PromptCategory
  content: string
  favourite: boolean
  createdAt: string
  updatedAt: string
}

const KEY = 'vyron-dev-prompts-v1'

export function getPrompts(): Prompt[] {
  return readLocal<Prompt[]>(KEY, [])
}

function savePrompts(prompts: Prompt[]) {
  writeLocal(KEY, prompts)
}

export function createPrompt(input: { title: string; category: PromptCategory; content: string }): Prompt {
  const now = new Date().toISOString()
  const prompt: Prompt = {
    id: `prompt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: input.title.trim(),
    category: input.category,
    content: input.content,
    favourite: false,
    createdAt: now,
    updatedAt: now,
  }
  const prompts = getPrompts()
  prompts.unshift(prompt)
  savePrompts(prompts)
  return prompt
}

export function updatePrompt(id: string, patch: Partial<Omit<Prompt, 'id' | 'createdAt'>>) {
  const prompts = getPrompts().map(p => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p))
  savePrompts(prompts)
}

export function deletePrompt(id: string) {
  savePrompts(getPrompts().filter(p => p.id !== id))
}

export function toggleFavourite(id: string) {
  const prompts = getPrompts().map(p => (p.id === id ? { ...p, favourite: !p.favourite } : p))
  savePrompts(prompts)
}

export function searchPrompts(query: string, category?: PromptCategory | 'All', favouritesOnly?: boolean): Prompt[] {
  const q = query.trim().toLowerCase()
  let prompts = getPrompts()
  if (category && category !== 'All') prompts = prompts.filter(p => p.category === category)
  if (favouritesOnly) prompts = prompts.filter(p => p.favourite)
  if (!q) return prompts
  return prompts.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q))
}
