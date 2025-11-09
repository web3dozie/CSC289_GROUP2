import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test-utils'
import userEvent from '@testing-library/user-event'
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

  it('renders navigation items', () => {
    render(<Header />)

    expect(screen.getByRole('link', { name: /features/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /views/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /privacy/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /faq/i })).toBeInTheDocument()
  })

  it('has mobile menu button', () => {
    render(<Header />)

    const menuButton = screen.getByRole('button', { name: /toggle menu/i })
    expect(menuButton).toBeInTheDocument()
  })

  it('mobile menu is initially closed', () => {
    render(<Header />)

    const menuButton = screen.getByRole('button', { name: /toggle menu/i })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens mobile menu when toggle button is clicked', async () => {
    const user = userEvent.setup()
    render(<Header />)

    const menuButton = screen.getByRole('button', { name: /toggle menu/i })
    await user.click(menuButton)

    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
  })

  it('shows mobile navigation when menu is open', async () => {
    const user = userEvent.setup()
    render(<Header />)

    const menuButton = screen.getByRole('button', { name: /toggle menu/i })
    await user.click(menuButton)

    expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument()
  })

  it('closes mobile menu when clicking a nav link', async () => {
    const user = userEvent.setup()
    render(<Header />)

    const menuButton = screen.getByRole('button', { name: /toggle menu/i })
    await user.click(menuButton)
    
    const mobileLinks = screen.getAllByRole('link', { name: /features/i })
    await user.click(mobileLinks[mobileLinks.length - 1]) // Click the mobile one

    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })
})