'use client'

import { TeamMembersPanel } from '@/components/pay/TeamMembersPanel'
import { PayPageHeader } from '@/components/pay/ui'

export default function PayTeamPage() {
  return (
    <div>
      <PayPageHeader
        eyebrow="Workspace"
        title="Team"
        description="Manage who has access to this VYRON PAY workspace and their role."
      />
      <TeamMembersPanel />
    </div>
  )
}
