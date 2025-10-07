export interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ChatResponse {
  response: string
  conversation_id: number
  actions_executed?: Array<{
    action: string
    task_id?: number
  }>
}

export interface ChatHistory {
  messages: Message[]
}
