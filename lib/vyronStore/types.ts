export type Priority = 'Critical' | 'High' | 'Medium'

export type KeywordIntent = 'Commercial' | 'Local' | 'Informational' | 'Buyer Intent' | 'Transactional'

export type VyronSettings = {
  businessName: string
  defaultProject: string
  defaultMarket: string
  defaultAdDailyBudget: number
  defaultSeoTimelineMonths: number
  contactEmail: string
  businessType: string
  defaultTargetArea: string
  aiMarketingRules: string
}

export type VyronClient = {
  id: string
  businessName: string
  industry: string
  website: string
  monthlyMarketingBudget: number
  targetArea: string
  targetKeywords: string[]
  notes: string
  plan: string
  adSpendNote: string
  createdAt: string
}

export type VyronKeyword = {
  id: string
  keyword: string
  volume: number
  difficulty: number
  intent: KeywordIntent
  forecast: string
  gap?: string
  recommendedPage?: string
  business?: string
  industry?: string
  targetArea?: string
}

export type VyronRanking = {
  id: string
  keyword: string
  page: string
  position: number
  change: number
  forecast: string
  stuck: boolean
  previousPosition?: number
}

export type VyronCompetitor = {
  id: string
  name: string
  domain: string
  weakPages: string[]
  keywordGaps: string[]
  threat: 'Low' | 'Medium' | 'High'
}

export type VyronContentTask = {
  id: string
  title: string
  type: 'Blog' | 'Landing Page' | 'FAQ' | 'Schema'
  status: 'Draft' | 'AI Generated' | 'Ready' | 'Published'
  targetKeyword: string
  dueDate?: string
}

export type AdvertPlatform = 'Facebook' | 'Instagram' | 'WhatsApp' | 'LinkedIn' | 'Google Display'
export type AdvertStyle = 'Premium SaaS' | 'Bold Social' | 'Corporate' | 'Futuristic' | 'Minimal'

export type VyronAdvertConcept = {
  id: string
  productName: string
  targetAudience: string
  platform: AdvertPlatform
  offerMessage: string
  style: AdvertStyle
  prompt: string
  createdAt: string
}

export type VyronCampaign = {
  id: string
  platform: string
  dailyBudget: number
  monthlyBudget: number
  status: 'Testing' | 'Active' | 'Paused' | 'Scaled'
  wastedSpend: number
  intentScore: number
  notes: string
}

export type ActionQueueStatus = 'pending' | 'in_progress' | 'ready_to_execute' | 'completed'

export type ActionTaskKind = 'general' | 'advert_image' | 'seo' | 'google_ads' | 'content'

export type ActionAdvertMeta = {
  prompt: string
  platform: string
  audience: string
  style: string
  productName: string
  offerMessage?: string
}

export type ActionContextMeta = {
  keyword?: string
  business?: string
  targetArea?: string
  searchIntent?: string
  difficulty?: string
  volume?: string
  suggestedDailyBudget?: string
}

export type VyronActionQueueItem = {
  id: string
  title: string
  subtitle: string
  priority: Priority
  /** @deprecated use sourcePage — kept for Supabase column compat */
  department: string
  sourcePage: string
  due: string
  status: ActionQueueStatus
  createdAt: string
  completedAt?: string
  executionBrief: string
  nextSteps: string[]
  outputNeeded: string
  generatedOutput?: string
  notes?: string
  kind: ActionTaskKind
  contextMeta?: ActionContextMeta
  advertMeta?: ActionAdvertMeta
  imageCreated?: boolean
}

export type VyronReport = {
  id: string
  title: string
  type: string
  period: string
  status: 'Ready' | 'Draft' | 'Scheduled'
  body: string
  createdAt: string
}

export type VyronGoogleAdsPlan = {
  id: string
  campaignName: string
  dailyBudget: number
  targetArea: string
  keywordTheme: string
  productService: string
  audience: string
  offer: string
  landingPageUrl: string
  planText: string
  launched: boolean
  createdAt: string
  actionId?: string
}

export type MarketingMaterialType =
  | 'pack'
  | 'facebook_ad'
  | 'instagram_post'
  | 'whatsapp'
  | 'linkedin'
  | 'google_headlines'
  | 'google_descriptions'
  | 'advert_image_prompt'
  | 'landing_section'
  | 'blog_outline'
  | 'faq_block'

