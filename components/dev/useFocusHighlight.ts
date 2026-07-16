'use client'

import { useEffect, useState } from 'react'
import { useQueryParam } from './useQueryParam'

/**
 * Reads `?focus=<id>` from the URL. Scrolls the matching `#record-<id>`
 * element into view and returns its id briefly, for a highlight ring, so
 * cross-links between boards feel instantaneous.
 */
export function useFocusHighlight(ids: string[]): string | null {
  const focus = useQueryParam('focus')
  const [highlighted, setHighlighted] = useState<string | null>(null)

  useEffect(() => {
    if (!focus || !ids.includes(focus)) return
    const el = document.getElementById(`record-${focus}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlighted(focus)
    const timer = window.setTimeout(() => setHighlighted(null), 2200)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, ids.join('|')])

  return highlighted
}
