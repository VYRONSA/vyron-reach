import { PROJECTS } from '@/lib/dev/projectsData'
import { getSystemInfo } from '@/lib/dev/systemInfo'
import { DevGrid, DevPageHeader, DevStat } from '@/components/dev/ui'
import { QuickActionsCard, RecentPagesCard } from '@/components/dev/DashboardWidgets'
import { DashboardSummary } from '@/components/dev/DashboardSummary'
import { PortfolioIntelligence } from '@/components/dev/PortfolioIntelligence'
import { DailyBriefing } from '@/components/dev/DailyBriefing'
import { WorkSessionTimer } from '@/components/dev/WorkSessionTimer'
import { RecentlyUsedCard } from '@/components/dev/RecentlyUsedCard'
import {
  FavouriteKnowledgeCard,
  FavouritePromptsCard,
  PinnedBatchesCard,
  PinnedMilestonesCard,
  PinnedProjectsCard,
} from '@/components/dev/WorkspaceWidgets'

export default function DevDashboardPage() {
  const info = getSystemInfo()

  return (
    <div>
      <DevPageHeader
        eyebrow="Executive Home"
        title="Development Command Centre"
        description="Everything you need to run VYRON development day to day — focus, health, blockers, and the latest activity across every product."
      />

      <DailyBriefing />

      <DevGrid className="mb-8">
        <DevStat label="Products Tracked" value={String(PROJECTS.length)} hint="In the portfolio" />
        <DevStat
          label="Git Status"
          value={info.git.branch}
          hint={info.git.commit !== 'Unavailable' ? `Commit ${info.git.commit}` : undefined}
          tone={info.git.branch === 'Unavailable' ? 'neutral' : 'success'}
        />
        <DevStat label="Build Status" value={info.buildStatus} tone={info.buildStatus === 'Passing' ? 'success' : 'danger'} />
        <DevStat label="TypeScript" value={info.typescriptStatus} tone={info.typescriptStatus === 'Passing' ? 'success' : 'danger'} />
      </DevGrid>

      <div className="mb-8">
        <PortfolioIntelligence />
      </div>

      <DashboardSummary />

      <div className="mt-8">
        <div className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--dev-accent)]">
          Your Workspace
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <WorkSessionTimer />
          <RecentlyUsedCard />
          <RecentPagesCard />
          <QuickActionsCard />
          <PinnedProjectsCard />
          <PinnedMilestonesCard />
          <PinnedBatchesCard />
          <FavouritePromptsCard />
          <FavouriteKnowledgeCard />
        </div>
      </div>
    </div>
  )
}
