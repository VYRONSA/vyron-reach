import type { VyronClient, VyronKeyword, VyronSettings } from '@/lib/vyronStore/types'

export type DirectorMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export type DirectorThread = {
  clientId: string | null
  messages: DirectorMessage[]
  updatedAt: string
}

export type MarketingDirectorContext = {
  client: VyronClient | null
  settings: VyronSettings
  keywords: VyronKeyword[]
  services: string[]
  campaignGoal: string
  brandStyle: string
}

export type MarketingDirectorRequest = {
  message: string
  history: DirectorMessage[]
  context: MarketingDirectorContext
}

export type MarketingDirectorResponse = {
  reply: string
  source: 'openai' | 'local'
}
