export type Lead = {
  id: string
  name: string
  email: string
  company: string
  status: string
  created_at: string
}

export type Campaign = {
  id: string
  name: string
  budget: number
  status: string
  created_at: string
}

export type Task = {
  id: string
  title: string
  status: string
  due_date: string | null
  created_at: string
}

export type ContentItem = {
  id: string
  title: string
  platform: string
  status: string
  publish_date: string | null
  content_type: string | null
  notes: string | null
  created_at: string
}

export type DemoGeneratorStatus = 'idle' | 'running' | 'success' | 'error'