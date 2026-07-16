import { readLocal, writeLocal } from './localStore'

export type AiAssistantStatus = 'active' | 'idle' | 'blocked'

export type AiAssistantEntry = {
  currentProject: string // project slug, or '' for none
  currentObjective: string
  lastSessionNotes: string
  nextAction: string
  status: AiAssistantStatus
  updatedAt: string
}

export type AiWorkspaceState = {
  claude: AiAssistantEntry
  chatgpt: AiAssistantEntry
}

const KEY = 'vyron-dev-ai-workspace-v1'

function emptyEntry(): AiAssistantEntry {
  return {
    currentProject: '',
    currentObjective: '',
    lastSessionNotes: '',
    nextAction: '',
    status: 'idle',
    updatedAt: new Date().toISOString(),
  }
}

export function getAiWorkspace(): AiWorkspaceState {
  return readLocal<AiWorkspaceState>(KEY, { claude: emptyEntry(), chatgpt: emptyEntry() })
}

export function saveAiAssistant(assistant: 'claude' | 'chatgpt', entry: Omit<AiAssistantEntry, 'updatedAt'>): void {
  const state = getAiWorkspace()
  state[assistant] = { ...entry, updatedAt: new Date().toISOString() }
  writeLocal(KEY, state)
}

export const AI_STATUS_LABEL: Record<AiAssistantStatus, string> = {
  active: 'Active',
  idle: 'Idle',
  blocked: 'Blocked',
}
