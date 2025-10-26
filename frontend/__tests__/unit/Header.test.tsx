import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test-utils'
import Header from '../../src/components/landing/Header'

// Partially mock the Link component but keep other router exports
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    Link: ({ to, children, ...props }: any) => <a href={to} {...props}>{children}</a>,
  }
})

describe('Header', () => {
  it('renders the header with navigation links', () => {
    render(<Header />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByText('Task Line')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open app/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /read overview/i })).toBeInTheDocument()
  })

  it('has skip to main content link', () => {
    render(<Header />)

    const skipLink = screen.getByRole('link', { name: /skip to main content/i })
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute('href', '#main')
  })
})