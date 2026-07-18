import fs from 'node:fs'
import path from 'node:path'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import pkg from '@/package.json'
import { isRuntimeAccessible, runtimeUnavailableResponse } from '@/lib/dev/runtime/runtimeAccess'
import { scanRepositoryFiles } from '@/lib/dev/intelligence/repositoryScanner'
import type { RepositoryFacts } from '@/lib/dev/assessment/assessmentModels'
import { readAssessmentHistory, appendAssessmentSnapshot, latestAssessmentSnapshot } from '@/lib/dev/assessment/assessmentRepository'
import { compareAssessmentSnapshots } from '@/lib/dev/assessment/assessmentEngine'
import type { AssessmentSnapshot } from '@/lib/dev/assessment/assessmentTypes'
import { readProductDNAProfile } from '@/lib/dev/initializer/dnaInitializer'
import { readExecutionRecords } from '@/lib/dev/learning/learningStorage'
import { summarizeExecutions } from '@/lib/dev/learning/executionAnalytics'

/**
 * The Engineering Assessment Engine's only server-side step — repository
 * facts (package manager, frameworks, README/config presence — needs
 * fs), the product's DNA profile, and Learning history (all file-backed,
 * lib/dev/initializer + lib/dev/learning already own this storage, this
 * route only reads it). Findings/Git/Build/Deployment Intelligence and
 * milestone/batch/project state are NOT recomputed here — the caller
 * already has them (Executive Command Centre's existing props, or a
 * fetch to /api/dev/intelligence/report), so this route never duplicates
 * that scan. GET never writes anything; POST persists a snapshot the
 * client has already fully assembled, same pattern as
 * /api/dev/learning/record and /api/dev/operations/snapshot.
 *
 * scanRepositoryFacts lives here rather than in assessmentModels.ts on
 * purpose: assessmentModels.ts's pure build*Assessment functions are
 * imported by assessmentEngine.ts, which a 'use client' panel also
 * imports — a node:fs import anywhere in that chain breaks the client
 * bundle. An API route is always server-only, so fs is safe here.
 */
function detectPackageManager(): string {
  const root = process.cwd()
  if (fs.existsSync(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm'
  if (fs.existsSync(path.join(root, 'yarn.lock'))) return 'yarn'
  if (fs.existsSync(path.join(root, 'bun.lockb'))) return 'bun'
  if (fs.existsSync(path.join(root, 'package-lock.json'))) return 'npm'
  return 'Unknown'
}

function detectFrameworks(deps: Record<string, string>): string[] {
  const frameworks: string[] = []
  if (deps.next) frameworks.push(`Next.js ${deps.next}`)
  if (deps.react) frameworks.push(`React ${deps.react}`)
  if (deps.tailwindcss) frameworks.push(`Tailwind CSS ${deps.tailwindcss}`)
  if (deps['@supabase/supabase-js']) frameworks.push('Supabase JS client')
  return frameworks
}

function scanRepositoryFacts(): RepositoryFacts {
  const root = process.cwd()
  const files = scanRepositoryFiles()
  const totalLines = files.reduce((sum, f) => sum + f.lineCount, 0)
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) } as Record<string, string>

  return {
    readmeExists: fs.existsSync(path.join(root, 'README.md')),
    agentsFileExists: fs.existsSync(path.join(root, 'AGENTS.md')) || fs.existsSync(path.join(root, 'CLAUDE.md')),
    authFileExists: fs.existsSync(path.join(root, 'lib', 'dev', 'auth.ts')),
    nextConfigExists: fs.existsSync(path.join(root, 'next.config.ts')) || fs.existsSync(path.join(root, 'next.config.js')),
    envLocalExists: fs.existsSync(path.join(root, '.env.local')),
    packageManager: detectPackageManager(),
    frameworks: detectFrameworks(deps),
    languages: files.some(f => f.relativePath.endsWith('.tsx')) ? ['TypeScript', 'TSX'] : ['TypeScript'],
    filesScanned: files.length,
    totalLines,
    moduleCount: files.filter(f => f.relativePath.startsWith('lib/dev/') && f.relativePath.endsWith('.ts')).length,
    componentCount: files.filter(f => f.relativePath.startsWith('components/') && f.relativePath.endsWith('.tsx')).length,
    apiCount: files.filter(f => f.relativePath.startsWith('app/api/') && f.relativePath.endsWith('route.ts')).length,
    cachingUsageCount: files.filter(f => /unstable_cache|revalidateTag|revalidatePath|export const revalidate/.test(f.content)).length,
    supabaseConfigured: Boolean(deps['@supabase/supabase-js']) && fs.existsSync(path.join(root, 'supabase')),
    openaiDependency: Boolean(deps.openai),
    hasLintScript: Boolean((pkg.scripts as Record<string, string> | undefined)?.lint),
    testFileCount: files.filter(f => /\.(test|spec)\.tsx?$/.test(f.relativePath)).length,
  }
}

export async function GET(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const projectSlug = request.nextUrl.searchParams.get('project')
  if (!projectSlug) return NextResponse.json({ error: 'project is required' }, { status: 400 })

  const facts = scanRepositoryFacts()
  const dnaProfile = readProductDNAProfile(projectSlug)
  const learningSummary = summarizeExecutions(readExecutionRecords(projectSlug))
  const history = readAssessmentHistory(projectSlug)

  return NextResponse.json({ facts, dnaProfile, learningSummary, history })
}

export async function POST(request: NextRequest) {
  if (!isRuntimeAccessible(request)) {
    const { status, error } = runtimeUnavailableResponse(request)
    return NextResponse.json({ error }, { status })
  }

  const snapshot = (await request.json().catch(() => null)) as AssessmentSnapshot | null
  if (!snapshot || !snapshot.id || !snapshot.projectSlug) {
    return NextResponse.json({ error: 'A valid AssessmentSnapshot is required' }, { status: 400 })
  }

  const previous = latestAssessmentSnapshot(snapshot.projectSlug)
  appendAssessmentSnapshot(snapshot)
  const trend = compareAssessmentSnapshots(snapshot, previous?.id === snapshot.id ? null : previous)

  return NextResponse.json({ snapshot, trend }, { status: 201 })
}
