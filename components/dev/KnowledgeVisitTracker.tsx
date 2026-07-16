'use client'

import { useEffect } from 'react'
import { recordRecentItem } from '@/lib/dev/recents'

export function KnowledgeVisitTracker({ slug, title }: { slug: string; title: string }) {
  useEffect(() => {
    recordRecentItem({ type: 'knowledge', id: slug, label: title, href: `/dev/knowledge/${slug}` })
  }, [slug, title])
  return null
}
