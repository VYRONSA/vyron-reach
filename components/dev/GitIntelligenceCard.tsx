'use client'

import type { GitIntelligence } from '@/lib/dev/gitIntelligence'
import { DevBadge, DevCard, DevCardHeader, DevField } from './ui'

const EMPTY_GIT: GitIntelligence = {
  repositoryAvailable: false,
  branch: 'Unavailable',
  commitHash: 'Unavailable',
  commitMessage: 'Unavailable',
  commitDate: 'Unavailable',
  filesChanged: null,
  filesAdded: null,
  filesDeleted: null,
  filesModified: null,
  aheadBehind: null,
  workingTreeStatus: 'Unknown',
}

const STATUS_TONE: Record<GitIntelligence['workingTreeStatus'], 'success' | 'warning' | 'neutral'> = {
  Clean: 'success',
  Modified: 'warning',
  Unknown: 'neutral',
}

/**
 * Git Intelligence — read-only repository state, driven entirely by
 * lib/dev/gitIntelligence.ts. That engine only runs server-side (it reads
 * the filesystem), so unlike the other intelligence cards this one doesn't
 * self-fetch: the caller resolves it once in a Server Component and passes
 * the plain result down as a prop.
 */
export function GitIntelligenceCard({ git }: { git?: GitIntelligence }) {
  const info = git ?? EMPTY_GIT

  return (
    <DevCard>
      <DevCardHeader
        title="Git Intelligence"
        badge={
          <DevBadge tone={info.repositoryAvailable ? STATUS_TONE[info.workingTreeStatus] : 'neutral'}>
            {info.repositoryAvailable ? info.workingTreeStatus : 'Unavailable'}
          </DevBadge>
        }
      />

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <DevField label="Branch">
          <span className="text-sm text-[var(--dev-text)]">{info.branch}</span>
        </DevField>
        <DevField label="Commit">
          <span className="text-sm text-[var(--dev-text)]">{info.commitHash}</span>
          {info.commitMessage !== 'Unavailable' ? (
            <p className="mt-0.5 truncate text-xs text-[var(--dev-text-faint)]">{info.commitMessage}</p>
          ) : null}
        </DevField>
        <DevField label="Working Tree">
          <span className="text-sm text-[var(--dev-text)]">{info.workingTreeStatus}</span>
        </DevField>
        <DevField label="Repository Status">
          <span className="text-sm text-[var(--dev-text)]">{info.repositoryAvailable ? 'Available' : 'Unavailable'}</span>
        </DevField>
        <DevField label="Changed Files">
          <span className="text-sm text-[var(--dev-text)]">{info.filesChanged ?? 'Unavailable'}</span>
        </DevField>
      </div>
    </DevCard>
  )
}
