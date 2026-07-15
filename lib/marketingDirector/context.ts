import type { VyronClient, VyronStore } from '@/lib/vyronStore/types'
import type { MarketingDirectorContext } from '@/lib/marketingDirector/types'

export function buildDirectorContext(
  store: VyronStore,
  clientId: string | null,
): MarketingDirectorContext {
  const client = clientId ? store.clients.find(c => c.id === clientId) ?? null : store.clients[0] ?? null

  const keywords = client
    ? store.keywords.filter(
        k =>
          k.business === client.businessName ||
          client.targetKeywords.some(tk => tk.toLowerCase() === k.keyword.toLowerCase()),
      )
    : store.keywords.slice(0, 12)

  const kwList =
    keywords.length > 0 ? keywords.map(k => k.keyword) : client?.targetKeywords ?? store.keywords.slice(0, 6).map(k => k.keyword)

  const services =
    client?.industry.toLowerCase().includes('saas') || client?.businessName.toLowerCase().includes('vyron')
      ? [
          'Smart Clocking & attendance',
          'AI HR automation',
          'Real-time operational insights',
          'Secure cloud workforce data',
          'Automated rostering & workflows',
        ]
      : client?.industry.toLowerCase().includes('beverage') || client?.businessName.toLowerCase().includes('bridgewater')
        ? [
            'Premium botanical tonics',
            'Alcohol-free social ritual',
            'DTC ecommerce',
            'Cape Town & Johannesburg delivery',
          ]
        : client?.industry.toLowerCase().includes('catering') || client?.businessName.toLowerCase().includes('cutting')
          ? ['Corporate catering', 'Sushi platters', 'Office lunch programs', 'Event catering']
          : [client?.industry ?? 'Core services', 'Lead generation', 'Brand growth']

  const campaignGoal =
    client?.notes?.split('.')[0] ??
    (client?.businessName.toLowerCase().includes('vyron')
      ? 'Generate leads for workforce management software'
      : 'Drive qualified leads and revenue')

  const brandStyle =
    client?.businessName.toLowerCase().includes('vyron')
      ? 'Enterprise SaaS · dark navy · neon cyan/purple · VYRON CORE gold-standard poster (dashboard + mobile mockups, feature blocks, cinematic lighting)'
      : client?.businessName.toLowerCase().includes('bridgewater')
        ? 'Premium botanical luxury · emerald gold · moody lifestyle'
        : client?.businessName.toLowerCase().includes('cutting')
          ? 'Premium food branding · corporate catering · warm modern'
          : 'Premium enterprise marketing · clear value communication'

  return {
    client,
    settings: store.settings,
    keywords: keywords.length ? keywords : store.keywords.slice(0, 8),
    services,
    campaignGoal,
    brandStyle,
  }
}

export function contextSummary(ctx: MarketingDirectorContext): string {
  const c = ctx.client
  if (!c) {
    return `Agency: ${ctx.settings.businessName} · Market: ${ctx.settings.defaultMarket} · No client selected — use VYRON CORE as default benchmark.`
  }
  return [
    `Client: ${c.businessName}`,
    `Industry: ${c.industry}`,
    `Website: ${c.website || '—'}`,
    `Monthly budget: R${c.monthlyMarketingBudget.toLocaleString('en-ZA')}`,
    `Target area: ${c.targetArea}`,
    `Campaign goal: ${ctx.campaignGoal}`,
    `Keywords: ${c.targetKeywords.join('; ') || ctx.keywords.map(k => k.keyword).join('; ')}`,
    `Services: ${ctx.services.join(' · ')}`,
    `Brand style: ${ctx.brandStyle}`,
    `Notes: ${c.notes}`,
  ].join('\n')
}
