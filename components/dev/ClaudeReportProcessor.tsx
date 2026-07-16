'use client'

import { useState } from 'react'
import { getProjects } from '@/lib/dev/projectsData'
import { completeDevelopmentCycle, type DevelopmentCompletionResult } from '@/lib/dev/developmentCompletionEngine'
import { DevBadge, DevButton, DevInput, DevSelect, DevTextarea, devValidationTone } from './ui'
import { PromptGenerator } from './PromptGenerator'

/**
 * The entry point into the Development Completion Engine — paste a Claude
 * implementation report, pick which project it's for, and process it. All
 * parsing/writing/next-prompt generation happens inside
 * completeDevelopmentCycle; this component only collects input and renders
 * the result.
 */
export function ClaudeReportProcessor({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [project, setProject] = useState('')
  const [claudeModel, setClaudeModel] = useState('')
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [rawReport, setRawReport] = useState('')
  const [result, setResult] = useState<DevelopmentCompletionResult | null>(null)

  const handleProcess = () => {
    if (!project || !rawReport.trim()) return
    setResult(completeDevelopmentCycle(project, rawReport, { claudeModel: claudeModel.trim(), originalPrompt }))
  }

  if (result) {
    return (
      <div className="rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-[var(--dev-text)]">Report Processed</div>
          <DevBadge tone={result.status === 'Development Complete' ? 'success' : 'warning'}>{result.status}</DevBadge>
        </div>

        {result.reasons.length > 0 ? (
          <ul className="mt-3 space-y-1">
            {result.reasons.map((reason, i) => (
              <li key={i} className="text-sm text-[var(--dev-text-muted)]">
                - {reason}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <div className="text-xs text-[var(--dev-text-faint)]">Build</div>
            <DevBadge tone={devValidationTone(result.parsed.buildStatus)}>{result.parsed.buildStatus}</DevBadge>
          </div>
          <div>
            <div className="text-xs text-[var(--dev-text-faint)]">TypeScript</div>
            <DevBadge tone={devValidationTone(result.parsed.typescriptStatus)}>{result.parsed.typescriptStatus}</DevBadge>
          </div>
          <div>
            <div className="text-xs text-[var(--dev-text-faint)]">Runtime</div>
            <DevBadge tone={devValidationTone(result.parsed.runtimeStatus)}>{result.parsed.runtimeStatus}</DevBadge>
          </div>
        </div>

        <div className="mt-4 text-xs text-[var(--dev-text-faint)]">
          {result.parsed.filesCreated.length} file{result.parsed.filesCreated.length === 1 ? '' : 's'} created ·{' '}
          {result.parsed.filesModified.length} modified · {result.parsed.filesDeleted.length} deleted. Logged as a new handover.
        </div>

        {result.nextPrompt ? (
          <div className="mt-4 border-t border-[var(--dev-border)] pt-4">
            <PromptGenerator prompt={result.nextPrompt} heading="Next Claude Prompt" />
          </div>
        ) : null}

        <div className="mt-5 flex items-center gap-2">
          <DevButton onClick={onDone}>Done</DevButton>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DevSelect value={project} onChange={e => setProject(e.target.value)} aria-label="Project">
          <option value="">Select project…</option>
          {getProjects().map(p => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </DevSelect>
        <DevInput
          value={claudeModel}
          onChange={e => setClaudeModel(e.target.value)}
          placeholder="Claude model, e.g. Claude Sonnet 5"
        />
      </div>
      <DevTextarea
        className="mt-3"
        value={originalPrompt}
        onChange={e => setOriginalPrompt(e.target.value)}
        placeholder="Original prompt sent to Claude (optional)"
        rows={3}
      />
      <DevTextarea
        className="mt-3 font-mono text-[12px]"
        value={rawReport}
        onChange={e => setRawReport(e.target.value)}
        placeholder="Paste Claude's full implementation report..."
        rows={12}
      />
      <div className="mt-5 flex items-center gap-2">
        <DevButton onClick={handleProcess} disabled={!project || !rawReport.trim()}>
          Process Report
        </DevButton>
        <DevButton type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </DevButton>
      </div>
    </div>
  )
}
