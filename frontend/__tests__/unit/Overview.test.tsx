import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Overview from '../../src/components/landing/Overview'

// Mock router
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>
  }
})

describe('Overview', () => {
  describe('Rendering', () => {
    it('should render the overview page', () => {
      render(<Overview />)
      expect(screen.getByRole('heading', { name: /Project Overview.*Task Line/i })).toBeInTheDocument()
    })

    it('should render back to home link', () => {
      render(<Overview />)
      expect(screen.getByRole('link', { name: /Back to Home/i })).toBeInTheDocument()
    })

    it('should render vision section', () => {
      render(<Overview />)
      const visionHeadings = screen.getAllByRole('heading', { name: /Vision/i })
      expect(visionHeadings.length).toBeGreaterThan(0)
    })

    it('should render core features section', () => {
      render(<Overview />)
      const featureHeadings = screen.getAllByRole('heading', { name: /Core Features/i })
      expect(featureHeadings.length).toBeGreaterThan(0)
    })

    it('should render views section', () => {
      render(<Overview />)
      expect(screen.getByText(/fast List, visual Board/i)).toBeInTheDocument()
    })

    it('should render privacy section', () => {
      render(<Overview />)
      expect(screen.getByText(/Data & Privacy/i)).toBeInTheDocument()
    })

    it('should render architecture section', () => {
      render(<Overview />)
      expect(screen.getByText(/Architecture/i)).toBeInTheDocument()
    })

    it('should render footer with privacy message', () => {
      render(<Overview />)
      expect(screen.getByText(/Your data stays local and private/i)).toBeInTheDocument()
    })

    it('should render tagline in overview content', () => {
      render(<Overview />)
      expect(screen.getByText(/Lock in. Get it done. Stay zen./i)).toBeInTheDocument()
    })
  })

  describe('Content', () => {
    it('should display local-first messaging', () => {
      render(<Overview />)
      expect(screen.getByText(/Runs entirely on your computer/i)).toBeInTheDocument()
    })

    it('should mention PIN lock feature', () => {
      render(<Overview />)
      expect(screen.getByText(/PIN lock/i)).toBeInTheDocument()
    })

    it('should describe optional AI coach', () => {
      render(<Overview />)
      expect(screen.getByRole('heading', { name: /Optional Coach Chat/i })).toBeInTheDocument()
    })
  })
})
