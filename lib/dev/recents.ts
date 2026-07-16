import { readLocal, writeLocal } from './localStore'

export type RecentEntry = {
  path: string
  label: string
  visitedAt: string
}

const PAGES_KEY = 'vyron-dev-recent-pages-v1'
const PROJECTS_KEY = 'vyron-dev-recent-projects-v1'
const MAX_ENTRIES = 8

function pushRecent(key: string, entry: RecentEntry) {
  const existing = readLocal<RecentEntry[]>(key, [])
  const deduped = existing.filter(e => e.path !== entry.path)
  deduped.unshift(entry)
  writeLocal(key, deduped.slice(0, MAX_ENTRIES))
}

export function recordRecentPage(path: string, label: string): void {
  if (path === '/dev/login') return
  pushRecent(PAGES_KEY, { path, label, visitedAt: new Date().toISOString() })
}

export function getRecentPages(): RecentEntry[] {
  return readLocal<RecentEntry[]>(PAGES_KEY, [])
}

export function recordRecentProject(slug: string, label: string): void {
  pushRecent(PROJECTS_KEY, { path: `/dev/projects/${slug}`, label, visitedAt: new Date().toISOString() })
}

export function getRecentProjects(): RecentEntry[] {
  return readLocal<RecentEntry[]>(PROJECTS_KEY, [])
}

export function getLastProjectSlug(): string | null {
  const [first] = getRecentProjects()
  if (!first) return null
  const match = first.path.match(/\/dev\/projects\/(.+)$/)
  return match ? match[1] : null
}

export type RecentItemType = 'project' | 'prompt' | 'knowledge' | 'journal' | 'decision' | 'milestone' | 'batch'

export type RecentItem = {
  type: RecentItemType
  id: string
  label: string
  href: string
  visitedAt: string
}

const ITEMS_KEY = 'vyron-dev-recent-items-v1'
const MAX_ITEMS = 20

/** Generic recently-used tracker, spanning record types beyond pages/projects. */
export function recordRecentItem(item: Omit<RecentItem, 'visitedAt'>): void {
  const existing = readLocal<RecentItem[]>(ITEMS_KEY, [])
  const deduped = existing.filter(e => !(e.type === item.type && e.id === item.id))
  deduped.unshift({ ...item, visitedAt: new Date().toISOString() })
  writeLocal(ITEMS_KEY, deduped.slice(0, MAX_ITEMS))
}

export function getRecentItems(type?: RecentItemType): RecentItem[] {
  const items = readLocal<RecentItem[]>(ITEMS_KEY, [])
  return type ? items.filter(i => i.type === type) : items
}

/** "3m ago" / "2h ago" / "5d ago" style relative timestamp, for recent-activity widgets. */
export function formatTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}
