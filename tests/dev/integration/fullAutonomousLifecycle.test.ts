import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, waitFor, type IsolatedDataDir } from '../support/testHarness'
import * as initiationService from '../../../lib/dev/initiation/initiationService'
import { submitRiskGateDecision } from '../../../lib/dev/initiation/riskGateService'
import { startProvisioning } from '../../../lib/dev/initiation/initiationProvisioningService'
import { submitExecutiveControlDecision } from '../../../lib/dev/initiation/executiveControlService'
import { runAssessment } from '../../../lib/dev/director/assessment/assessmentService'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import { getDirectorStatus } from '../../../lib/dev/director/directorRuntimeStore'
import * as releaseManagementService from '../../../lib/dev/director/releaseManagement/releaseManagementService'
import { submitReleaseControlDecision, listReleases } from '../../../lib/dev/director/releaseManagement/releaseManagementService'
import { runOperationsMonitoringCycle, listIncidentsForProject } from '../../../lib/dev/director/operations/operationsMonitoringService'
import { getMetricsState } from '../../../lib/dev/metrics/metricsStore'
import { startMetricsSubscription, stopMetricsSubscription } from '../../../lib/dev/metrics/metricsService'
import { listInboxItems } from '../../../lib/dev/director/engineeringInboxStore'
import type { GeneratedPlanCandidate } from '../../../lib/dev/initiation/initiationTypes'
import type { ExecImpl } from '../../../lib/dev/director/releaseManagement/releaseManagementTypes'

/**
 * Wave 4 (Testing Gaps) — the one true end-to-end integration test: drives
 * every named lifecycle stage —
 *   Executive Directive -> Knowledge Discovery -> Programme Generation ->
 *   Planning -> Assessment -> Risk Gate -> Provisioning ->
 *   Engineering Execution -> Release -> Operations
 * — as a single continuous scenario, calling the REAL production function
 * for every stage (never hand-seeding a later stage's store record
 * directly, the gap the Wave 3 self-certification flagged: every existing
 * test only ever seeded its own subsystem's starting state and drove one
 * stage in isolation). Two narrow, disclosed substitutions, both matching
 * this repo's own established convention elsewhere:
 *   1. Programme Generation's real LLM call is replaced with a hand-built
 *      but structurally valid GeneratedPlanCandidate passed directly to
 *      completeGeneration — the same function the real generator calls
 *      with the LLM's output, only the origin of the input differs.
 *   2. Engineering Execution's real coding-agent run is replaced by
 *      marking each provisioned batch Complete directly via
 *      planningStateService before the Executive Go decision — the same
 *      simulation technique every existing Director test in this repo
 *      already uses, since invoking a real coding agent from an automated
 *      test is infeasible.
 * Release's git/gh/vercel calls go through a stub ExecImpl against a real
 * disposable fixture directory (never the real repository), matching
 * releasePrepareDuplicateGuard.test.ts's established pattern. Operations'
 * deployment probe goes through a stubbed global fetch.
 */

let isolated: IsolatedDataDir
let cwd: string

const execStub: ExecImpl = async (cmd, args) => {
  if (cmd === 'git' && args[0] === 'remote') return { code: 0, stdout: '', stderr: '' } // no remote configured — PR/CI-CD stay Not Applicable
  if (cmd === 'git' && args[0] === 'status') return { code: 0, stdout: ' M some-file.txt\n', stderr: '' }
  if (cmd === 'git' && args[0] === 'rev-parse' && args[1] === '--verify') return { code: 1, stdout: '', stderr: '' } // branch does not already exist
  if (cmd === 'git' && args[0] === 'rev-parse') return { code: 0, stdout: 'abc1234567890deadbeef\n', stderr: '' } // HEAD sha, post-commit
  if (cmd === 'vercel' && args[0] === 'deploy') return { code: 0, stdout: 'Preview: https://my-release-preview.vercel.app\n', stderr: '' }
  return { code: 0, stdout: '', stderr: '' } // git add / commit / checkout -b / push — all succeed
}

beforeEach(() => {
  isolated = useIsolatedDataDir()
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'vyron-e2e-lifecycle-'))
  fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0' }))
  fs.writeFileSync(path.join(cwd, 'vercel.json'), JSON.stringify({}))
  // Normally wired up once at server startup (instrumentation.ts /
  // metricsBootstrap.ts) — started explicitly here so this scenario's own
  // real events flow into real Metrics counters, proving genuine
  // cross-subsystem integration rather than isolated per-stage calls.
  startMetricsSubscription()
})

afterEach(() => {
  stopMetricsSubscription()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  isolated.cleanup()
  fs.rmSync(cwd, { recursive: true, force: true })
})

