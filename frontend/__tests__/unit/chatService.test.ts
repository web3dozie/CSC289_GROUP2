import { describe, it, expect, beforeEach, vi } from 'vitest'
import { chatService } from '../../src/services/chatService'

describe('chatService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'AI response',
        timestamp: new Date().toISOString()
      }

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      }))

      const result = await chatService.sendMessage('Hello')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat/message'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ message: 'Hello' })
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should throw error when response is not ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Failed to send message' })
      }))

      await expect(chatService.sendMessage('Hello')).rejects.toThrow('Failed to send message')
    })

    it('should throw default error message when error is not provided', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({})
      }))

      await expect(chatService.sendMessage('Hello')).rejects.toThrow('Failed to send message')
    })
  })

  describe('getHistory', () => {
    it('should fetch chat history successfully', async () => {
      const mockHistory = {
        success: true,
        messages: [
          { id: 1, content: 'Hello', sender: 'user', timestamp: new Date().toISOString() },
          { id: 2, content: 'Hi there!', sender: 'ai', timestamp: new Date().toISOString() }
        ]
      }

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockHistory
      }))

      const result = await chatService.getHistory()

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat/history'),
        expect.objectContaining({
          credentials: 'include'
        })
      )
      expect(result).toEqual(mockHistory)
    })

    it('should throw error when fetch fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false
      }))

      await expect(chatService.getHistory()).rejects.toThrow('Failed to fetch history')
    })
  })

  describe('clearHistory', () => {
    it('should clear chat history successfully', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true
      }))

      await chatService.clearHistory()

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat/clear'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include'
        })
      )
    })

    it('should throw error when clear fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false
      }))

      await expect(chatService.clearHistory()).rejects.toThrow('Failed to clear history')
    })
  })
})
