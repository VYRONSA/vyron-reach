import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProjectBySlug, PROJECTS, STATUS_LABEL, STATUS_TONE } from '@/lib/dev/projectsData'
import { DevBadge, DevPageHeader } from '@/components/dev/ui'
import { ProjectVisitTracker } from '@/components/dev/ProjectVisitTracker'
import { ProjectWorkspaceTabs } from '@/components/dev/ProjectWorkspaceTabs'

export function generateStaticParams() {
  return PROJECTS.map(p => ({ slug: p.slug }))
}

export default async function DevProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = getProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  return (
    <div>
      <ProjectVisitTracker slug={project.slug} name={project.name} />

      <Link
        href="/dev/projects"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]"
      >
        &larr; All projects
      </Link>

      <DevPageHeader
        eyebrow="Project"
        title={project.name}
        description={project.description}
        actions={<DevBadge tone={STATUS_TONE[project.status]}>{STATUS_LABEL[project.status]}</DevBadge>}
      />

      <ProjectWorkspaceTabs project={project} />
    </div>
  )
}