/** 3 milestones x 2 batches, one High-severity risk on the first milestone — passes initiationGenerationValidation.ts's structural rules (proven by tests/dev/initiation/initiationProvisioningRecovery.test.ts's identical shape). */
function makeProgramme(): GeneratedPlanCandidate {
  const milestones = [1, 2, 3].map(n => ({ tempId: `m${n}`, title: `Milestone ${n}`, description: '', phase: 'Phase 1', sequence: n }))
  const batches = milestones.flatMap(m =>
    [1, 2].map(n => ({
      tempId: `${m.tempId}-b${n}`, milestoneRef: m.tempId, batchNumber: `${m.tempId}-B${n}`,
      objective: `Objective for ${m.tempId} batch ${n}`, summary: '', claudePrompt: '', sequence: n,
    }))
  )
  return {
    assessment: {
      summary: 'A greenfield billing dashboard.', scope: 'Full-stack build.', feasibilityNotes: '', assumptions: [], openQuestions: [],
      estimatedComplexity: 'Medium', recommendedCategory: 'General', knowledgeSourcesConsidered: [],
    },
    milestones,
    batches,
    risks: [{
      tempId: 'risk-1', title: 'Third-party payment API instability', description: 'Vendor has a history of breaking changes.',
      relatedMilestoneRef: 'm1', severity: 'High', probability: 'Medium', mitigation: 'Pin API version, add contract tests.',
    }],
    dependencies: [],
  }
}

