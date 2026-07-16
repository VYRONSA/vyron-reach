import { readLocal, writeLocal } from './localStore'

export type DevTheme = 'dark' | 'light'

export type DevPreferences = {
  theme: DevTheme
  sidebarCollapsed: boolean
  defaultProject: string // project slug, or '' for none
  displayName: string
  autoOpenLastProject: boolean
  pinnedProjects: string[] // project slugs
  pinnedMilestones: string[] // milestone ids
  pinnedBatches: string[] // batch ids
  favouriteKnowledgeSections: string[] // knowledge section slugs
  focusMode: boolean
}

export const DEFAULT_PREFERENCES: DevPreferences = {
  theme: 'dark',
  sidebarCollapsed: false,
  defaultProject: 'reach',
  displayName: '',
  autoOpenLastProject: false,
  pinnedProjects: [],
  pinnedMilestones: [],
  pinnedBatches: [],
  favouriteKnowledgeSections: [],
  focusMode: false,
}

const KEY = 'vyron-dev-preferences-v1'

export function getPreferences(): DevPreferences {
  const stored = readLocal<Partial<DevPreferences>>(KEY, {})
  return { ...DEFAULT_PREFERENCES, ...stored }
}

export function savePreferences(prefs: DevPreferences): void {
  writeLocal(KEY, prefs)
}
