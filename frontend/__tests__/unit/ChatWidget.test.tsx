import { render, screen, fireEvent, waitFor } from '../test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChatWidget } from '../../src/components/ChatWidget'
import { chatService } from '../../src/services/chatService'

// Mock chat service
vi.mock('../../src/services/chatService', () => ({
  chatService: {
    getHistory: vi.fn(),
    sendMessage: vi.fn(),
    clearHistory: vi.fn(),
  },
}))

describe('ChatWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default mocks
    vi.mocked(chatService.getHistory).mockResolvedValue({ messages: [] })
    vi.mocked(chatService.sendMessage).mockResolvedValue({
      conversation_id: 1,
      response: 'AI response',
      actions_executed: [],
    })
    vi.mocked(chatService.clearHistory).mockResolvedValue(undefined)
  })

  describe('Rendering', () => {
    it('should render floating chat button when closed', () => {
      render(<ChatWidget />)

      const button = screen.getByLabelText(/open ai chat/i)
      expect(button).toBeInTheDocument()
    })

    it('should not render chat modal when closed', () => {
      render(<ChatWidget />)

      expect(screen.queryByText(/ai assistant/i)).not.toBeInTheDocument()
    })

    it('should render chat modal when opened', async () => {
      render(<ChatWidget />)

      const openButton = screen.getByLabelText(/open ai chat/i)
      fireEvent.click(openButton)

      await waitFor(() => {
        // Multiple "AI Assistant" texts exist (in modal header and aria-label), verify modal is open
        const assistantTexts = screen.queryAllByText(/ai assistant/i)
        expect(assistantTexts.length).toBeGreaterThan(0)
      })
    })

    it('should hide floating button when chat is open', async () => {
      render(<ChatWidget />)

      const openButton = screen.getByLabelText(/open ai chat/i)
      fireEvent.click(openButton)

      await waitFor(() => {
        expect(screen.queryByLabelText(/open ai chat/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Chat Functionality', () => {
    it('should load history when opened', async () => {
      const mockMessages = [
        {
          id: 1,
          role: 'user' as const,
          content: 'Hello',
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          role: 'assistant' as const,
          content: 'Hi there!',
          created_at: new Date().toISOString(),
        },
      ]

      vi.mocked(chatService.getHistory).mockResolvedValue({ messages: mockMessages })

      render(<ChatWidget />)

      const openButton = screen.getByLabelText(/open ai chat/i)
      fireEvent.click(openButton)

      await waitFor(() => {
        expect(chatService.getHistory).toHaveBeenCalled()
        expect(screen.getByText('Hello')).toBeInTheDocument()
        expect(screen.getByText('Hi there!')).toBeInTheDocument()
      })
    })

    it('should display empty state when no messages', async () => {
      render(<ChatWidget />)

      const openButton = screen.getByLabelText(/open ai chat/i)
      fireEvent.click(openButton)

      await waitFor(() => {
        expect(screen.getByText(/start a conversation/i)).toBeInTheDocument()
      })
    })

    it('should send message when form is submitted', async () => {
      render(<ChatWidget />)

      const openButton = screen.getByLabelText(/open ai chat/i)
      fireEvent.click(openButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/ask about your tasks/i)).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText(/ask about your tasks/i)
      const sendButton = screen.getByLabelText(/send message/i)

      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(chatService.sendMessage).toHaveBeenCalledWith('Test message')
      })
    })

    it('should send message on Enter key press', async () => {
      render(<ChatWidget />)

      const openButton = screen.getByLabelText(/open ai chat/i)
      fireEvent.click(openButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/ask about your tasks/i)).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText(/ask about your tasks/i)

      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })

      await waitFor(() => {
        expect(chatService.sendMessage).toHaveBeenCalledWith('Test message')
      })
    })

    it('should not send message on Shift+Enter', async () => {
      render(<ChatWidget />)

      const openButton = screen.getByLabelText(/open ai chat/i)
      fireEvent.click(openButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/ask about your tasks/i)).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText(/ask about your tasks/i)

      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13, shiftKey: true })

      expect(chatService.sendMessage).not.toHaveBeenCalled()
    })

    it('should display AI response after sending message', async () => {
      vi.mocked(chatService.sendMessage).mockResolvedValue({
        conversation_id: 1,
        response: 'This is the AI response',
        actions_executed: [],
      })

      render(<ChatWidget />)

      const openButton = screen.getByLabelText(/open ai chat/i)
      fireEvent.click(openButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/ask about your tasks/i)).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText(/ask about your tasks/i)
      const sendButton = screen.getByLabelText(/send message/i)

      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText('This is the AI response')).toBeInTheDocument()
      })
    })

    it('should clear input after sending message', async () => {
      render(<ChatWidget />)

      const openButton = screen.getByLabelText(/open ai chat/i)
      fireEvent.click(openButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/ask about your tasks/i)).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText(/ask about your tasks/i) as HTMLInputElement
      const sendButton = screen.getByLabelText(/send message/i)

      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(input.value).toBe('')
      })
    })

    it('should handle error when sending message fails', async () => {
      vi.mocked(chatService.sendMessage).mockRejectedValue(new Error('Network error'))

      render(<ChatWidget />)

      const openButton = screen.getByLabelText(/open ai chat/i)
      fireEvent.click(openButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/ask about your tasks/i)).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText(/ask about your tasks/i)
      const sendButton = screen.getByLabelText(/send message/i)

      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Clear History', () => {
    it('should clear chat history when clear button is clicked', async () => {
      const mockMessages = [
        {
          id: 1,
          role: 'user' as const,
          content: 'Hello',
          created_at: new Date().toISOString(),
        },
      ]

      vi.mocked(chatService.getHistory).mockResolvedValue({ messages: mockMessages })

      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

      render(<ChatWidget />)

      const openButton = screen.getByLabelText(/open ai chat/i)
      fireEvent.click(openButton)

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument()
      })

      const clearButton = screen.getByLabelText(/clear chat history/i)
      fireEvent.click(clearButton)

      await waitFor(() => {
        expect(chatService.clearHistory).toHaveBeenCalled()
        expect(screen.queryByText('Hello')).not.toBeInTheDocument()
      })

      confirmSpy.mockRestore()
    })

    it('should not clear history when user cancels confirmation', async () => {
      const mockMessages = [
        {
          id: 1,
          role: 'user' as const,
          content: 'Hello',
          created_at: new Date().toISOString(),
        },
      ]

      vi.mocked(chatService.getHistory).mockResolvedValue({ messages: mockMessages })

      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

      render(<ChatWidget />)

      const openButton = screen.getByLabelText(/open ai chat/i)
      fireEvent.click(openButton)

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument()
      })

      const clearButton = screen.getByLabelText(/clear chat history/i)
      fireEvent.click(clearButton)

      expect(chatService.clearHistory).not.toHaveBeenCalled()
      expect(screen.getByText('Hello')).toBeInTheDocument()

      confirmSpy.mockRestore()
    })
  })

  describe('UI Interactions', () => {
    it('should close chat modal when close button is clicked', async () => {
      render(<ChatWidget />)

      const openButton = screen.getByLabelText(/open ai chat/i)
      fireEvent.click(openButton)

      await waitFor(() => {
        const assistantTexts = screen.queryAllByText(/ai assistant/i)
        expect(assistantTexts.length).toBeGreaterThan(0)
      })

      const closeButton = screen.getByLabelText(/close chat/i)
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText(/ai assistant/i)).not.toBeInTheDocument()
      })
    })

    it('should disable input and send button while loading', async () => {
      // Make the API call hang
      let resolveMessage: (value: any) => void
      const messagePromise = new Promise((resolve) => {
        resolveMessage = resolve
      })
      vi.mocked(chatService.sendMessage).mockReturnValue(messagePromise as any)

      render(<ChatWidget />)

      const openButton = screen.getByLabelText(/open ai chat/i)
      fireEvent.click(openButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/ask about your tasks/i)).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText(/ask about your tasks/i)
      const sendButton = screen.getByLabelText(/send message/i)

      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(input).toBeDisabled()
        expect(sendButton).toBeDisabled()
      })

      // Resolve the promise to clean up
      resolveMessage!({ conversation_id: 1, response: 'Done', actions_executed: [] })
    })

    it('should show loading indicator while waiting for response', async () => {
      let resolveMessage: (value: any) => void
      const messagePromise = new Promise((resolve) => {
        resolveMessage = resolve
      })
      vi.mocked(chatService.sendMessage).mockReturnValue(messagePromise as any)

      render(<ChatWidget />)

      const openButton = screen.getByLabelText(/open ai chat/i)
      fireEvent.click(openButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/ask about your tasks/i)).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText(/ask about your tasks/i)
      const sendButton = screen.getByLabelText(/send message/i)

      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        const loader = document.querySelector('.animate-spin')
        expect(loader).toBeInTheDocument()
      })

      // Resolve the promise to clean up
      resolveMessage!({ conversation_id: 1, response: 'Done', actions_executed: [] })
    })
  })
})
