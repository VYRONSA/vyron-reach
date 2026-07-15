export const DASHBOARD_KEY = 'dashboard'

export type NavIcon =
  | 'dashboard'
  | 'director'
  | 'campaigns'
  | 'creatives'
  | 'clients'
  | 'settings'
  | string

export type NavItem = {
  key: string
  label: string
  title?: string
  description?: string
  icon: NavIcon
  section?: string
}

export type NavGroup = {
  label: string
  title?: string
  items: NavItem[]
}

/** Simplified AI-first navigation — 6 items only */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'VYRON REACH',
    title: 'VYRON REACH',
    items: [
      {
        key: DASHBOARD_KEY,
        label: 'Dashboard',
        title: 'Dashboard',
        icon: 'dashboard',
        description: 'Simple snapshot of campaigns and creatives.',
      },
      {
        key: 'ai-marketing-director',
        label: 'Create Campaign',
        title: 'Create Campaign',
        icon: 'director',
        description: '30-second ChatGPT handoff flow.',
      },
      {
        key: 'creatives',
        label: 'Creative Studio',
        title: 'Creative Studio',
        icon: 'creatives',
        description: 'Image-first gallery — approve, revise, launch.',
      },
      {
        key: 'campaigns',
        label: 'Campaigns',
        title: 'Campaigns',
        icon: 'campaigns',
        description: 'Simple campaign gallery.',
      },
      {
        key: 'clients',
        label: 'Clients',
        title: 'Clients',
        icon: 'clients',
        description: 'Client profiles and context for AI.',
      },
      {
        key: 'reports',
        label: 'Reports',
        title: 'Reports',
        icon: 'campaigns',
        description: 'Visual performance and recommendations.',
      },
      {
        key: 'settings',
        label: 'Settings',
        title: 'Settings',
        icon: 'settings',
        description: 'Business profile and demo environment.',
      },
    ],
  },
]

/** Hidden from sidebar — still routable for deep links */
export const HIDDEN_PAGE_KEYS = [
  'seo-war-room',
  'google-ads-ai',
  'content-engine',
  'ai-creative-studio',
  'competitors',
  'rankings',
  'ai-action-queue',
] as const

export function buildNavGroups(): NavGroup[] {
  return NAV_GROUPS
}

export const ENTERPRISE_NAV = NAV_GROUPS
export const NAV_SECTIONS = NAV_GROUPS
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap(group =>
  group.items.map(item => ({ ...item, section: group.label })),
)

/** All routable pages including hidden */
export const ALL_PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  'ai-marketing-director': 'Create Campaign',
  campaigns: 'Campaigns',
  creatives: 'Creative Studio',
  clients: 'Clients',
  reports: 'Reports',
  settings: 'Settings',
  'seo-war-room': 'SEO War Room',
  'google-ads-ai': 'Google Ads AI',
  'content-engine': 'Content Engine',
  'ai-creative-studio': 'AI Creative Studio',
  competitors: 'Competitors',
  rankings: 'Rankings',
  'ai-action-queue': 'AI Action Queue',
}

export function getPageTitle(key: string) {
  return ALL_PAGE_TITLES[key] ?? NAV_ITEMS.find(i => i.key === key)?.title ?? 'Dashboard'
}

export function getPageDescription(key: string) {
  return NAV_ITEMS.find(i => i.key === key)?.description || ''
}

export function getDefaultPageKey() {
  return DASHBOARD_KEY
}

export function getNavItem(key: string) {
  return NAV_ITEMS.find(i => i.key === key)
}
