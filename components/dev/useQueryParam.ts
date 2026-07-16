'use client'

import { useEffect, useState } from 'react'

/**
 * Reads a single query-string value directly from window.location (not
 * next/navigation's useSearchParams), so using it never forces a route into
 * dynamic rendering or requires a Suspense boundary.
 */
export function useQueryParam(key: string): string {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    setValue(new URLSearchParams(window.location.search).get(key) ?? '')
  }, [key])

  return value
}
