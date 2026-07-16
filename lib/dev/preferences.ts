import { readLocal, writeLocal } from './localStore'

export type DevTheme = 'dark' | 'light'

export type DashboardWidgetId =
  | 'focus'
  | 'currentProject'
  | 'currentMilestone'
  | 'currentBatch'
  | 'objectives'
  | 'health'
  | 'blockers'
  | 'activity'
  | 'decisions'
  | 'journal'
  | 'prompts'
  | 'releases'

export const DASHBOARD_WIDGET_LABELS: Record<DashboardWidgetId, string> = {
  focus: 'Current Development Focus',
  currentProject: 'Current Project',
  currentMilestone: 'Current Milestone',
  currentBatch: 'Current Batch',
  objectives: "Today's Objectives",
  health: 'Development Health',
  blockers: 'Active Blockers',
  activity: 'Recent Activity',
  decisions: 'Recent Decisions',
  journal: 'Recent Journal Entries',
  prompts: 'Recent Prompt Updates',
  releases: 'Recent Releases',
}

export const DEFAULT_DASHBOARD_WIDGET_ORDER: DashboardWidgetId[] = [
  'focus',
  'currentProject',
  'currentMilestone',
  'currentBatch',
  'objectives',
  'health',
  'blockers',
  'activity',
  'decisions',
  'journal',
  'prompts',
  'releases',
]

export type DevPreferences = {
  theme: DevTheme
  sidebarCollapsed: boolean
  defaultProject: string // project slug, or '' for none
  displayName: string
  autoOpenLastProject: boolean
  dashboardWidgetOrder: DashboardWidgetId[]
  dashboardHiddenWidgets: DashboardWidgetId[]
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
  dashboardWidgetOrder: DEFAULT_DASHBOARD_WIDGET_ORDER,
  dashboardHiddenWidgets: [],
  pinnedProjects: [],
  pinnedMilestones: [],
  pinnedBatches: [],
  favouriteKnowledgeSections: [],
  focusMode: false,
}

const KEY = 'vyron-dev-preferences-v1'

export function getPreferences(): DevPreferences {
  const stored = readLocal<Partial<DevPreferences>>(KEY, {})
  const merged = { ...DEFAULT_PREFERENCES, ...stored }
  // Guard against a stored order missing widgets introduced after it was saved.
  const missing = DEFAULT_DASHBOARD_WIDGET_ORDER.filter(id => !merged.dashboardWidgetOrder.includes(id))
  if (missing.length > 0) merged.dashboardWidgetOrder = [...merged.dashboardWidgetOrder, ...missing]
  return merged
}

export function savePreferences(prefs: DevPreferences): void {
  writeLocal(KEY, prefs)
}
