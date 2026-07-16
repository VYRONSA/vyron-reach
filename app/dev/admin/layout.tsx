import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { isOwner } from '@/lib/dev/auth'
import { AdminShell } from '@/components/dev/admin/AdminShell'
import '../portal-theme.css'

export const metadata = {
  title: 'VYRON DEV — Administration',
}

/**
 * Defense in depth: proxy.ts already redirects non-owners away from
 * /dev/admin/*, but per Next.js's own guidance, proxy coverage can be
 * silently lost in a refactor — so this layout re-checks independently
 * rather than trusting the proxy alone.
 */
export default function DevAdminLayout({ children }: { children: ReactNode }) {
  if (!isOwner()) {
    redirect('/dev')
  }

  return <AdminShell>{children}</AdminShell>
}
