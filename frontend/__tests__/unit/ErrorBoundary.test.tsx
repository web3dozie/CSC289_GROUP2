import { render, screen, fireEvent } from '../test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ErrorBoundary from '../../src/components/ErrorBoundary'
import { ApiError } from '../../src/lib/api'

// Component that throws an error
const ThrowError = ({ error }: { error: Error }) => {
  throw error
}

// Component that works normally
const WorkingComponent = () => <div>Working Component</div>

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console errors in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Normal Operation', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText('Working Component')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should catch errors and display error fallback', () => {
      const error = new Error('Test error')

      render(
        <ErrorBoundary>
          <ThrowError error={error} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument()
    })

    it('should display network error message for network errors', () => {
      const error = new ApiError(0, 'Network error')

      render(
        <ErrorBoundary>
          <ThrowError error={error} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/connection error/i)).toBeInTheDocument()
      const internetMessages = screen.queryAllByText(/check your internet connection/i)
      expect(internetMessages.length).toBeGreaterThan(0)
    })

    it('should display auth error message for 401 errors', () => {
      const error = new ApiError(401, 'Unauthorized')

      render(
        <ErrorBoundary>
          <ThrowError error={error} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/session may have expired/i)).toBeInTheDocument()
    })

    it('should display Try again button', () => {
      const error = new Error('Test error')

      render(
        <ErrorBoundary>
          <ThrowError error={error} />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('should display Go home button for non-network errors', () => {
      const error = new Error('Test error')

      render(
        <ErrorBoundary>
          <ThrowError error={error} />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument()
    })

    it('should display Reload page button for network errors', () => {
      const error = new ApiError(0, 'Network error')

      render(
        <ErrorBoundary>
          <ThrowError error={error} />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
    })

    it('should display Reload page button for server errors', () => {
      const error = new ApiError(500, 'Server error')

      render(
        <ErrorBoundary>
          <ThrowError error={error} />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
    })
  })

  describe('Error Reset', () => {
    it('should reset error state when Try again is clicked', () => {
      const error = new Error('Test error')
      let shouldThrow = true

      const ConditionalThrow = () => {
        if (shouldThrow) {
          throw error
        }
        return <div>Recovered</div>
      }

      render(
        <ErrorBoundary>
          <ConditionalThrow />
        </ErrorBoundary>
      )

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()

      shouldThrow = false
      const tryAgainButton = screen.getByRole('button', { name: /try again/i })
      fireEvent.click(tryAgainButton)

      expect(screen.getByText('Recovered')).toBeInTheDocument()
    })
  })

  describe('API Error Details', () => {
    it('should display additional error details for API errors with details', () => {
      const error = new ApiError(400, 'Validation error', {
        field: 'email',
        message: 'Invalid email format',
      })

      render(
        <ErrorBoundary>
          <ThrowError error={error} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/additional information/i)).toBeInTheDocument()
      expect(screen.getByText(/field:/i)).toBeInTheDocument()
      const emailTexts = screen.queryAllByText(/email/i)
      expect(emailTexts.length).toBeGreaterThan(0)
    })

    it('should not display details section when no details are available', () => {
      const error = new ApiError(400, 'Simple error')

      render(
        <ErrorBoundary>
          <ThrowError error={error} />
        </ErrorBoundary>
      )

      expect(screen.queryByText(/additional information/i)).not.toBeInTheDocument()
    })
  })

  describe('Custom Fallback', () => {
    it('should use custom fallback component when provided', () => {
      const CustomFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
        <div>
          <h1>Custom Error UI</h1>
          <p>{error.message}</p>
          <button onClick={resetError}>Reset</button>
        </div>
      )

      const error = new Error('Custom error')

      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError error={error} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom Error UI')).toBeInTheDocument()
      expect(screen.getByText('Custom error')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should navigate to home when Go home is clicked', () => {
      const error = new Error('Test error')

      // Mock window.location.href
      delete (window as any).location
      window.location = { href: '' } as any

      render(
        <ErrorBoundary>
          <ThrowError error={error} />
        </ErrorBoundary>
      )

      const goHomeButton = screen.getByRole('button', { name: /go home/i })
      fireEvent.click(goHomeButton)

      expect(window.location.href).toBe('/')
    })

    it('should reload page when Reload page is clicked', () => {
      const error = new ApiError(0, 'Network error')

      // Mock window.location.reload
      const reloadMock = vi.fn()
      delete (window as any).location
      window.location = { reload: reloadMock } as any

      render(
        <ErrorBoundary>
          <ThrowError error={error} />
        </ErrorBoundary>
      )

      const reloadButton = screen.getByRole('button', { name: /reload page/i })
      fireEvent.click(reloadButton)

      expect(reloadMock).toHaveBeenCalled()
    })
  })
})
