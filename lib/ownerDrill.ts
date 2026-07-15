import type { DrillRecord } from '@/components/DrillDownPanel'
import { inferTaskKind } from '@/lib/actionQueue'
import type { ActionAdvertMeta, ActionContextMeta, ActionTaskKind, Priority } from '@/lib/vyronStore/types'

export type OwnerDrillQueueOptions = {
  department: string
  priority?: Priority
  due?: string
  outputNeeded?: string
  kind?: ActionTaskKind
  contextMeta?: ActionContextMeta
  advertMeta?: ActionAdvertMeta
}

export function buildOwnerDrill(
  title: string,
  subtitle: string,
  previousPage: string,
  rows: Array<{ label: string; value: string }>,
  actions: string[],
  metrics?: DrillRecord['metrics'],
  queue?: OwnerDrillQueueOptions,
): DrillRecord {
  const department = queue?.department ?? previousPage
  const outputNeeded =
    queue?.outputNeeded ??
    (queue?.kind === 'advert_image'
      ? 'Exported advert image file approved for paid social'
      : `Deliverable from ${previousPage}: ${title}`)

  return {
    title,
    subtitle,
    badge: previousPage,
    previousPage,
    metrics: metrics ?? [
      { label: 'Priority', value: 'Action Required', tone: 'purple' },
      { label: 'Impact', value: 'High', tone: 'green' },
      { label: 'Timeline', value: 'This week', tone: 'cyan' },
    ],
    rows,
    notes: actions.map((text, i) => ({
      title: `Step ${i + 1}`,
      text,
    })),
    queueItem: {
      title,
      subtitle,
      department,
      sourcePage: previousPage,
      priority: queue?.priority ?? 'High',
      due: queue?.due ?? 'This week',
      executionBrief: subtitle || `Execute marketing action: ${title}`,
      nextSteps: actions.length ? actions : ['Review context', 'Execute steps', 'Mark complete in AI Action Queue'],
      outputNeeded,
      kind: inferTaskKind(previousPage, queue?.kind, Boolean(queue?.advertMeta)),
      contextMeta: queue?.contextMeta,
      advertMeta: queue?.advertMeta,
    },
  }
}
