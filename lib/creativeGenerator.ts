import {
  applyRevisionToSpec,
  buildEnterpriseCampaignSpec,
  buildEnterpriseImagePrompt,
  resolveCampaignSpec,
} from '@/lib/enterpriseCreativeEngine'
import type { CreativeBuilderInput, VyronCreative } from '@/lib/vyronStore/types'

export function buildImagePrompt(input: CreativeBuilderInput, version: number): string {
  const spec = buildEnterpriseCampaignSpec(input, version)
  return buildEnterpriseImagePrompt(spec, input, version)
}

export function buildVisualDirection(input: CreativeBuilderInput, version: number): string {
  const spec = buildEnterpriseCampaignSpec(input, version)
  return `${spec.layout} · ${spec.theme} · ${spec.headline} · enterprise campaign`
}

export function generateCreativeVariations(
  input: CreativeBuilderInput,
  newId: (prefix: string) => string,
  options?: { facebookPack?: boolean },
): Omit<VyronCreative, 'createdAt' | 'updatedAt'>[] {
  if (options?.facebookPack) {
    return generateFacebookAdvertVariations(input, newId)
  }
  const now = new Date().toISOString()
  const platforms: CreativeBuilderInput['platform'][] =
    input.platform === 'Facebook'
      ? ['Facebook', 'Instagram', 'LinkedIn']
      : [input.platform, input.platform, input.platform]

  return [1, 2, 3].map(version => {
    const platform = platforms[version - 1] ?? input.platform
    const rowInput = { ...input, platform }
    const spec = buildEnterpriseCampaignSpec(rowInput, version)
    const imagePrompt = buildEnterpriseImagePrompt(spec, rowInput, version)

    return {
      id: newId('creative'),
      clientId: input.clientId,
      clientName: input.clientName,
      productName: input.productName,
      campaignGoal: input.campaignGoal,
      platform,
      audience: input.audience,
      offer: input.offer,
      headline: spec.headline,
      cta: spec.cta,
      visualStyle: input.visualStyle,
      colourDirection: input.colourDirection,
      notes: input.notes,
      version,
      status: 'Awaiting Approval' as const,
      imagePrompt,
      visualDirection: buildVisualDirection(rowInput, version),
      feedbackNotes: '',
      campaignSpec: spec,
      approvalHistory: [
        {
          id: newId('hist'),
          status: 'Awaiting Approval',
          note: `Enterprise campaign V${version} — ${spec.layout}`,
          createdAt: now,
        },
      ],
      actionId: input.actionId,
    }
  })
}

export const FACEBOOK_VARIATION_LABELS = [
  { label: 'Premium Corporate', theme: 'Executive Enterprise' as const, version: 1 },
  { label: 'Bold Launch', theme: 'High Energy Growth' as const, version: 2 },
  { label: 'Clean SaaS', theme: 'Futuristic AI' as const, version: 3 },
]

export function generateFacebookAdvertVariations(
  input: CreativeBuilderInput,
  newId: (prefix: string) => string,
): Omit<VyronCreative, 'createdAt' | 'updatedAt'>[] {
  const now = new Date().toISOString()

  return FACEBOOK_VARIATION_LABELS.map(({ label, theme, version }) => {
    const rowInput: CreativeBuilderInput = {
      ...input,
      platform: 'Facebook',
      layout: 'Social Ad',
      variationTheme: theme,
      visualStyle: theme === 'High Energy Growth' ? 'Bold' : theme === 'Executive Enterprise' ? 'Corporate' : 'Premium SaaS',
      colourDirection: 'navy neon cyan purple',
    }
    const spec = buildEnterpriseCampaignSpec(rowInput, version)
    const imagePrompt = buildEnterpriseImagePrompt(spec, rowInput, version)

    return {
      id: newId('creative'),
      clientId: input.clientId,
      clientName: input.clientName,
      productName: input.productName,
      campaignGoal: input.campaignGoal,
      platform: 'Facebook',
      audience: input.audience,
      offer: input.offer,
      headline: spec.headline,
      cta: spec.cta.includes('DEMO') ? spec.cta : 'BOOK DEMO',
      visualStyle: rowInput.visualStyle,
      colourDirection: rowInput.colourDirection,
      notes: `${label} · ${input.notes}`.trim(),
      version,
      status: 'Awaiting Approval' as const,
      imagePrompt,
      visualDirection: `${label} · ${spec.layout} · ${theme}`,
      feedbackNotes: '',
      campaignSpec: spec,
      approvalHistory: [
        {
          id: newId('hist'),
          status: 'Awaiting Approval',
          note: `Facebook ${label} — generated`,
          createdAt: now,
        },
      ],
      actionId: input.actionId,
    }
  })
}

export function buildRevisionPrompt(
  base: VyronCreative,
  feedback: string,
  version: number,
): string {
  const spec = applyRevisionToSpec(resolveCampaignSpec(base), feedback)
  const input: CreativeBuilderInput = {
    clientName: base.clientName,
    productName: base.productName,
    campaignGoal: base.campaignGoal,
    platform: base.platform,
    audience: base.audience,
    offer: base.offer,
    headline: spec.headline,
    cta: spec.cta,
    visualStyle: base.visualStyle,
    colourDirection: base.colourDirection,
    notes: base.notes,
    layout: spec.layout,
    variationTheme: spec.theme,
    website: spec.website,
    contact: spec.contact,
  }
  return buildEnterpriseImagePrompt(spec, input, version)
}

export function buildRevisionCreative(
  base: VyronCreative,
  feedback: string,
  version: number,
  newId: (prefix: string) => string,
): Omit<VyronCreative, 'createdAt' | 'updatedAt'> {
  const spec = applyRevisionToSpec(resolveCampaignSpec(base), feedback)
  const input: CreativeBuilderInput = {
    clientName: base.clientName,
    productName: base.productName,
    campaignGoal: base.campaignGoal,
    platform: base.platform,
    audience: base.audience,
    offer: base.offer,
    headline: spec.headline,
    cta: spec.cta,
    visualStyle: base.visualStyle,
    colourDirection: base.colourDirection,
    notes: base.notes,
    layout: spec.layout,
    variationTheme: spec.theme,
    website: spec.website,
    contact: spec.contact,
  }
  const imagePrompt = buildEnterpriseImagePrompt(spec, input, version)
  const now = new Date().toISOString()

  return {
    id: newId('creative'),
    clientId: base.clientId,
    clientName: base.clientName,
    productName: base.productName,
    campaignGoal: base.campaignGoal,
    platform: base.platform,
    audience: base.audience,
    offer: base.offer,
    headline: spec.headline,
    cta: spec.cta,
    visualStyle: base.visualStyle,
    colourDirection: base.colourDirection,
    notes: base.notes,
    version,
    parentId: base.parentId ?? base.id,
    status: 'Awaiting Approval',
    imagePrompt,
    visualDirection: `${spec.layout} · ${spec.theme} · Revised`,
    feedbackNotes: feedback,
    campaignSpec: spec,
    approvalHistory: [
      {
        id: newId('hist'),
        status: 'Awaiting Approval',
        note: `Revision V${version}: ${feedback.slice(0, 120)}`,
        createdAt: now,
      },
    ],
    actionId: base.actionId,
  }
}
