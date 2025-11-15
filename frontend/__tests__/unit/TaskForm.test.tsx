import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TaskForm } from '../../src/components/tasks/TaskForm'

vi.mock('../../src/lib/hooks', () => ({
  useCreateTask: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useUpdateTask: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useCategories: () => ({ data: ['Work', 'Personal'], isLoading: false })
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

describe('TaskForm', () => {
  const defaultProps = {
    onClose: vi.fn()
  }

  it('should render empty form for new task', () => {
    renderWithProviders(<TaskForm {...defaultProps} />)
    expect(screen.getByLabelText(/title/i)).toHaveValue('')
  })

  it('should render form with task data when editing', () => {
    const task = {
      id: 1,
      title: 'Test Task',
      description: 'Test Description',
      status: { id: 1, name: 'todo' },
      priority: true,
      created_at: '2024-01-01',
      done: false,
      archived: false,
      order: 1,
      created_by: 1
    }
    
    renderWithProviders(<TaskForm {...defaultProps} task={task} />)
    expect(screen.getByLabelText(/title/i)).toHaveValue('Test Task')
  })

  it('should submit form with task data', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    
    renderWithProviders(<TaskForm {...defaultProps} onClose={onClose} />)
    
    await user.type(screen.getByLabelText(/title/i), 'New Task')
    
    const submitButton = screen.getByRole('button', { name: /create task/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should call onClose when cancel button clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    
    renderWithProviders(<TaskForm {...defaultProps} onClose={onClose} />)
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)
    
    expect(onClose).toHaveBeenCalled()
  })

  it('should disable submit button when title is empty', () => {
    renderWithProviders(<TaskForm {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: /create task/i })
    expect(submitButton).toBeDisabled()
  })

  it('should toggle priority checkbox', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<TaskForm {...defaultProps} />)
    
    const priorityCheckbox = screen.getByRole('checkbox', { name: /high priority/i })
    expect(priorityCheckbox).not.toBeChecked()
    
    await user.click(priorityCheckbox)
    expect(priorityCheckbox).toBeChecked()
  })

  it('should show form header for new task', () => {
    renderWithProviders(<TaskForm {...defaultProps} />)
    expect(screen.getByText(/create new task/i)).toBeInTheDocument()
  })

  it('should show form header for editing task', () => {
    const task = {
      id: 1,
      title: 'Test Task',
      status: { id: 1, name: 'todo' },
      created_at: '2024-01-01',
      done: false,
      archived: false,
      priority: false,
      order: 1,
      created_by: 1
    }
    
    renderWithProviders(<TaskForm {...defaultProps} task={task} />)
    expect(screen.getByText(/edit task/i)).toBeInTheDocument()
  })

  it('should set min due date to today (local)', () => {
    renderWithProviders(<TaskForm {...defaultProps} />)
    const dueDateInput = screen.getByLabelText(/due date/i) as HTMLInputElement
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const expected = `${yyyy}-${mm}-${dd}`
    expect(dueDateInput.min).toBe(expected)
  })
})