export type VyronMarketingMaterial = {
  id: string
  title: string
  platform: string
  materialType: MarketingMaterialType
  content: string
  productName: string
  targetArea: string
  createdAt: string
  actionId?: string
}

export type CreativeStatus =
  | 'Draft'
  | 'Awaiting Approval'
  | 'Approved'
  | 'Declined'
  | 'Revision Requested'
  | 'Scheduled'
  | 'Launched'

export type CreativeVisualStyle = 'Premium SaaS' | 'Corporate' | 'Bold' | 'Minimal' | 'Futuristic'

export type CreativePlatform = 'Facebook' | 'Instagram' | 'WhatsApp' | 'LinkedIn' | 'Google Display'

export type CreativeLayoutType =
  | 'Poster'
  | 'Social Ad'
  | 'LinkedIn Corporate'
  | 'WhatsApp Promo'
  | 'Billboard'
  | 'SaaS Launch Campaign'

export type CreativeVariationTheme =
  | 'Corporate Clean'
  | 'Futuristic AI'
  | 'High Energy Growth'
  | 'Executive Enterprise'
  | 'South African Market Focus'

export type EnterpriseFeatureHighlight = {
  title: string
  description: string
  icon: string
}

export type EnterpriseCampaignSpec = {
  layout: CreativeLayoutType
  theme: CreativeVariationTheme
  headline: string
  subheadline: string
  problem: string
  solution: string
  productExplanation: string
  whoItHelps: string
  whyBetter: string
  features: EnterpriseFeatureHighlight[]
  benefits: string[]
  businessOutcome: string
  kpis: { label: string; value: string }[]
  website: string
  contact: string
  cta: string
  ctaSecondary?: string
  brandLabel: string
}

export type CreativeApprovalEntry = {
  id: string
  status: CreativeStatus
  note: string
  createdAt: string
}

export type VyronCreative = {
  id: string
  clientId?: string
  clientName: string
  productName: string
  campaignGoal: string
  platform: CreativePlatform
  audience: string
  offer: string
  headline: string
  cta: string
  visualStyle: CreativeVisualStyle
  colourDirection: string
  notes: string
  version: number
  parentId?: string
  status: CreativeStatus
  imagePrompt: string
  visualDirection: string
  feedbackNotes: string
  approvalHistory: CreativeApprovalEntry[]
  actionId?: string
  /** Full enterprise campaign composition — poster-grade marketing creative */
  campaignSpec?: EnterpriseCampaignSpec
  createdAt: string
  updatedAt: string
}

export type CreativeBuilderInput = {
  clientId?: string
  clientName: string
  productName: string
  campaignGoal: string
  platform: CreativePlatform
  audience: string
  offer: string
  headline: string
  cta: string
  visualStyle: CreativeVisualStyle
  colourDirection: string
  notes: string
  layout?: CreativeLayoutType
  variationTheme?: CreativeVariationTheme
  website?: string
  contact?: string
  actionId?: string
}

export type UploadedCreativeStatus = 'Pending Review' | 'Approved' | 'Needs Revision' | 'Rejected'

export type CreativeRevisionNotes = {
  whatMustChange?: string
  toneChanges?: string
  colourChanges?: string
  ctaChanges?: string
  platformNotes?: string
}

/** ChatGPT-generated image creative uploaded for approval workflow */
export type VyronUploadedCreative = {
  id: string
  clientId: string
  clientName: string
  platform: string
  campaignGoal: string
  variationName: string
  imageUrl: string
  storagePath?: string
  status: UploadedCreativeStatus
  isFinalCampaignCreative: boolean
  caption: string
  cta: string
  chatgptNotes: string
  revisionNotes: CreativeRevisionNotes
  revisionPrompt: string
  createdAt: string
  updatedAt: string
}

export type VyronStore = {
  settings: VyronSettings
  clients: VyronClient[]
  keywords: VyronKeyword[]
  rankings: VyronRanking[]
  competitors: VyronCompetitor[]
  contentTasks: VyronContentTask[]
  campaigns: VyronCampaign[]
  actionQueue: VyronActionQueueItem[]
  reports: VyronReport[]
  advertConcepts: VyronAdvertConcept[]
  googleAdsPlans: VyronGoogleAdsPlan[]
  marketingMaterials: VyronMarketingMaterial[]
  creatives: VyronCreative[]
  uploadedCreatives: VyronUploadedCreative[]
}
