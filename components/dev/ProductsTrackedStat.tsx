'use client'

import { useEffect, useState } from 'react'
import { getProjects } from '@/lib/dev/projectsData'
import { DevStat } from './ui'

/**
 * "Products Tracked" reads from localStorage (admin-editable project
 * list), so — like every other localStorage-backed value in VYRON DEV —
 * it self-fetches client-side rather than being read in the Server
 * Component that hosts the rest of the Dashboard's stat strip.
 */
export function ProductsTrackedStat() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    setCount(getProjects().filter(p => !p.archived).length)
  }, [])

  return <DevStat label="Products Tracked" value={count === null ? '—' : String(count)} hint="In the portfolio" />
}
