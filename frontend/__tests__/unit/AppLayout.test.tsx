import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppLayout } from '../../src/components/AppLayout'
import * as AuthContext from '../../src/contexts/AuthContext'
import * as TanstackRouter from '@tanstack/react-router'

// Mock the router
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Main Content</div>,
    Link: ({ children, to, className, 'data-tutorial': dataTutorial, 'aria-current': ariaCurrent }: any) => (
      <a href={to} className={className} data-tutorial={dataTutorial} aria-current={ariaCurrent}>
        {children}
      </a>
    ),
    useLocation: vi.fn(),
  }
})

// Mock ChatWidget and TutorialOverlay
vi.mock('../../src/components/ChatWidget', () => ({
  ChatWidget: () => <div data-testid="chat-widget">Chat Widget</div>
}))

vi.mock('../../src/components/TutorialOverlay', () => ({
  TutorialOverlay: () => <div data-testid="tutorial-overlay">Tutorial Overlay</div>
}))

describe('AppLayout', () => {
  const mockLogout = vi.fn()
  const mockUser = {
    id: 1,
    username: 'testuser'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default auth context mock
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      isAuthenticated: true,
      isLoading: false,
      isLocked: false,
      login: vi.fn(),
      unlock: vi.fn(),
      setPin: vi.fn(),
    } as any)

    // Default location mock
    vi.mocked(TanstackRouter.useLocation).mockReturnValue({
      pathname: '/app',
      search: {},
      hash: '',
      href: '/app',
      state: {},
    } as any)
  })

  describe('Rendering', () => {
    it('should render the app layout with all navigation items', () => {
      render(<AppLayout />)

      expect(screen.getByText('Task Line')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('List')).toBeInTheDocument()
      expect(screen.getByText('Board')).toBeInTheDocument()
      expect(screen.getByText('Calendar')).toBeInTheDocument()
      expect(screen.getByText('Review')).toBeInTheDocument()
      expect(screen.getByText('Timer')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('should render user information', () => {
      render(<AppLayout />)

      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    it('should render default username when user has no username', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: { id: 1 },
        logout: mockLogout,
        isAuthenticated: true,
        isLoading: false,
        isLocked: false,
      } as any)

      render(<AppLayout />)

      expect(screen.getByText('User')).toBeInTheDocument()
    })

    it('should render outlet for nested routes', () => {
      render(<AppLayout />)

      expect(screen.getByTestId('outlet')).toBeInTheDocument()
      expect(screen.getByText('Main Content')).toBeInTheDocument()
    })

    it('should render chat widget', () => {
      render(<AppLayout />)

      expect(screen.getByTestId('chat-widget')).toBeInTheDocument()
    })

    it('should render tutorial overlay', () => {
      render(<AppLayout />)

      expect(screen.getByTestId('tutorial-overlay')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should highlight active navigation item', () => {
      vi.mocked(TanstackRouter.useLocation).mockReturnValue({
        pathname: '/app/board',
        search: {},
        hash: '',
        href: '/app/board',
        state: {},
      } as any)

      render(<AppLayout />)

      const boardLink = screen.getByText('Board').closest('a')
      expect(boardLink).toHaveClass('bg-purple-100')
      expect(boardLink).toHaveAttribute('aria-current', 'page')
    })

    it('should not highlight inactive navigation items', () => {
      vi.mocked(TanstackRouter.useLocation).mockReturnValue({
        pathname: '/app/board',
        search: {},
        hash: '',
        href: '/app/board',
        state: {},
      } as any)

      render(<AppLayout />)

      const listLink = screen.getByText('List').closest('a')
      expect(listLink).not.toHaveClass('bg-purple-100')
      expect(listLink).not.toHaveAttribute('aria-current')
    })

    it('should have correct href for all navigation items', () => {
      render(<AppLayout />)

      expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/app')
      expect(screen.getByText('List').closest('a')).toHaveAttribute('href', '/app/list')
      expect(screen.getByText('Board').closest('a')).toHaveAttribute('href', '/app/board')
      expect(screen.getByText('Calendar').closest('a')).toHaveAttribute('href', '/app/calendar')
      expect(screen.getByText('Review').closest('a')).toHaveAttribute('href', '/app/review')
      expect(screen.getByText('Timer').closest('a')).toHaveAttribute('href', '/app/timer')
      expect(screen.getByText('Settings').closest('a')).toHaveAttribute('href', '/app/settings')
    })

    it('should have tutorial data attributes for navigation items', () => {
      render(<AppLayout />)

      expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('data-tutorial', 'nav-link-dashboard')
      expect(screen.getByText('List').closest('a')).toHaveAttribute('data-tutorial', 'nav-link-list')
      expect(screen.getByText('Board').closest('a')).toHaveAttribute('data-tutorial', 'nav-link-board')
      expect(screen.getByText('Calendar').closest('a')).toHaveAttribute('data-tutorial', 'nav-link-calendar')
      expect(screen.getByText('Review').closest('a')).toHaveAttribute('data-tutorial', 'nav-link-review')
      expect(screen.getByText('Timer').closest('a')).toHaveAttribute('data-tutorial', 'nav-link-timer')
      expect(screen.getByText('Settings').closest('a')).toHaveAttribute('data-tutorial', 'nav-link-settings')
    })
  })

  describe('Logout Functionality', () => {
    it('should call logout when logout button is clicked', async () => {
      const user = userEvent.setup()
      render(<AppLayout />)

      const logoutButton = screen.getByRole('button', { name: /logout from your account/i })
      await user.click(logoutButton)

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle logout errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockError = new Error('Logout failed')
      mockLogout.mockRejectedValueOnce(mockError)

      const user = userEvent.setup()
      render(<AppLayout />)

      const logoutButton = screen.getByRole('button', { name: /logout from your account/i })
      await user.click(logoutButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Logout failed:', mockError)
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Accessibility', () => {
    it('should have skip navigation links', () => {
      render(<AppLayout />)

      const skipLinks = screen.getAllByText(/skip to/i)
      expect(skipLinks.length).toBeGreaterThan(0)
      expect(screen.getByText('Skip to main content')).toBeInTheDocument()
      expect(screen.getByText('Skip to navigation')).toBeInTheDocument()
    })

    it('should have proper ARIA labels', () => {
      render(<AppLayout />)

      expect(screen.getByRole('complementary', { name: 'Main navigation' })).toBeInTheDocument()
      expect(screen.getByRole('navigation', { name: 'Task management views' })).toBeInTheDocument()
      expect(screen.getByRole('main', { name: 'Task management content' })).toBeInTheDocument()
    })

    it('should have accessible navigation structure', () => {
      render(<AppLayout />)

      const navigation = screen.getByRole('navigation', { name: 'Task management views' })
      expect(navigation).toBeInTheDocument()
      expect(navigation).toHaveAttribute('id', 'navigation')
    })

    it('should have aria-hidden on decorative icons', () => {
      render(<AppLayout />)

      const icons = document.querySelectorAll('[aria-hidden="true"]')
      expect(icons.length).toBeGreaterThan(0)
    })
  })

  describe('Layout Structure', () => {
    it('should have fixed sidebar', () => {
      render(<AppLayout />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('fixed')
      expect(sidebar).toHaveClass('inset-y-0')
      expect(sidebar).toHaveClass('left-0')
    })

    it('should have main content area with proper padding', () => {
      render(<AppLayout />)

      const mainContent = screen.getByRole('main')
      expect(mainContent.parentElement).toHaveClass('pl-64')
    })

    it('should render user section with user info and logout', () => {
      render(<AppLayout />)

      const userSection = screen.getByLabelText('User account')
      expect(userSection).toBeInTheDocument()
      expect(userSection).toContainElement(screen.getByText('testuser'))
      expect(userSection).toContainElement(screen.getByRole('button', { name: /logout/i }))
    })
  })
})
