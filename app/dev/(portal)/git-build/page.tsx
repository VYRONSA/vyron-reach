import { getSystemInfo } from '@/lib/dev/systemInfo'
import { DevGrid, DevPageHeader, DevStat } from '@/components/dev/ui'

function fmt(iso: string) {
  if (iso === 'Unavailable') return iso
  return new Date(iso).toLocaleString()
}

export default function DevGitBuildPage() {
  const info = getSystemInfo()

  return (
    <div>
      <DevPageHeader
        eyebrow="Pipeline"
        title="Git & Build"
        description="Repository and build health, read directly from the filesystem and package metadata. No shell commands are run."
      />

      <DevGrid>
        <DevStat label="Application Version" value={`v${info.appVersion}`} />
        <DevStat label="Build Time" value={fmt(info.buildTime)} hint=".next/BUILD_ID" tone={info.buildTime === 'Unavailable' ? 'neutral' : undefined} />
        <DevStat label="Environment" value={info.environment} />
        <DevStat label="Node Version" value={info.nodeVersion} />
        <DevStat
          label="Git Branch"
          value={info.git.branch}
          tone={info.git.branch === 'Unavailable' ? 'neutral' : 'success'}
        />
        <DevStat
          label="Latest Commit"
          value={info.git.commit}
          hint={info.git.commitDate !== 'Unavailable' ? fmt(info.git.commitDate) : undefined}
          tone={info.git.commit === 'Unavailable' ? 'neutral' : 'success'}
        />
        <DevStat label="Current Route Count" value={String(info.routeCount)} hint="page.tsx + route.ts under app/" />
        <DevStat label="Developer Portal Version" value={info.devPortalVersion} />
      </DevGrid>
    </div>
  )
}
