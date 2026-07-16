'use client'

import { useEffect } from 'react'
import { recordRecentItem, recordRecentProject } from '@/lib/dev/recents'

export function ProjectVisitTracker({ slug, name }: { slug: string; name: string }) {
  useEffect(() => {
    recordRecentProject(slug, name)
    recordRecentItem({ type: 'project', id: slug, label: name, href: `/dev/projects/${slug}` })
  }, [slug, name])
  return null
}
