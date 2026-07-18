import type { ReactNode } from 'react'
import { PayCompanyProvider } from '@/context/pay/PayCompanyContext'
import { PayPortalShell } from '@/components/pay/PayPortalShell'
import '../portal-theme.css'

export const metadata = {
  title: 'VYRON PAY — Payroll Command Centre',
}

export default function PayPortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pay-root">
      <PayCompanyProvider>
        <PayPortalShell>{children}</PayPortalShell>
      </PayCompanyProvider>
    </div>
  )
}
