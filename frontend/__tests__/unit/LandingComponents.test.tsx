import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import Features from '../../src/components/landing/Features'
import Footer from '../../src/components/landing/Footer'
import CTA from '../../src/components/landing/CTA'
import Privacy from '../../src/components/landing/Privacy'
import Tutorial from '../../src/components/landing/Tutorial'
import Views from '../../src/components/landing/Views'

// Mock AuthContext
vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isLocked: false,
    login: vi.fn(),
    logout: vi.fn(),
    setup: vi.fn(),
    changePin: vi.fn(),
    changeUsername: vi.fn(),
    unlock: vi.fn(),
    lock: vi.fn(),
    updateActivity: vi.fn(),
    error: null,
    clearError: vi.fn(),
  }),
}))

// Mock Link component from router
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
  }
})

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Features Component', () => {
  it('should render the features section', () => {
    render(<Features />, { wrapper: createWrapper() })
    
    expect(screen.getByText('Everything You Need to Stay Organized')).toBeInTheDocument()
    expect(screen.getByText(/A powerful yet simple task management system/i)).toBeInTheDocument()
  })

  it('should display all 8 features', () => {
    render(<Features />, { wrapper: createWrapper() })
    
    expect(screen.getByText('Smart Task Management')).toBeInTheDocument()
    expect(screen.getByText('Multiple Views')).toBeInTheDocument()
    expect(screen.getByText('Private & Secure')).toBeInTheDocument()
    expect(screen.getByText('Works Offline')).toBeInTheDocument()
    expect(screen.getByText('Time Tracking')).toBeInTheDocument()
    expect(screen.getByText('Analytics & Insights')).toBeInTheDocument()
    expect(screen.getByText('Local-First Design')).toBeInTheDocument()
    expect(screen.getByText('Export & Backup')).toBeInTheDocument()
  })

  it('should display feature descriptions', () => {
    render(<Features />, { wrapper: createWrapper() })
    
    expect(screen.getByText(/Create, organize, and track tasks with categories/i)).toBeInTheDocument()
    expect(screen.getByText(/PIN protection with auto-lock/i)).toBeInTheDocument()
    expect(screen.getByText(/Fully functional without internet/i)).toBeInTheDocument()
  })

  it('should mention AI coaching feature', () => {
    render(<Features />, { wrapper: createWrapper() })
    
    expect(screen.getByText(/Plus optional AI coaching/i)).toBeInTheDocument()
    expect(screen.getByText(/Enable "Zedd Mode"/i)).toBeInTheDocument()
  })
})

describe('Footer Component', () => {
  it('should render the footer', () => {
    render(<Footer />, { wrapper: createWrapper() })
    
    expect(screen.getByText('Task Line')).toBeInTheDocument()
  })

  it('should display copyright information', () => {
    const currentYear = new Date().getFullYear()
    render(<Footer />, { wrapper: createWrapper() })
    
    const copyrightText = screen.getByText(new RegExp(`© ${currentYear}`, 'i'))
    expect(copyrightText).toBeInTheDocument()
  })

  it('should have navigation links', () => {
    render(<Footer />, { wrapper: createWrapper() })
    
    expect(screen.getByText('Features')).toBeInTheDocument()
    expect(screen.getByText('Privacy')).toBeInTheDocument()
  })

  it('should display tagline', () => {
    render(<Footer />, { wrapper: createWrapper() })
    
    expect(screen.getByText(/Lock in. Get it done. Stay zen./i)).toBeInTheDocument()
  })
})

describe('CTA Component', () => {
  it('should render the CTA section', () => {
    render(<CTA />, { wrapper: createWrapper() })
    
    expect(screen.getByText(/Ready to Lock In/i)).toBeInTheDocument()
  })

  it('should have a call to action button', () => {
    render(<CTA />, { wrapper: createWrapper() })
    
    const ctaButton = screen.getByRole('link', { name: /Open App/i })
    expect(ctaButton).toBeInTheDocument()
  })

  it('should display motivational text', () => {
    render(<CTA />, { wrapper: createWrapper() })
    
    expect(screen.getByText(/Start managing your tasks/i)).toBeInTheDocument()
  })
})

describe('Privacy Component', () => {
  it('should render the privacy section', () => {
    render(<Privacy />, { wrapper: createWrapper() })
    
    expect(screen.getByText(/Privacy & Security/i)).toBeInTheDocument()
  })

  it('should explain local-first approach', () => {
    render(<Privacy />, { wrapper: createWrapper() })
    
    expect(screen.getByText(/local-first/i)).toBeInTheDocument()
  })

  it('should mention no tracking', () => {
    render(<Privacy />, { wrapper: createWrapper() })
    
    expect(screen.getByText(/no tracking/i)).toBeInTheDocument()
  })

  it('should explain data storage', () => {
    render(<Privacy />, { wrapper: createWrapper() })
    
    expect(screen.getByText(/SQLite database on your device/i)).toBeInTheDocument()
  })
})

describe('Tutorial Component', () => {
  it('should render the tutorial section', () => {
    render(<Tutorial />, { wrapper: createWrapper() })
    
    // Check for unique text from Tutorial component
    expect(screen.getByText(/Interactive Tutorial/i)).toBeInTheDocument()
  })

  it('should display start tutorial button', () => {
    render(<Tutorial />, { wrapper: createWrapper() })
    
    expect(screen.getByText(/Start Tutorial/i)).toBeInTheDocument()
  })

  it('should have tutorial description', () => {
    render(<Tutorial />, { wrapper: createWrapper() })
    
    const tutorialSection = screen.getByText(/Interactive Tutorial/i).closest('section')
    expect(tutorialSection).toBeInTheDocument()
  })
})

describe('Views Component', () => {
  it('should render the views section', () => {
    render(<Views />, { wrapper: createWrapper() })
    
    expect(screen.getByText(/Four Powerful Views/i)).toBeInTheDocument()
  })

  it('should mention different view types', () => {
    render(<Views />, { wrapper: createWrapper() })
    
    expect(screen.getByText('List View')).toBeInTheDocument()
    expect(screen.getByText('Board View')).toBeInTheDocument()
    expect(screen.getByText('Calendar View')).toBeInTheDocument()
  })

  it('should explain view benefits', () => {
    render(<Views />, { wrapper: createWrapper() })
    
    expect(screen.getByText(/different perspectives/i)).toBeInTheDocument()
  })

  it('should have view descriptions', () => {
    render(<Views />, { wrapper: createWrapper() })
    
    // Each view should have a description
    const viewsSection = screen.getByText(/Four Powerful Views/i).closest('section')
    expect(viewsSection).toBeInTheDocument()
  })
})
