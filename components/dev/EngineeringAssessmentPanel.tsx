'use client'

import { useState } from 'react'
import type { GitIntelligence } from '@/lib/dev/gitIntelligence'
import type { BuildIntelligence } from '@/lib/dev/buildIntelligence'
import { computeFullAssessment } from '@/lib/dev/assessment/computeAssessment'
import { buildDirectorAssessmentInput } from '@/lib/dev/assessment/assessmentEngine'
import type { AssessmentReport } from '@/lib/dev/assessment/assessmentTypes'
import { DevBadge, DevCard, DevCardHeader, DevSectionLabel } from './ui'

function scoreTone(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 75) return 'success'
  if (score >= 50) return 'warning'
  return 'danger'
}

/**
 * The Engineering Assessment Centre panel — runs the read-only
 * Assessment Engine (lib/dev/assessment/) on demand and renders its
 * report. Reuses every existing engine rather than recomputing: server
 * findings from the same /api/dev/intelligence/report route Mission
 * Control already calls, client findings from the same
 * computeClientEngineeringFindings, Engineering Health from the same
 * buildExecutiveEngineeringReport score. The only new server calls are
 * /api/dev/assessment (repository facts, DNA, Learning summary, history
 * — all file-backed data no other route already exposes). Manual
 * trigger, not auto-run on mount: a run touches fs (repo scan) and two
 * network round trips, and this panel can be embedded on pages that
 * render often.
 */
