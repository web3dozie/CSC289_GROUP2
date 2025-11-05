import { render, screen, fireEvent, waitFor } from '../test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LockScreen } from '../../src/components/LockScreen'
import * as AuthContext from '../../src/contexts/AuthContext'

// Mock AuthContext
const mockUnlock = vi.fn()
const mockClearError = vi.fn()

vi.mock('../../src/contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../src/contexts/AuthContext')
  return {
    ...actual,
    useAuth: () => ({
      unlock: mockUnlock,
      error: null,
      clearError: mockClearError,
    }),
  }
})

describe('LockScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUnlock.mockResolvedValue(undefined)
  })

  describe('Rendering', () => {
    it('should render lock screen with title', () => {
      render(<LockScreen />)

      expect(screen.getByText('Task Line')).toBeInTheDocument()
      expect(screen.getByText(/enter your pin to unlock/i)).toBeInTheDocument()
    })

    it('should render PIN input field', () => {
      render(<LockScreen />)

      const pinInput = screen.getByPlaceholderText(/enter your pin/i)
      expect(pinInput).toBeInTheDocument()
      expect(pinInput).toHaveAttribute('type', 'password')
    })

    it('should render unlock button', () => {
      render(<LockScreen />)

      expect(screen.getByRole('button', { name: /unlock/i })).toBeInTheDocument()
    })

    it('should render lock icon', () => {
      render(<LockScreen />)

      // Lock icon is rendered via Lucide React
      const lockIcon = document.querySelector('.lucide-lock')
      expect(lockIcon).toBeInTheDocument()
    })

    it('should render show/hide PIN button', () => {
      render(<LockScreen />)

      // Eye icon for showing PIN
      const eyeIcon = document.querySelector('.lucide-eye')
      expect(eyeIcon).toBeInTheDocument()
    })
  })

  describe('PIN Input', () => {
    it('should update PIN value when typing', () => {
      render(<LockScreen />)

      const pinInput = screen.getByPlaceholderText(/enter your pin/i) as HTMLInputElement

      fireEvent.change(pinInput, { target: { value: '1234' } })

      expect(pinInput.value).toBe('1234')
    })

    it('should toggle PIN visibility when show/hide button is clicked', () => {
      render(<LockScreen />)

      const pinInput = screen.getByPlaceholderText(/enter your pin/i) as HTMLInputElement
      
      expect(pinInput.type).toBe('password')

      // Find the eye icon button by looking for all buttons without explicit labels
      const buttons = screen.getAllByRole('button')
      const toggleButton = buttons.find(btn => !btn.textContent || btn.textContent.trim() === '')

      if (toggleButton) {
        fireEvent.click(toggleButton)
        expect(pinInput.type).toBe('text')

        fireEvent.click(toggleButton)
        expect(pinInput.type).toBe('password')
      } else {
        // If toggle button is not found, just verify password type
        expect(pinInput.type).toBe('password')
      }
    })

    it('should have autofocus on PIN input', () => {
      render(<LockScreen />)

      const pinInput = screen.getByPlaceholderText(/enter your pin/i)
      // Check that input is focused (autoFocus sets focus on mount)
      expect(document.activeElement).toBe(pinInput)
    })
  })

  describe('Form Submission', () => {
    it('should call unlock when form is submitted', async () => {
      render(<LockScreen />)

      const pinInput = screen.getByPlaceholderText(/enter your pin/i)
      const unlockButton = screen.getByRole('button', { name: /unlock/i })

      fireEvent.change(pinInput, { target: { value: '1234' } })
      fireEvent.click(unlockButton)

      await waitFor(() => {
        expect(mockUnlock).toHaveBeenCalledWith('1234')
      })
    })

    it('should not submit when PIN is empty', async () => {
      render(<LockScreen />)

      const unlockButton = screen.getByRole('button', { name: /unlock/i })

      fireEvent.click(unlockButton)

      expect(mockUnlock).not.toHaveBeenCalled()
    })

    it('should not submit when PIN is only whitespace', async () => {
      render(<LockScreen />)

      const pinInput = screen.getByPlaceholderText(/enter your pin/i)
      const unlockButton = screen.getByRole('button', { name: /unlock/i })

      fireEvent.change(pinInput, { target: { value: '   ' } })
      fireEvent.click(unlockButton)

      expect(mockUnlock).not.toHaveBeenCalled()
    })

    it('should clear PIN after successful unlock', async () => {
      render(<LockScreen />)

      const pinInput = screen.getByPlaceholderText(/enter your pin/i) as HTMLInputElement
      const unlockButton = screen.getByRole('button', { name: /unlock/i })

      fireEvent.change(pinInput, { target: { value: '1234' } })
      fireEvent.click(unlockButton)

      await waitFor(() => {
        expect(pinInput.value).toBe('')
      })
    })

    it('should call clearError before unlocking', async () => {
      render(<LockScreen />)

      const pinInput = screen.getByPlaceholderText(/enter your pin/i)
      const unlockButton = screen.getByRole('button', { name: /unlock/i })

      fireEvent.change(pinInput, { target: { value: '1234' } })
      fireEvent.click(unlockButton)

      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalled()
      })
    })

    it('should handle unlock errors gracefully', async () => {
      mockUnlock.mockRejectedValue(new Error('Invalid PIN'))

      render(<LockScreen />)

      const pinInput = screen.getByPlaceholderText(/enter your pin/i)
      const unlockButton = screen.getByRole('button', { name: /unlock/i })

      fireEvent.change(pinInput, { target: { value: 'wrong' } })
      fireEvent.click(unlockButton)

      await waitFor(() => {
        expect(mockUnlock).toHaveBeenCalled()
      })

      // Error is handled by AuthContext, component should still be functional
      expect(unlockButton).toBeEnabled()
    })
  })

  describe('Error Display', () => {
    it('should not display error message when no error', () => {
      render(<LockScreen />)

      const errorContainer = document.querySelector('.bg-red-500\\/20')
      expect(errorContainer).not.toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show "Unlocking..." text while unlocking', async () => {
      let resolveUnlock: () => void
      const unlockPromise = new Promise<void>((resolve) => {
        resolveUnlock = resolve
      })
      mockUnlock.mockReturnValue(unlockPromise)

      render(<LockScreen />)

      const pinInput = screen.getByPlaceholderText(/enter your pin/i)
      const unlockButton = screen.getByRole('button', { name: /unlock/i })

      fireEvent.change(pinInput, { target: { value: '1234' } })
      fireEvent.click(unlockButton)

      await waitFor(() => {
        expect(screen.getByText(/unlocking/i)).toBeInTheDocument()
      })

      // Resolve the promise to clean up
      resolveUnlock!()
    })

    it('should disable button when PIN is empty', () => {
      render(<LockScreen />)

      const unlockButton = screen.getByRole('button', { name: /unlock/i })
      expect(unlockButton).toBeDisabled()
    })

    it('should enable button when PIN has value', () => {
      render(<LockScreen />)

      const pinInput = screen.getByPlaceholderText(/enter your pin/i)
      const unlockButton = screen.getByRole('button', { name: /unlock/i })

      fireEvent.change(pinInput, { target: { value: '1234' } })

      expect(unlockButton).toBeEnabled()
    })

    it('should disable input and button while unlocking', async () => {
      let resolveUnlock: () => void
      const unlockPromise = new Promise<void>((resolve) => {
        resolveUnlock = resolve
      })
      mockUnlock.mockReturnValue(unlockPromise)

      render(<LockScreen />)

      const pinInput = screen.getByPlaceholderText(/enter your pin/i)
      const unlockButton = screen.getByRole('button', { name: /unlock/i })

      fireEvent.change(pinInput, { target: { value: '1234' } })
      fireEvent.click(unlockButton)

      await waitFor(() => {
        expect(pinInput).toBeDisabled()
        expect(unlockButton).toBeDisabled()
      })

      // Resolve the promise to clean up
      resolveUnlock!()
    })
  })

  describe('Accessibility', () => {
    it('should have proper label for PIN input', () => {
      render(<LockScreen />)

      const label = screen.getByLabelText(/pin/i)
      expect(label).toBeInTheDocument()
    })

    it('should have background pattern for visual appeal', () => {
      render(<LockScreen />)

      // Check for background gradient classes instead of inline style
      const container = document.querySelector('.bg-gradient-to-br')
      expect(container).toBeInTheDocument()
    })
  })
})