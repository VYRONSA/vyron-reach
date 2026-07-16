export type ProjectStatus = 'active' | 'paused' | 'planning'

export type Project = {
  slug: string
  name: string
  tagline: string
  description: string
  status: ProjectStatus
  phase: string
  milestone: string
  progress: number
  lastUpdated: string
  notes: string
  recentActivity: { label: string; time: string }[]
}

export const PROJECTS: Project[] = [
  {
    slug: 'reach',
    name: 'VYRON REACH',
    tagline: 'Internal marketing operating system',
    description:
      'A single-org marketing command centre for VYRONSOFT — campaigns, creatives, leads, SEO, and reporting driven by one canonical navigation and data provider.',
    status: 'active',
    phase: 'Phase A — Consolidation',
    milestone: 'Dead-code removal complete, Phase B (multi-tenant purge) pending review',
    progress: 40,
    lastUpdated: 'Today',
    notes:
      'Architecture audit complete. 2,421 files removed in Phase A. VYRON DEV portal (this tool) built on top of the surviving canonical core.',
    recentActivity: [
      { label: 'VYRON DEV Phase 2 — real development workspace', time: 'Today' },
      { label: 'VYRON DEV Phase 1 — developer portal foundation', time: 'Today' },
      { label: 'Phase A dead-code removal (2,421 files)', time: 'Today' },
      { label: 'Architecture audit — Phase 1 inventory', time: 'Today' },
    ],
  },
  {
    slug: 'core',
    name: 'VYRON CORE',
    tagline: 'Shared platform services',
    description: 'Shared authentication, data, and infrastructure services for the VYRON product suite.',
    status: 'planning',
    phase: 'Not started',
    milestone: 'No milestones defined yet',
    progress: 0,
    lastUpdated: '—',
    notes: 'No work has started on this project.',
    recentActivity: [],
  },
  {
    slug: 'cost',
    name: 'VYRON COST',
    tagline: 'Cost tracking & reporting',
    description: 'Internal cost tracking and reporting across VYRONSOFT projects and infrastructure.',
    status: 'planning',
    phase: 'Not started',
    milestone: 'No milestones defined yet',
    progress: 0,
    lastUpdated: '—',
    notes: 'No work has started on this project.',
    recentActivity: [],
  },
  {
    slug: 'pay',
    name: 'VYRON PAY',
    tagline: 'Payments & billing',
    description: 'Payments and billing infrastructure for VYRON products.',
    status: 'planning',
    phase: 'Not started',
    milestone: 'No milestones defined yet',
    progress: 0,
    lastUpdated: '—',
    notes: 'No work has started on this project.',
    recentActivity: [],
  },
  {
    slug: 'farm',
    name: 'VYRON FARM',
    tagline: 'Resource & asset management',
    description: 'Resource and asset management tooling.',
    status: 'planning',
    phase: 'Not started',
    milestone: 'No milestones defined yet',
    progress: 0,
    lastUpdated: '—',
    notes: 'No work has started on this project.',
    recentActivity: [],
  },
  {
    slug: 'child-compass',
    name: 'CHILD COMPASS',
    tagline: 'Independent product',
    description: 'Independent product tracked separately from the core VYRON platform suite.',
    status: 'paused',
    phase: 'On hold',
    milestone: 'On hold — no active milestone',
    progress: 15,
    lastUpdated: '—',
    notes: 'On hold. No active development.',
    recentActivity: [],
  },
  {
    slug: 'surf4cars',
    name: 'SURF4CARS',
    tagline: 'Independent product',
    description: 'Independent product tracked separately from the core VYRON platform suite.',
    status: 'paused',
    phase: 'On hold',
    milestone: 'On hold — no active milestone',
    progress: 10,
    lastUpdated: '—',
    notes: 'On hold. No active development.',
    recentActivity: [],
  },
]

export function getProjectBySlug(slug: string): Project | undefined {
  return PROJECTS.find(p => p.slug === slug)
}

export function getProjectName(slug: string, fallback = 'Unassigned'): string {
  return getProjectBySlug(slug)?.name ?? fallback
}

export const STATUS_TONE: Record<ProjectStatus, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  paused: 'warning',
  planning: 'neutral',
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  planning: 'Planning',
}
