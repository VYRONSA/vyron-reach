'use client'

import { useAppNavigation } from '@/context/AppNavigationContext'
import { useVyronData } from '@/context/VyronDataContext'
export function OpenCreativeStudioButton() {
  const { navigateWithPrefill } = useAppNavigation()
  const { store } = useVyronData()

  return (
    <button
      type="button"
      onClick={() =>
        navigateWithPrefill('ai-creative-studio', {
          source: 'ai-action-queue',
          message: 'Open AI Creative Studio',
          creativeStudio: {
            clientName: store.settings.businessName,
            productName: store.settings.defaultProject,
            campaignGoal: 'Lead generation',
            platform: 'Facebook',
            audience: 'South African business owners',
            offer: 'Stop losing payroll hours',
            headline: 'Stop losing payroll hours',
            cta: 'Book a Demo',
            visualStyle: 'Premium SaaS',
            colourDirection: 'blue cyan purple',
            notes: '',
          },
        })
      }
      className="rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white"
    >
      Open AI Creative Studio
    </button>
  )
}
