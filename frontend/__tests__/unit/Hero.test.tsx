import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test-utils'
import Hero from '../../src/components/landing/Hero'

// Partially mock the Link component but keep other router exports
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    Link: ({ to, children, ...props }: any) => <a href={to} {...props}>{children}</a>,
  }
})

describe('Hero', () => {
  it('renders the hero section with main heading', () => {
    render(<Hero />)

    expect(screen.getByRole('heading', { level: 1, name: /lock in\. get it done\. stay zen\./i })).toBeInTheDocument()
  })

  it('renders the subtitle text', () => {
    render(<Hero />)

    expect(screen.getByText(/a classy, local-first task companion/i)).toBeInTheDocument()
  })

  it('renders call-to-action buttons', () => {
    render(<Hero />)

    expect(screen.getByRole('link', { name: /open app/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /try tutorial/i })).toBeInTheDocument()
  })

  it('renders the task preview section', () => {
    render(<Hero />)

    expect(screen.getByText("Today's Focus")).toBeInTheDocument()
    expect(screen.getByText('3 tasks to complete')).toBeInTheDocument()
    expect(screen.getByText('Complete project proposal')).toBeInTheDocument()
  })
})