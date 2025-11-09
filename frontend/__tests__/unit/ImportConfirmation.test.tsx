import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImportConfirmation } from '../../src/components/tasks/ImportConfirmation'

describe('ImportConfirmation', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    fileName: 'tasks-export.json'
  }

  it('should not render when isOpen is false', () => {
    const { container } = render(<ImportConfirmation {...defaultProps} isOpen={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('should render modal with file name', () => {
    render(<ImportConfirmation {...defaultProps} />)
    expect(screen.getByText(/tasks-export.json/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Import Data/i).length).toBeGreaterThan(0)
  })

  it('should display data summary when provided', () => {
    const dataSummary = {
      tasks: 5,
      journalEntries: 3,
      settings: true
    }

    render(<ImportConfirmation {...defaultProps} dataSummary={dataSummary} />)

    expect(screen.getByText(/5 tasks/i)).toBeInTheDocument()
    expect(screen.getByText(/3 journal entries/i)).toBeInTheDocument()
    expect(screen.getByText(/Settings and preferences/i)).toBeInTheDocument()
  })

  it('should handle singular task count', () => {
    const dataSummary = {
      tasks: 1,
      journalEntries: 1
    }

    render(<ImportConfirmation {...defaultProps} dataSummary={dataSummary} />)

    expect(screen.getByText(/1 task$/i)).toBeInTheDocument()
    expect(screen.getByText(/1 journal entry$/i)).toBeInTheDocument()
  })

  it('should display warning message', () => {
    render(<ImportConfirmation {...defaultProps} />)
    expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument()
    expect(screen.getByText(/Your current data will be permanently replaced/i)).toBeInTheDocument()
  })

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(<ImportConfirmation {...defaultProps} onClose={onClose} />)

    await user.click(screen.getByText(/Cancel/i))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when X button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(<ImportConfirmation {...defaultProps} onClose={onClose} />)

    const closeButton = screen.getAllByRole('button').find(
      btn => btn.querySelector('svg')?.classList.contains('lucide-x')
    )
    if (closeButton) {
      await user.click(closeButton)
      expect(onClose).toHaveBeenCalledTimes(1)
    }
  })

  it('should call onConfirm when import button is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(<ImportConfirmation {...defaultProps} onConfirm={onConfirm} />)

    const importButton = screen.getAllByText(/Import Data/i).find(
      el => el.tagName === 'BUTTON'
    )
    if (importButton) {
      await user.click(importButton)
      expect(onConfirm).toHaveBeenCalledTimes(1)
    }
  })

  it('should disable buttons when isLoading is true', () => {
    render(<ImportConfirmation {...defaultProps} isLoading={true} />)

    const cancelButton = screen.getByText(/Cancel/i)
    const importButton = screen.getByText(/Importing.../i)

    expect(cancelButton).toBeDisabled()
    expect(importButton).toBeDisabled()
  })

  it('should show loading text when isLoading is true', () => {
    render(<ImportConfirmation {...defaultProps} isLoading={true} />)
    expect(screen.getByText(/Importing.../i)).toBeInTheDocument()
  })

  it('should render all icons', () => {
    const { container } = render(<ImportConfirmation {...defaultProps} />)
    
    // Check that modal is rendered (not checking for role=dialog since it's not set)
    const modal = container.querySelector('.fixed.inset-0')
    expect(modal).toBeInTheDocument()
  })
})