export function EngineeringAssessmentPanel({ projectSlug, git, build }: { projectSlug: string; git?: GitIntelligence; build?: BuildIntelligence }) {
  const [report, setReport] = useState<AssessmentReport | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // PRA-P1-006: distinct from `error` above — a persist failure is
  // non-blocking (the report itself is still fully computed and shown),
  // while `error` still means "the assessment computation itself failed,
  // nothing to show."
  const [persistWarning, setPersistWarning] = useState<string | null>(null)

  const runAssessment = async () => {
    setRunning(true)
    setError(null)
    setPersistWarning(null)
    try {
      const { assessment, persistError } = await computeFullAssessment(projectSlug, git, build, true)
      setReport(assessment)
      setPersistWarning(persistError)
      // Director Integration: shaped and available for whatever calls the Director next — this panel doesn't act on it.
      buildDirectorAssessmentInput(assessment)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run the Engineering Assessment.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <DevCard>
      <DevCardHeader
        title="Engineering Assessment"
        badge={
          report ? (
            <DevBadge tone={scoreTone(report.scores.overallConfidence.score)}>{report.scores.overallConfidence.score}/100 Confidence</DevBadge>
          ) : undefined
        }
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={runAssessment}
          disabled={running}
          className="rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? 'Assessing…' : report ? 'Re-run Assessment' : 'Run Assessment'}
        </button>
        {report ? (
          <span className="text-xs text-[var(--dev-text-faint)]">Generated {new Date(report.generatedAt).toLocaleString()}</span>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-xs text-rose-500 dark:text-rose-400">{error}</p> : null}
      {persistWarning ? (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Report generated below, but saving it to history failed: {persistWarning}
        </p>
      ) : null}

      {report ? (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <ScoreTile label="Engineering Health" metric={report.scores.engineeringHealth} />
            <ScoreTile label="Maintainability" metric={report.scores.maintainability} />
            <ScoreTile label="Architecture" metric={report.scores.architecture} />
            <ScoreTile label="Documentation" metric={report.scores.documentation} />
            <ScoreTile label="Security" metric={report.scores.security} />
            <ScoreTile label="Overall Confidence" metric={report.scores.overallConfidence} />
          </div>

          <div className="rounded-xl border border-[var(--dev-border)] p-3">
            <DevSectionLabel>Risk Summary</DevSectionLabel>
            <p className="mt-1 text-sm text-[var(--dev-text)]">{report.riskSummary}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CategorySummary
              title="Repository"
              rows={[
                ['Connected', report.repository.connected ? 'Yes' : 'No'],
                ['Branch', report.repository.branch],
                ['Last Commit', report.repository.lastCommit],
                ['Size', report.repository.repositorySize.value],
                ['Languages', report.repository.languages.join(', ') || 'Unknown'],
                ['Frameworks', report.repository.frameworks.join(', ') || 'Unknown'],
                ['Package Manager', report.repository.packageManager],
              ]}
            />
            <CategorySummary
              title="Build"
              rows={[
                ['Last Build', report.build.lastBuild],
                ['Build Status', report.build.buildStatus],
                ['TypeScript', report.build.typescriptStatus],
                ['Lint', report.build.lintStatus],
                ['Tests', report.build.testStatus],
                ['Coverage', report.build.coverage],
              ]}
            />
            <CategorySummary
              title="Architecture"
              rows={[
                ['Framework', report.architecture.framework],
                ['Style', report.architecture.architectureStyle],
                ['Modules', String(report.architecture.moduleCount)],
                ['Components', String(report.architecture.componentCount)],
                ['API Routes', String(report.architecture.apiCount)],
                ['Database Layer', report.architecture.databaseLayer],
                ['Authentication', report.architecture.authentication],
                ['Caching', report.architecture.caching.value],
                ['Configuration', report.architecture.configuration],
              ]}
            />
            <CategorySummary
              title="Code Health"
              rows={[
                ['Technical Debt', String(report.codeHealth.technicalDebt)],
                ['Complexity', report.codeHealth.complexity],
                ['Duplicated Code', String(report.codeHealth.duplicatedCode)],
                ['Unused Code', String(report.codeHealth.unusedCode)],
                ['Dead Routes', String(report.codeHealth.deadRoutes)],
                ['Large Files', String(report.codeHealth.largeFiles)],
                ['Circular Dependencies', report.codeHealth.circularDependencies],
                ['Warnings', String(report.codeHealth.warnings)],
              ]}
            />
            <CategorySummary
              title="Security"
              rows={[
                ['Secrets', String(report.security.secrets.value)],
                ['Environment Configuration', report.security.environmentConfiguration],
                ['Dependency Vulnerabilities', report.security.dependencyVulnerabilities],
                ['Authentication Review', report.security.authenticationReview],
                ['Authorization Review', report.security.authorizationReview],
                ['Security Risks', String(report.security.securityRisks)],
              ]}
            />
            <CategorySummary
              title="Documentation"
              rows={[
                ['README', report.documentation.readme ? 'Present' : 'Missing'],
                ['Architecture Documentation', report.documentation.architectureDocumentation ? 'Present' : 'Missing'],
                ['API Documentation', report.documentation.apiDocumentation],
                ['Developer Notes', report.documentation.developerNotes ? 'Present' : 'Missing'],
                ['Deployment Notes', report.documentation.deploymentNotes],
              ]}
            />
            <CategorySummary
              title="Engineering Progress"
              rows={[
                ['Current Phase', report.engineeringProgress.currentPhase],
                ['Current Milestone', report.engineeringProgress.currentMilestone],
                ['Current Batch', report.engineeringProgress.currentBatch],
                ['Engineering Organization', report.engineeringProgress.engineeringOrganization],
                ['Completion', `${report.engineeringProgress.completionPercent}%`],
              ]}
            />
            <CategorySummary
              title="Project Intelligence"
              rows={[
                ['Technology Stack', report.projectIntelligence.technologyStack],
                ['Business Domain', report.projectIntelligence.businessDomain],
                ['Target Industry', report.projectIntelligence.targetIndustry],
                ['Integrations', report.projectIntelligence.integrations],
                ['AI Components', report.projectIntelligence.aiComponents],
                ['Platform Components', report.projectIntelligence.platformComponents],
              ]}
            />
          </div>

          <div>
            <DevSectionLabel>Recommendations</DevSectionLabel>
            {report.recommendations.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--dev-text-faint)]">No recommendations — nothing observed needs attention.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {report.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--dev-text)]">
                    <DevBadge tone="neutral">{rec.category}</DevBadge>
                    <span>{rec.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--dev-text-faint)]">
          Read-only — observes repository, build, architecture, code health, security, documentation, and engineering progress without
          modifying anything.
        </p>
      )}
    </DevCard>
  )
}

function ScoreTile({ label, metric }: { label: string; metric: { score: number; reasons: string[] } }) {
  return (
    <div className="rounded-xl border border-[var(--dev-border)] p-3" title={metric.reasons.join(' ')}>
      <div className="font-mono text-[10px] uppercase tracking-wide text-[var(--dev-text-faint)]">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${scoreTone(metric.score) === 'success' ? 'text-emerald-500' : scoreTone(metric.score) === 'warning' ? 'text-amber-500' : 'text-rose-500'}`}>
        {metric.score}
      </div>
    </div>
  )
}

function CategorySummary({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-xl border border-[var(--dev-border)] p-3">
      <div className="text-sm font-medium text-[var(--dev-text)]">{title}</div>
      <div className="mt-2 space-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-xs">
            <span className="text-[var(--dev-text-faint)]">{label}</span>
            <span className="truncate text-right text-[var(--dev-text)]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