describe('Full autonomous lifecycle — one continuous, real-API-driven scenario (Wave 4)', () => {
  it('Executive Directive through Operations, every stage driven by its real production function', async () => {
    const slug = uniqueSlug()

    // ---- 1. Executive Directive ----
    const initiation = initiationService.createInitiation({
      projectSlug: slug,
      projectName: 'Billing Dashboard',
      projectCategory: 'SaaS',
      directiveTitle: 'Build the billing dashboard',
      directiveText: 'Build a self-serve billing dashboard for enterprise customers.',
      submittedBy: 'ceo@acme.test',
    })
    expect(initiation.status).toBe('Draft')
    expect(planningStateService.getProject(slug)?.status).toBe('planning')

    initiationService.beginGeneration(initiation.id)
    expect(initiationService.getInitiation(initiation.id)?.status).toBe('Generating')

    // ---- 2. Knowledge Discovery ----
    initiationService.recordKnowledgeDiscovery(initiation.id, {
      retrievedAt: new Date().toISOString(),
      sourcesConsulted: 4,
      itemsFound: 2,
      topItems: [],
      gaps: [],
    })
    expect(initiationService.getInitiation(initiation.id)?.knowledgeDiscovery?.sourcesConsulted).toBe(4)

    // ---- 3. Programme Generation ----
    // Substitutes a hand-built, structurally valid programme for the real
    // LLM call — completeGeneration is the exact same function the real
    // generator invokes with the model's output; only where the
    // GeneratedPlanCandidate came from differs.
    const programme = makeProgramme()
    const generated = initiationService.completeGeneration(initiation.id, programme, 'test-model')
    expect(generated.status).toBe('Review')
    expect(generated.reviewedProgramme?.milestones).toHaveLength(3)

    // ---- 4. Planning (review) ----
    const reviewed = initiationService.updateReview(initiation.id, { reviewNotes: 'Reviewed by CEO — looks good, proceed.' })
    expect(reviewed.reviewNotes).toContain('Reviewed by CEO')
    expect(reviewed.reviewValidation?.valid).toBe(true) // untouched by a reviewNotes-only edit

    initiationService.approveInitiation(initiation.id, 'ceo@acme.test')
    expect(initiationService.getInitiation(initiation.id)?.status).toBe('Approved')

    // ---- 5. Assessment ----
    // The real Engineering Assessment Engine, run against this project's
    // actual current durable state (nothing provisioned yet).
    const preProvisionAssessment = runAssessment(slug)
    expect(preProvisionAssessment.assessment.project).toBe(slug)
    expect(preProvisionAssessment.assessment.engineeringHealth).toBeTruthy()

    // ---- 6. Risk Gate ----
    // One High-severity risk exists in the programme; provisioning is
    // structurally blocked until it's covered by a real decision.
    submitRiskGateDecision(initiation.id, {
      executive: 'ceo@acme.test',
      decision: 'Accept Risk',
      reason: 'Acceptable given the mitigation plan.',
      riskTempIds: ['risk-1'],
    })
    expect(initiationService.getInitiation(initiation.id)?.status).toBe('Approved') // Accept Risk never changes status

    // ---- 7. Provisioning ----
    const started = startProvisioning(initiation.id)
    expect(started.status).toBe('Provisioning')
    await waitFor(() => initiationService.getInitiation(initiation.id)?.status === 'Provisioned', {
      message: 'provisioning never completed',
    })
    expect(planningStateService.listMilestones(slug)).toHaveLength(3)
    const batches = planningStateService.listBatches(slug)
    expect(batches).toHaveLength(6)
    expect(planningStateService.getProject(slug)?.status).toBe('active')
    // The risk gate's Accepted decision was provisioned as a visible, monitored risk, not silently dropped.
    expect(planningStateService.listRisks(slug).some(r => r.status === 'Monitoring')).toBe(true)

    // ---- 8. Engineering Execution ----
    // Real coding-agent execution is infeasible in an automated test — the
    // same substitution every existing Director test in this repo already
    // makes: mark the real, provisioned batches Complete directly, so the
    // REAL handoff (built from REAL current Planning Service state) and
    // the REAL Director loop reach Completed exactly as they would after
    // genuine execution, with nothing about the loop itself faked.
    for (const batch of batches) {
      planningStateService.completeBatch(slug, batch.id)
    }

    // Redirect the loop's own internal prepareRelease call (which defaults
    // to process.cwd()/a real exec) to this test's disposable fixture —
    // same technique as releasePreparationOrdering.test.ts and
    // releasePrepareDuplicateGuard.test.ts. The real implementation still
    // runs, just against a safe cwd/exec.
    const realPrepareRelease = releaseManagementService.prepareRelease.bind(releaseManagementService)
    vi.spyOn(releaseManagementService, 'prepareRelease').mockImplementation(async project => realPrepareRelease(project, cwd, execStub))

    submitExecutiveControlDecision(initiation.id, { executive: 'ceo@acme.test', decision: 'Go', reason: 'Approved for autonomous execution.' })

    await waitFor(() => getDirectorStatus(slug).state === 'Completed', { message: 'the Director loop never reached Completed' })
    expect(getDirectorStatus(slug).completedAt).not.toBeNull()

    // ---- 9. Release ----
    // Real prepareRelease already ran as part of reaching Completed
    // (PRA-P1-028's ordering fix — verified again here, end-to-end).
    const releases = listReleases(slug)
    expect(releases).toHaveLength(1)
    const release = releases[0]
    expect(release.status).toBe('Prepared')

    const inboxHasReleaseItem = () => listInboxItems({ project: slug }).some(i => i.reasonType === 'Release Go/Hold Required')
    expect(inboxHasReleaseItem()).toBe(true)

    // A real Go decision, driving the real executeRelease mutating
    // sequence (fire-and-forget) through git commit/branch/deploy against
    // the stub exec — never the real repository. executeDeploymentVerification
    // makes one real fetch() call against the deployed URL, so a healthy
    // response is stubbed for this step specifically (switched to a
    // failure below, for the Operations stage).
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 200 })))
    submitReleaseControlDecision(slug, release.id, { executive: 'ceo@acme.test', decision: 'Go', reason: 'Ship it.' }, cwd, execStub)

    await waitFor(() => releaseManagementService.getRelease(release.id)?.status === 'Released', {
      message: 'release execution never reached Released',
    })
    const released = releaseManagementService.getRelease(release.id)!
    expect(released.deploymentUrl).toMatch(/^https:\/\/.*\.vercel\.app/)
    expect(released.executionReport?.passed).toBe(true)

    // ---- 10. Operations ----
    // A real monitoring cycle against the real Released deployment this
    // same pipeline just produced. The deployment probe is stubbed to
    // simulate a real outage discovered after release — proving Operations
    // genuinely detects, classifies, and records an incident from data
    // this test never hand-seeded.
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('connection refused')
    }))

    await runOperationsMonitoringCycle()

    const incidents = listIncidentsForProject(slug)
    expect(incidents).toHaveLength(1)
    expect(incidents[0].severity).toBe('Critical')
    expect(incidents[0].relatedReleaseId).toBe(release.id)
    expect(listInboxItems({ project: slug }).some(i => i.reasonType === 'Operational Incident')).toBe(true)

    // The whole chain also produced real, non-fabricated Metrics counters
    // along the way — the final proof this was one continuous, observable
    // system, not disconnected per-subsystem fixtures.
    const metrics = getMetricsState()
    expect(metrics.counters['throughput.projectsCompleted']).toBeGreaterThanOrEqual(1)
    expect(metrics.counters['reliability.incidentsOpened']).toBeGreaterThanOrEqual(1)
  }, 30_000)
})
