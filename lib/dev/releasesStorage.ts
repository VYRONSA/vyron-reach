import { readLocal, writeLocal } from './localStore'

export type Release = {
  id: string
  version: string
  project: string // project slug, or '' for none
  relatedMilestone: string // milestone id, or '' for none
  date: string
  notes: string
  createdAt: string
  updatedAt: string
}

const KEY = 'vyron-dev-releases-v1'

export function getReleases(): Release[] {
  return readLocal<Release[]>(KEY, [])
}

function saveReleases(items: Release[]) {
  writeLocal(KEY, items)
}

export function createRelease(input: {
  version: string
  project: string
  relatedMilestone: string
  date: string
  notes: string
}): Release {
  const now = new Date().toISOString()
  const record: Release = {
    id: `release_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    version: input.version.trim(),
    createdAt: now,
    updatedAt: now,
  }
  const items = getReleases()
  items.unshift(record)
  saveReleases(items)
  return record
}

export function deleteRelease(id: string) {
  saveReleases(getReleases().filter(r => r.id !== id))
}

export function releasesForMilestone(milestoneId: string): Release[] {
  return getReleases().filter(r => r.relatedMilestone === milestoneId)
}

export function recentReleases(limit = 5): Release[] {
  return [...getReleases()].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit)
}
