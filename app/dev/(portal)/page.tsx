import { getGitIntelligence } from '@/lib/dev/gitIntelligence'
import { getDeploymentIntelligence } from '@/lib/dev/deploymentIntelligence'
import { getBuildIntelligence } from '@/lib/dev/buildIntelligence'
import { DevGrid, DevPageHeader } from '@/components/dev/ui'
import { QuickActionsCard, RecentPagesCard } from '@/components/dev/DashboardWidgets'
import { PortfolioIntelligence } from '@/components/dev/PortfolioIntelligence'
import { DailyBriefing } from '@/components/dev/DailyBriefing'
import { WorkSessionTimer } from '@/components/dev/WorkSessionTimer'
import { RecentlyUsedCard } from '@/components/dev/RecentlyUsedCard'
import { ExecutiveCommandCentre } from '@/components/dev/ExecutiveCommandCentre'
import { DevelopmentPlanPanel } from '@/components/dev/DevelopmentPlanPanel'
import { GitIntelligenceCard } from '@/components/dev/GitIntelligenceCard'
import { DeploymentIntelligenceCard } from '@/components/dev/DeploymentIntelligenceCard'
import { BuildIntelligenceCard } from '@/components/dev/BuildIntelligenceCard'
import { ProductsTrackedStat } from '@/components/dev/ProductsTrackedStat'
import {
  FavouriteKnowledgeCard,
  FavouritePromptsCard,
  PinnedBatchesCard,
  PinnedMilestonesCard,
  PinnedProjectsCard,
} from '@/components/dev/WorkspaceWidgets'

export default function DevDashboardPage() {
  const git = getGitIntelligence()
  const build = getBuildIntelligence()
  const deployment = getDeploymentIntelligence({
    buildStatus: build.lastBuildStatus,
    typescriptStatus: build.lastTypeScriptStatus,
    gitReadiness: git.workingTreeStatus,
  })

  return (
    <div>
      <DevPageHeader
        eyebrow="Executive Home"
        title="Development Command Centre"
        description="Everything you need to run VYRON development day to day — focus, health, blockers, and the latest activity across every product."
      />

      <div className="mb-8">
        <ExecutiveCommandCentre
          buildStatus={build.lastBuildStatus}
          typescriptStatus={build.lastTypeScriptStatus}
          git={git}
          deployment={deployment}
          build={build}
        />
      </div>

      <DailyBriefing />

      <DevGrid className="mb-8">
        <ProductsTrackedStat />
      </DevGrid>

      <div className="mb-8">
        <PortfolioIntelligence />
      </div>

      <div className="mb-8">
        <DevelopmentPlanPanel
          buildStatus={build.lastBuildStatus}
          typescriptStatus={build.lastTypeScriptStatus}
          git={git}
          deployment={deployment}
          build={build}
        />
      </div>

      <div className="mb-8">
        <GitIntelligenceCard git={git} />
      </div>

      <div className="mb-8">
        <DeploymentIntelligenceCard deployment={deployment} />
      </div>

      <div className="mb-8">
        <BuildIntelligenceCard build={build} />
      </div>

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
