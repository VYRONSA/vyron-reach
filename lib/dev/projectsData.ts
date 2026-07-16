import { readLocal, writeLocal } from './localStore'

export type ProjectStatus = 'active' | 'paused' | 'planning' | 'complete'

export type Project = {
  slug: string
  name: string
  tagline: string
  description: string
  category: string
  status: ProjectStatus
  /**
   * Starting progress for a brand-new project with no milestones yet —
   * once milestones exist, Project Intelligence derives progress from
   * them instead (getMilestoneProgress) and this becomes a fallback
   * only. Current Phase and Current Milestone are NOT stored here:
   * they're derived entirely from the project's milestones (see
   * getProjectIntelligence), which is now the single source of truth
   * for both — a manually re-typed "phase" string can't drift out of
   * sync with reality the way a derived one can't.
   */
  progress: number
  color: string
  icon: string
  archived: boolean
  lastUpdated: string
  notes: string
  recentActivity: { label: string; time: string }[]
  /** '' for the original seed products (their real creation predates this field) — the Development Event Engine only emits a "Project Created" event when this is genuinely known, rather than guessing. */
  createdAt: string
}

/**
 * The original hard-coded product list — now used only as the one-time
 * seed for localStorage on first run, and as the static param list for
 * build-time pre-rendering (which has no access to localStorage). Every
 * runtime read goes through getProjects()/getProjectBySlug() instead.
 */
const SEED_PROJECTS: Project[] = [
  {
    slug: 'vyron-dev',
    name: 'VYRON DEV',
    tagline: 'AI-native development operating system',
    description:
      'The internal Development Operating System for VYRONSOFT — Project/Development/Git/Deployment/Build Intelligence Engines, the Executive Command Centre, and Owner Administration. Phase 3 tracks its own development through the same engines it built for every other product.',
    category: 'Platform',
    status: 'active',
    progress: 0,
    color: '',
    icon: '',
    archived: false,
    createdAt: '',
    lastUpdated: 'Today',
    notes: 'Self Development — VYRON DEV now understands its own state through the Self Development Engine (lib/dev/selfDevelopmentEngine.ts).',
    recentActivity: [],
  },
  {
    slug: 'reach',
    name: 'VYRON REACH',
    tagline: 'Internal marketing operating system',
    description:
      'A single-org marketing command centre for VYRONSOFT — campaigns, creatives, leads, SEO, and reporting driven by one canonical navigation and data provider.',
    category: 'Marketing',
    status: 'active',
    progress: 40,
    color: '',
    icon: '',
    archived: false,
    createdAt: '',
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
    progress: 0,
    color: '',
    icon: '',
    archived: false,
    createdAt: '',
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
    progress: 0,
    color: '',
    icon: '',
    archived: false,
    createdAt: '',
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
    progress: 0,
    color: '',
    icon: '',
    archived: false,
    createdAt: '',
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
    progress: 0,
    color: '',
    icon: '',
    archived: false,
    createdAt: '',
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
    progress: 15,
    color: '',
    icon: '',
    archived: false,
    createdAt: '',
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
    progress: 10,
    color: '',
    icon: '',
    archived: false,
    createdAt: '',
    lastUpdated: '—',
    notes: 'On hold. No active development.',
    recentActivity: [],
  },
]

/** Build-time-safe slug list for generateStaticParams — no localStorage access needed. */
export const SEED_PROJECT_SLUGS: string[] = SEED_PROJECTS.map(p => p.slug)

const KEY = 'vyron-dev-projects-v1'

type StoredProject = Omit<Project, 'category' | 'color' | 'icon' | 'archived' | 'createdAt'> &
  Partial<Pick<Project, 'category' | 'color' | 'icon' | 'archived' | 'createdAt'>>

function normalize(p: StoredProject): Project {
  return {
    ...p,
    category: p.category ?? '',
    color: p.color ?? '',
    icon: p.icon ?? '',
    archived: p.archived ?? false,
    createdAt: p.createdAt ?? '',
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
    progress: input.progress,
    color: input.color,
    icon: input.icon,
    archived: false,
    createdAt: now,
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
