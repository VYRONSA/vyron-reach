import { DevBadge, DevCard, DevCardHeader, DevEmptyState, DevRow } from '../ui'
import type { KnowledgeDiscoverySummary } from '@/lib/dev/initiation/initiationTypes'

/**
 * Read-only render of what Knowledge Discovery found (or didn't) for the
 * most recent generation attempt — the durable record requirement 5
 * ("clearly recording the knowledge gap") asks for, kept visible rather
 * than only living inside the prompt that was sent to the model.
 */
export function InitiationKnowledgeDiscoveryPanel({ discovery }: { discovery: KnowledgeDiscoverySummary }) {
  return (
    <DevCard>
      <DevCardHeader
        title="Knowledge Discovery"
        badge={<DevBadge tone={discovery.itemsFound > 0 ? 'success' : 'warning'}>{discovery.itemsFound} item(s) found</DevBadge>}
      />
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <DevRow label="Sources consulted" value={discovery.sourcesConsulted} />
        <DevRow label="Items found" value={discovery.itemsFound} />
        <DevRow label="Gaps" value={discovery.gaps.length} />
      </div>

      {discovery.topItems.length > 0 ? (
        <div className="mt-4">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-text-faint)]">Top retrieved knowledge</div>
          <ul className="mt-2 space-y-2">
            {discovery.topItems.map((item, i) => (
              <li key={i} className="rounded-lg bg-[var(--dev-surface-hover)] p-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-[var(--dev-text)]">{item.title}</span>
                  <span className="font-mono text-xs text-[var(--dev-text-faint)]">{Math.round(item.relevanceScore * 100)}% relevant</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-[var(--dev-text-faint)]">
                  <DevBadge tone="info">{item.sourceType}</DevBadge>
                  <span className="font-mono">{item.sourceRef}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <DevEmptyState>No organisational knowledge was retrieved — generation relied on the Executive Directive alone.</DevEmptyState>
      )}

      {discovery.gaps.length > 0 ? (
        <div className="mt-4 border-t border-[var(--dev-border)] pt-3">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-text-faint)]">Knowledge gaps</div>
          <ul className="mt-2 space-y-1">
            {discovery.gaps.map((gap, i) => (
              <li key={i} className="text-xs text-[var(--dev-text-faint)]">
                <span className="font-medium text-[var(--dev-text-muted)]">{gap.sourceType}:</span> {gap.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </DevCard>
  )
}
