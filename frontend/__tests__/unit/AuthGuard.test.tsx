import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthGuard } from '../../src/components/AuthGuard'
import * as AuthContext from '../../src/contexts/AuthContext'

// Mock the router Navigate component
vi.mock('@tanstack/react-router', () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">Redirecting to {to}</div>
}))

// Mock LockScreen component
vi.mock('../../src/components/LockScreen', () => ({
  LockScreen: () => <div data-testid="lock-screen">Lock Screen</div>
}))

describe('AuthGuard', () => {
  const mockUseAuth = vi.spyOn(AuthContext, 'useAuth')

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading spinner when authentication is loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        isLocked: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        unlock: vi.fn(),
        setPin: vi.fn(),
      } as any)

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  describe('Authentication Required (requireAuth=true)', () => {
    it('should redirect to login when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        isLocked: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        unlock: vi.fn(),
        setPin: vi.fn(),
      } as any)

      render(
        <AuthGuard requireAuth={true}>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByTestId('navigate')).toBeInTheDocument()
      expect(screen.getByText('Redirecting to /login')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should show lock screen when authenticated but locked', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isLocked: true,
        user: { id: 1, username: 'testuser' },
        login: vi.fn(),
        logout: vi.fn(),
        unlock: vi.fn(),
        setPin: vi.fn(),
      } as any)

      render(
        <AuthGuard requireAuth={true}>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByTestId('lock-screen')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should render children when authenticated and not locked', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isLocked: false,
        user: { id: 1, username: 'testuser' },
        login: vi.fn(),
        logout: vi.fn(),
        unlock: vi.fn(),
        setPin: vi.fn(),
      } as any)

      render(
        <AuthGuard requireAuth={true}>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
      expect(screen.queryByTestId('lock-screen')).not.toBeInTheDocument()
    })
  })

  describe('Authentication Not Required (requireAuth=false)', () => {
    it('should redirect to app when authenticated on public page', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isLocked: false,
        user: { id: 1, username: 'testuser' },
        login: vi.fn(),
        logout: vi.fn(),
        unlock: vi.fn(),
        setPin: vi.fn(),
      } as any)

      render(
        <AuthGuard requireAuth={false}>
          <div>Public Content</div>
        </AuthGuard>
      )

      expect(screen.getByTestId('navigate')).toBeInTheDocument()
      expect(screen.getByText('Redirecting to /app')).toBeInTheDocument()
      expect(screen.queryByText('Public Content')).not.toBeInTheDocument()
    })

    it('should render children when not authenticated on public page', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        isLocked: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        unlock: vi.fn(),
        setPin: vi.fn(),
      } as any)

      render(
        <AuthGuard requireAuth={false}>
          <div>Public Content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Public Content')).toBeInTheDocument()
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
    })
  })

  describe('Default Behavior', () => {
    it('should default to requireAuth=true when not specified', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        isLocked: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        unlock: vi.fn(),
        setPin: vi.fn(),
      } as any)

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      // Should redirect to login since requireAuth defaults to true
      expect(screen.getByTestId('navigate')).toBeInTheDocument()
      expect(screen.getByText('Redirecting to /login')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle loading state taking precedence over other states', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: true, // Loading takes precedence
        isLocked: true,
        user: { id: 1, username: 'testuser' },
        login: vi.fn(),
        logout: vi.fn(),
        unlock: vi.fn(),
        setPin: vi.fn(),
      } as any)

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      // Should show loading spinner, not lock screen
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
      expect(screen.queryByTestId('lock-screen')).not.toBeInTheDocument()
    })

    it('should render multiple children correctly', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isLocked: false,
        user: { id: 1, username: 'testuser' },
        login: vi.fn(),
        logout: vi.fn(),
        unlock: vi.fn(),
        setPin: vi.fn(),
      } as any)

      render(
        <AuthGuard requireAuth={true}>
          <div>First Child</div>
          <div>Second Child</div>
          <div>Third Child</div>
        </AuthGuard>
      )

      expect(screen.getByText('First Child')).toBeInTheDocument()
      expect(screen.getByText('Second Child')).toBeInTheDocument()
      expect(screen.getByText('Third Child')).toBeInTheDocument()
    })
  })
})
