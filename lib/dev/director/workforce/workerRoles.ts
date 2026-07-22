import type { WorkerRole } from './workforceTypes'

/**
 * The Worker Role registry — configuration, not code. Adding a new role
 * (Milestone 3.1's scalability requirement: "adding a new worker role
 * should require configuration rather than architectural changes") means
 * adding one entry here; nothing in taskAssignment.ts, workerReview.ts,
 * conflictResolution.ts, or serverExecutionLoop.ts needs to change or
 * even know a new role exists, since they all operate generically over
 * `WorkerRole` and this registry.
 *
 * Deliberately separate from lib/dev/agents/agentTypes.ts's `AgentRole` /
 * lib/dev/agents/agentSupport.ts's `DOMAIN_PATTERNS`, even though 6 of
 * these 7 roles name-overlap with existing AgentRole values (Architect,
 * Backend, Frontend, Database, QA, Documentation). That system is a pure
 * pre-execution *review* layer over an AI-generated ExecutiveEngineeringReport
 * (see agentWorkforce.ts's own doc comment: "deterministic specialist
 * reviewers, not separate Claude Code executions") — a fundamentally
 * different job from what this milestone asks for (a role that actually
 * shapes and executes one real batch, then is reviewed). Reusing that
 * system's types here would misrepresent what a WorkerRole does; the one
 * genuinely reusable piece of that system — conflict resolution — is
 * reused directly in conflictResolution.ts instead of duplicated.
 */
export type WorkerRoleConfig = {
  role: WorkerRole
  /** Lower-cased keywords matched against a batch's objective/title text — the basis for automatic role assignment in taskAssignment.ts. */
  domainKeywords: string[]
  /** Injected into the batch prompt (serverContextBuilder.ts) so Claude is framed with this role's responsibilities and boundaries for this one task — never a different model or provider, only different instructions. */
  responsibilities: string
  /** What this role must NOT do — reinforces "Workers never make strategic decisions" and keeps each role's blast radius predictable. */
  boundaries: string
}

export const WORKER_ROLE_REGISTRY: WorkerRoleConfig[] = [
  {
    role: 'Architecture Engineer',
    domainKeywords: ['architecture', 'refactor', 'restructure', 'module boundary', 'design pattern', 'coupling'],
    responsibilities: 'Focus on system structure, module boundaries, and long-term maintainability. Prefer the smallest change that keeps the architecture coherent.',
    boundaries: 'Do not decide product priorities or which milestone/batch runs next — that remains the Director\'s call.',
  },
  {
    role: 'Backend Engineer',
    domainKeywords: ['api', 'route', 'server', 'endpoint', 'service', 'backend', 'business logic'],
    responsibilities: 'Focus on server-side logic, API routes, and data flow between services.',
    boundaries: 'Do not modify UI components or client-only code as part of this task unless the objective explicitly requires it.',
  },
  {
    role: 'Frontend Engineer',
    domainKeywords: ['ui', 'component', 'page', 'frontend', 'client', 'react', 'styling', 'layout'],
    responsibilities: 'Focus on UI components, client-side state, and user-facing behavior.',
    boundaries: 'Do not modify server routes or persistence logic as part of this task unless the objective explicitly requires it.',
  },
  {
    role: 'Database Engineer',
    domainKeywords: ['database', 'schema', 'migration', 'sql', 'query', 'table', 'index'],
    responsibilities: 'Focus on data schema, migrations, and query correctness/performance.',
    boundaries: 'Do not change unrelated application logic beyond what the schema/query change requires.',
  },
  {
    role: 'QA Engineer',
    domainKeywords: ['test', 'qa', 'validation', 'regression', 'bug', 'fix', 'build failure', 'typescript error'],
    responsibilities: 'Focus on correctness: fixing failures, adding coverage, and verifying existing behavior is preserved.',
    boundaries: 'Do not introduce new product features as part of this task.',
  },
  {
    role: 'DevOps Engineer',
    domainKeywords: ['deploy', 'deployment', 'ci', 'cd', 'pipeline', 'infrastructure', 'build config', 'environment variable'],
    responsibilities: 'Focus on build/deploy configuration, CI pipelines, and environment/infrastructure setup.',
    boundaries: 'Do not modify application business logic as part of this task.',
  },
  {
    role: 'Documentation Engineer',
    domainKeywords: ['docs', 'documentation', 'readme', 'comment', 'guide', 'changelog'],
    responsibilities: 'Focus on documentation accuracy and clarity — reflect what the code actually does, never what is planned or aspirational.',
    boundaries: 'Do not change application behavior as part of this task.',
  },
]

/** Every role reachable from the registry, in registry order — used wherever code needs "all roles" without hardcoding the list a second time. */
export const ALL_WORKER_ROLES: WorkerRole[] = WORKER_ROLE_REGISTRY.map(c => c.role)

export function getWorkerRoleConfig(role: WorkerRole): WorkerRoleConfig {
  const config = WORKER_ROLE_REGISTRY.find(c => c.role === role)
  if (!config) throw new Error(`No WorkerRoleConfig registered for role "${role}"`)
  return config
}

/** Roles whose domainKeywords match anywhere in `text` (case-insensitive), in registry order. */
export function matchWorkerRoles(text: string): WorkerRole[] {
  const lower = text.toLowerCase()
  return WORKER_ROLE_REGISTRY.filter(c => c.domainKeywords.some(k => lower.includes(k))).map(c => c.role)
}
