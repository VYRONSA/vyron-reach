import { readLocal, writeLocal } from './localStore'

export type ProjectStatus = 'active' | 'paused' | 'planning' | 'complete'

export type Project = {
  slug: string
  name: string
  tagline: string
  description: string
  category: string
  status: ProjectStatus
  phase: string
  milestone: string
  progress: number
  color: string
  icon: string
  archived: boolean
  lastUpdated: string
  notes: string
  recentActivity: { label: string; time: string }[]
}

/**
 * The original hard-coded product list — now used only as the one-time
 * seed for localStorage on first run, and as the static param list for
 * build-time pre-rendering (which has no access to localStorage). Every
 * runtime read goes through getProjects()/getProjectBySlug() instead.
 */
const SEED_PROJECTS: Project[] = [
  {
    slug: 'reach',
    name: 'VYRON REACH',
    tagline: 'Internal marketing operating system',
    description:
      'A single-org marketing command centre for VYRONSOFT — campaigns, creatives, leads, SEO, and reporting driven by one canonical navigation and data provider.',
    category: 'Marketing',
    status: 'active',
    phase: 'Phase A — Consolidation',
    milestone: 'Dead-code removal complete, Phase B (multi-tenant purge) pending review',
    progress: 40,
    color: '',
    icon: '',
    archived: false,
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
    category: 'Platform',
    status: 'planning',
    phase: 'Not started',
    milestone: 'No milestones defined yet',
    progress: 0,
    color: '',
    icon: '',
    archived: false,
    lastUpdated: '—',
    notes: 'No work has started on this project.',
    recentActivity: [],
  },
  {
    slug: 'cost',
    name: 'VYRON COST',
    tagline: 'Cost tracking & reporting',
    description: 'Internal cost tracking and reporting across VYRONSOFT projects and infrastructure.',
    category: 'Finance',
    status: 'planning',
    phase: 'Not started',
    milestone: 'No milestones defined yet',
    progress: 0,
    color: '',
    icon: '',
    archived: false,
    lastUpdated: '—',
    notes: 'No work has started on this project.',
    recentActivity: [],
  },
  {
    slug: 'pay',
    name: 'VYRON PAY',
    tagline: 'Payments & billing',
    description: 'Payments and billing infrastructure for VYRON products.',
    category: 'Finance',
    status: 'planning',
    phase: 'Not started',
    milestone: 'No milestones defined yet',
    progress: 0,
    color: '',
    icon: '',
    archived: false,
    lastUpdated: '—',
    notes: 'No work has started on this project.',
    recentActivity: [],
  },
  {
    slug: 'farm',
    name: 'VYRON FARM',
    tagline: 'Resource & asset management',
    description: 'Resource and asset management tooling.',
    category: 'Operations',
    status: 'planning',
    phase: 'Not started',
    milestone: 'No milestones defined yet',
    progress: 0,
    color: '',
    icon: '',
    archived: false,
    lastUpdated: '—',
    notes: 'No work has started on this project.',
    recentActivity: [],
  },
  {
    slug: 'child-compass',
    name: 'CHILD COMPASS',
    tagline: 'Independent product',
    description: 'Independent product tracked separately from the core VYRON platform suite.',
    category: 'Independent',
    status: 'paused',
    phase: 'On hold',
    milestone: 'On hold — no active milestone',
    progress: 15,
    color: '',
    icon: '',
    archived: false,
    lastUpdated: '—',
    notes: 'On hold. No active development.',
    recentActivity: [],
  },
  {
    slug: 'surf4cars',
    name: 'SURF4CARS',
    tagline: 'Independent product',
    description: 'Independent product tracked separately from the core VYRON platform suite.',
    category: 'Independent',
    status: 'paused',
    phase: 'On hold',
    milestone: 'On hold — no active milestone',
    progress: 10,
    color: '',
    icon: '',
    archived: false,
    lastUpdated: '—',
    notes: 'On hold. No active development.',
    recentActivity: [],
  },
]

/** Build-time-safe slug list for generateStaticParams — no localStorage access needed. */
export const SEED_PROJECT_SLUGS: string[] = SEED_PROJECTS.map(p => p.slug)

const KEY = 'vyron-dev-projects-v1'

type StoredProject = Omit<Project, 'category' | 'color' | 'icon' | 'archived'> &
  Partial<Pick<Project, 'category' | 'color' | 'icon' | 'archived'>>

function normalize(p: StoredProject): Project {
  return {
    ...p,
    category: p.category ?? '',
    color: p.color ?? '',
    icon: p.icon ?? '',
    archived: p.archived ?? false,
  }
}

/**
 * Reads the project list from localStorage, seeding it from SEED_PROJECTS
 * on first run. Every consumer should call this (or getProjectBySlug/
 * getProjectName) instead of importing a static list, so admin edits are
 * always reflected. Server-side callers get SEED_PROJECTS back (readLocal's
 * fallback) since localStorage doesn't exist server-side — client
 * components correct this after mount, same as every other localStorage-
 * backed store in VYRON DEV.
 */
export function getProjects(): Project[] {
  const stored = readLocal<StoredProject[] | null>(KEY, null)
  if (stored === null) {
    writeLocal(KEY, SEED_PROJECTS)
    return SEED_PROJECTS
  }
  return stored.map(normalize)
}

function saveProjects(items: Project[]) {
  writeLocal(KEY, items)
}

export function getProjectBySlug(slug: string): Project | undefined {
  return getProjects().find(p => p.slug === slug)
}

export function getProjectName(slug: string, fallback = 'Unassigned'): string {
  return getProjectBySlug(slug)?.name ?? fallback
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function isSlugTaken(slug: string): boolean {
  return getProjects().some(p => p.slug === slug)
}

export function suggestSlug(name: string): string {
  const base = slugify(name) || 'project'
  let candidate = base
  let n = 2
  while (isSlugTaken(candidate)) {
    candidate = `${base}-${n}`
    n += 1
  }
  return candidate
}

export type ProjectInput = {
  name: string
  slug: string
  description: string
  category: string
  status: ProjectStatus
  phase: string
  progress: number
  color: string
  icon: string
}

export function createProject(input: ProjectInput): Project {
  const now = new Date().toISOString()
  const record: Project = {
    slug: input.slug.trim(),
    name: input.name.trim(),
    tagline: '',
    description: input.description,
    category: input.category,
    status: input.status,
    phase: input.phase,
    milestone: 'No milestones defined yet',
    progress: input.progress,
    color: input.color,
    icon: input.icon,
    archived: false,
    lastUpdated: now,
    notes: '',
    recentActivity: [],
  }
  const items = getProjects()
  items.unshift(record)
  saveProjects(items)
  return record
}

export function updateProject(slug: string, patch: Partial<Omit<Project, 'slug'>>) {
  const items = getProjects().map(p => (p.slug === slug ? { ...p, ...patch, lastUpdated: new Date().toISOString() } : p))
  saveProjects(items)
}

export function archiveProject(slug: string) {
  updateProject(slug, { archived: true })
}

export function restoreProject(slug: string) {
  updateProject(slug, { archived: false })
}

export function setProjectStatus(slug: string, status: ProjectStatus) {
  updateProject(slug, { status })
}

export const STATUS_TONE: Record<ProjectStatus, 'success' | 'warning' | 'neutral' | 'info'> = {
  active: 'success',
  paused: 'warning',
  planning: 'neutral',
  complete: 'info',
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  planning: 'Planning',
  complete: 'Complete',
}
