'use client'

import { useState } from 'react'
import type { GeneratedPrompt } from '@/lib/dev/promptIntelligenceEngine'
import { copyToClipboard, DevButton, DevSectionLabel } from './ui'

/**
 * Renders a Prompt Intelligence Engine result with a copy-to-clipboard
 * action — the same interaction pattern DevelopmentPlanPanel already uses
 * for its Suggested Claude Prompt block. Purely presentational: it never
 * generates or edits prompt content itself, only displays what
 * getGeneratedPrompt already assembled.
 */
export function PromptGenerator({ prompt, heading = 'Claude Instruction' }: { prompt: GeneratedPrompt; heading?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const ok = await copyToClipboard(prompt.fullText)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <DevSectionLabel>{heading}</DevSectionLabel>
        <DevButton variant="secondary" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy Prompt'}
        </DevButton>
      </div>
      <pre className="mt-2 max-h-96 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-black/20 p-3 font-mono text-[12px] leading-relaxed text-[var(--dev-text-muted)]">
        {prompt.fullText}
      </pre>
    </div>
  )
}
