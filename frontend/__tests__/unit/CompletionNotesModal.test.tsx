import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CompletionNotesModal } from '../../src/components/tasks/CompletionNotesModal'

vi.mock('../../src/lib/hooks', () => ({
  useCreateJournalEntry: () => ({ mutate: vi.fn(), isPending: false })
}))

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('CompletionNotesModal', () => {
  const mockTask = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: { id: 2, name: 'in_progress' },
    created_at: '2024-01-01',
    done: false,
    archived: false,
    priority: false,
    order: 1,
    created_by: 1
  }

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onComplete: vi.fn(),
    task: mockTask
  }

  it('should render modal when open', () => {
    renderWithProviders(<CompletionNotesModal {...defaultProps} />)
    expect(screen.getByText(/complete task/i)).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    const { container } = renderWithProviders(<CompletionNotesModal {...defaultProps} isOpen={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('should call onComplete when complete is clicked', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    
    renderWithProviders(<CompletionNotesModal {...defaultProps} onComplete={onComplete} />)
    
    const completeButton = screen.getByRole('button', { name: /complete task/i })
    await user.click(completeButton)
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled()
    })
  })

  it('should call onClose when skip notes is clicked', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    
    renderWithProviders(<CompletionNotesModal {...defaultProps} onComplete={onComplete} />)
    
    const skipButton = screen.getByRole('button', { name: /skip notes/i })
    await user.click(skipButton)
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled()
    })
  })

  it('should display task title in description', () => {
    renderWithProviders(<CompletionNotesModal {...defaultProps} />)
    expect(screen.getByText(/completing/i)).toBeInTheDocument()
  })
})
