import pkg from '@/package.json'
import { DevCard, DevPageHeader, DevRow } from '@/components/dev/ui'
import { SettingsForm } from '@/components/dev/SettingsForm'

const APPLICATION_PATHS = [
  { path: '/dev', label: 'Dashboard' },
  { path: '/dev/projects', label: 'Projects' },
  { path: '/dev/projects/[slug]', label: 'Project detail' },
  { path: '/dev/queue', label: 'Development Queue' },
  { path: '/dev/ai-workspace', label: 'AI Workspace' },
  { path: '/dev/knowledge', label: 'Knowledge Centre' },
  { path: '/dev/knowledge/[slug]', label: 'Knowledge section' },
  { path: '/dev/git-build', label: 'Git & Build' },
  { path: '/dev/settings', label: 'Settings' },
  { path: '/dev/login', label: 'Login (public)' },
]

export default function DevSettingsPage() {
  const username = process.env.DEV_USERNAME || 'Not configured'
  const environment = process.env.NODE_ENV ?? 'development'

  return (
    <div>
      <DevPageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Account details are read-only. Preferences below are editable and stored in your browser."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DevCard eyebrow="Account" title="Developer Session">
          <div className="mt-3">
            <DevRow label="Developer Username" value={username} />
            <DevRow label="Environment" value={environment} />
            <DevRow label="Version" value={`v${pkg.version}`} />
            <DevRow label="Build" value="next build" />
          </div>
        </DevCard>

        <DevCard eyebrow="Routing" title="Application Paths">
          <div className="mt-3">
            {APPLICATION_PATHS.map(entry => (
              <DevRow key={entry.path} label={entry.label} value={entry.path} />
            ))}
          </div>
        </DevCard>
      </div>

      <div className="mt-4">
        <SettingsForm />
      </div>
    </div>
  )
}
