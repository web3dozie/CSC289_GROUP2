import type { ChatResponse, ChatHistory } from '../types/chat'

const API_BASE = import.meta.env.VITE_API_URL || ''

export const chatService = {
  async sendMessage(message: string): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE}/api/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send message')
    }
    return response.json()
  },

  async getHistory(): Promise<ChatHistory> {
    const response = await fetch(`${API_BASE}/api/chat/history`, {
      credentials: 'include'
    })
    if (!response.ok) throw new Error('Failed to fetch history')
    return response.json()
  },

  async clearHistory(): Promise<void> {
    const response = await fetch(`${API_BASE}/api/chat/clear`, {
      method: 'POST',
      credentials: 'include'
    })
    if (!response.ok) throw new Error('Failed to clear history')
  }
}
