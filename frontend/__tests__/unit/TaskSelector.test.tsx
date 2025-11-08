import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { TaskSelector } from '../../src/components/timer/TaskSelector'

// Mock the hooks
vi.mock('../../src/lib/hooks', () => ({
  useTasks: vi.fn(),
}))

// Mock AuthContext
vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'testuser' },
    isAuthenticated: true,
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

const mockTasks = [
  {
    id: 1,
    title: 'Complete project documentation',
    description: 'Write detailed README',
    category: 'Work',
    priority: true,
    done: false,
    archived: false,
    user_id: 1,
    due_date: null,
    time_estimate: null,
    created_on: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'Review pull requests',
    description: 'Check team PRs',
    category: 'Development',
    priority: false,
    done: false,
    archived: false,
    user_id: 1,
    due_date: null,
    time_estimate: null,
    created_on: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    title: 'Completed task',
    description: 'This is done',
    category: 'Personal',
    priority: false,
    done: true,
    archived: false,
    user_id: 1,
    due_date: null,
    time_estimate: null,
    created_on: '2024-01-01T00:00:00Z',
  },
  {
    id: 4,
    title: 'Archived task',
    description: 'This is archived',
    category: 'Archive',
    priority: false,
    done: false,
    archived: true,
    user_id: 1,
    due_date: null,
    time_estimate: null,
    created_on: '2024-01-01T00:00:00Z',
  },
  {
    id: 5,
    title: 'Write tests',
    description: 'Add unit tests for components',
    category: 'Development',
    priority: true,
    done: false,
    archived: false,
    user_id: 1,
    due_date: null,
    time_estimate: null,
    created_on: '2024-01-01T00:00:00Z',
  },
]

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

describe('TaskSelector', () => {
  const mockOnTaskSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render with no task selected', async () => {
      const { useTasks } = await import('../../src/lib/hooks')
      vi.mocked(useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
      } as any)

      render(
        <TaskSelector selectedTaskId={null} onTaskSelect={mockOnTaskSelect} />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('Current Task')).toBeInTheDocument()
      expect(screen.getByText(/No task selected/i)).toBeInTheDocument()
      expect(screen.getByText('Select Task')).toBeInTheDocument()
    })

    it('should render with a selected task', async () => {
      const { useTasks } = await import('../../src/lib/hooks')
      vi.mocked(useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
      } as any)

      render(
        <TaskSelector selectedTaskId={1} onTaskSelect={mockOnTaskSelect} />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('Complete project documentation')).toBeInTheDocument()
      expect(screen.getByText('Write detailed README')).toBeInTheDocument()
      expect(screen.getByText('Change Task')).toBeInTheDocument()
    })

    it('should show loading state', async () => {
      const { useTasks } = await import('../../src/lib/hooks')
      vi.mocked(useTasks).mockReturnValue({
        data: [],
        isLoading: true,
      } as any)

      const user = userEvent.setup()

      render(
        <TaskSelector selectedTaskId={null} onTaskSelect={mockOnTaskSelect} />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByText('Select Task'))

      // Should show loading skeletons
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument()
      })
    })
  })

  describe('Task Selection', () => {
    it('should open task list when button is clicked', async () => {
      const { useTasks } = await import('../../src/lib/hooks')
      vi.mocked(useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
      } as any)

      const user = userEvent.setup()

      render(
        <TaskSelector selectedTaskId={null} onTaskSelect={mockOnTaskSelect} />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByText('Select Task'))

      // Task list should be visible
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument()
      })
    })

    it('should display only active (not done, not archived) tasks', async () => {
      const { useTasks } = await import('../../src/lib/hooks')
      vi.mocked(useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
      } as any)

      const user = userEvent.setup()

      render(
        <TaskSelector selectedTaskId={null} onTaskSelect={mockOnTaskSelect} />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByText('Select Task'))

      await waitFor(() => {
        expect(screen.getByText('Complete project documentation')).toBeInTheDocument()
        expect(screen.getByText('Review pull requests')).toBeInTheDocument()
        expect(screen.getByText('Write tests')).toBeInTheDocument()
        expect(screen.queryByText('Completed task')).not.toBeInTheDocument()
        expect(screen.queryByText('Archived task')).not.toBeInTheDocument()
      })
    })

    it('should call onTaskSelect when a task is clicked', async () => {
      const { useTasks } = await import('../../src/lib/hooks')
      vi.mocked(useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
      } as any)

      const user = userEvent.setup()

      render(
        <TaskSelector selectedTaskId={null} onTaskSelect={mockOnTaskSelect} />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByText('Select Task'))

      await waitFor(() => {
        expect(screen.getByText('Complete project documentation')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Complete project documentation'))

      expect(mockOnTaskSelect).toHaveBeenCalledWith(1)
    })

    it('should close task list after selection', async () => {
      const { useTasks } = await import('../../src/lib/hooks')
      vi.mocked(useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
      } as any)

      const user = userEvent.setup()

      render(
        <TaskSelector selectedTaskId={null} onTaskSelect={mockOnTaskSelect} />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByText('Select Task'))
      
      await waitFor(() => {
        expect(screen.getByText('Complete project documentation')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Complete project documentation'))

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search tasks...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Search Functionality', () => {
    it('should filter tasks by title', async () => {
      const { useTasks } = await import('../../src/lib/hooks')
      vi.mocked(useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
      } as any)

      const user = userEvent.setup()

      render(
        <TaskSelector selectedTaskId={null} onTaskSelect={mockOnTaskSelect} />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByText('Select Task'))

      const searchInput = await screen.findByPlaceholderText('Search tasks...')
      await user.type(searchInput, 'documentation')

      await waitFor(() => {
        expect(screen.getByText('Complete project documentation')).toBeInTheDocument()
        expect(screen.queryByText('Review pull requests')).not.toBeInTheDocument()
        expect(screen.queryByText('Write tests')).not.toBeInTheDocument()
      })
    })

    it('should filter tasks by description', async () => {
      const { useTasks } = await import('../../src/lib/hooks')
      vi.mocked(useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
      } as any)

      const user = userEvent.setup()

      render(
        <TaskSelector selectedTaskId={null} onTaskSelect={mockOnTaskSelect} />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByText('Select Task'))

      const searchInput = await screen.findByPlaceholderText('Search tasks...')
      await user.type(searchInput, 'README')

      await waitFor(() => {
        expect(screen.getByText('Complete project documentation')).toBeInTheDocument()
        expect(screen.queryByText('Review pull requests')).not.toBeInTheDocument()
      })
    })

    it('should show message when no tasks match search', async () => {
      const { useTasks } = await import('../../src/lib/hooks')
      vi.mocked(useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
      } as any)

      const user = userEvent.setup()

      render(
        <TaskSelector selectedTaskId={null} onTaskSelect={mockOnTaskSelect} />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByText('Select Task'))

      const searchInput = await screen.findByPlaceholderText('Search tasks...')
      await user.type(searchInput, 'nonexistent task')

      await waitFor(() => {
        expect(screen.getByText('No tasks match your search.')).toBeInTheDocument()
      })
    })

    it('should be case-insensitive', async () => {
      const { useTasks } = await import('../../src/lib/hooks')
      vi.mocked(useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
      } as any)

      const user = userEvent.setup()

      render(
        <TaskSelector selectedTaskId={null} onTaskSelect={mockOnTaskSelect} />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByText('Select Task'))

      const searchInput = await screen.findByPlaceholderText('Search tasks...')
      await user.type(searchInput, 'DOCUMENTATION')

      await waitFor(() => {
        expect(screen.getByText('Complete project documentation')).toBeInTheDocument()
      })
    })

    it('should clear search when task is selected', async () => {
      const { useTasks } = await import('../../src/lib/hooks')
      vi.mocked(useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
      } as any)

      const user = userEvent.setup()

      const { rerender } = render(
        <TaskSelector selectedTaskId={null} onTaskSelect={mockOnTaskSelect} />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByText('Select Task'))

      const searchInput = await screen.findByPlaceholderText('Search tasks...')
      await user.type(searchInput, 'documentation')

      await user.click(screen.getByText('Complete project documentation'))

      // Rerender with new selectedTaskId
      rerender(
        <TaskSelector selectedTaskId={1} onTaskSelect={mockOnTaskSelect} />
      )

      // Open again
      await user.click(screen.getByText('Change Task'))

      const newSearchInput = await screen.findByPlaceholderText('Search tasks...')
      expect(newSearchInput).toHaveValue('')
    })
  })

  describe('Clear Selection', () => {
    it('should clear selected task when X button is clicked', async () => {
      const { useTasks } = await import('../../src/lib/hooks')
      vi.mocked(useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
      } as any)

      const user = userEvent.setup()

      render(
        <TaskSelector selectedTaskId={1} onTaskSelect={mockOnTaskSelect} />,
        { wrapper: createWrapper() }
      )

      const clearButton = screen.getByLabelText('Clear task selection')
      await user.click(clearButton)

      expect(mockOnTaskSelect).toHaveBeenCalledWith(null)
    })
  })

  describe('Empty States', () => {
    it('should show message when no active tasks available', async () => {
      const { useTasks } = await import('../../src/lib/hooks')
      vi.mocked(useTasks).mockReturnValue({
        data: [],
        isLoading: false,
      } as any)

      const user = userEvent.setup()

      render(
        <TaskSelector selectedTaskId={null} onTaskSelect={mockOnTaskSelect} />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByText('Select Task'))

      await waitFor(() => {
        expect(screen.getByText('No active tasks available.')).toBeInTheDocument()
      })
    })

    it('should show message when all tasks are done or archived', async () => {
      const { useTasks } = await import('../../src/lib/hooks')
      vi.mocked(useTasks).mockReturnValue({
        data: mockTasks.filter(t => t.done || t.archived),
        isLoading: false,
      } as any)

      const user = userEvent.setup()

      render(
        <TaskSelector selectedTaskId={null} onTaskSelect={mockOnTaskSelect} />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByText('Select Task'))

      await waitFor(() => {
        expect(screen.getByText('No active tasks available.')).toBeInTheDocument()
      })
    })
  })

  describe('Task Display', () => {
    it('should display task category badge', async () => {
      const { useTasks } = await import('../../src/lib/hooks')
      vi.mocked(useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
      } as any)

      const user = userEvent.setup()

      render(
        <TaskSelector selectedTaskId={null} onTaskSelect={mockOnTaskSelect} />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByText('Select Task'))

      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument()
        expect(screen.getAllByText('Development').length).toBeGreaterThan(0)
      })
    })

    it('should display priority badge for priority tasks', async () => {
      const { useTasks } = await import('../../src/lib/hooks')
      vi.mocked(useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
      } as any)

      const user = userEvent.setup()

      render(
        <TaskSelector selectedTaskId={null} onTaskSelect={mockOnTaskSelect} />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByText('Select Task'))

      await waitFor(() => {
        const priorityBadges = screen.getAllByText('High Priority')
        expect(priorityBadges.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Toggle behavior', () => {
    it('should toggle task list on button click', async () => {
      const { useTasks } = await import('../../src/lib/hooks')
      vi.mocked(useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
      } as any)

      const user = userEvent.setup()

      render(
        <TaskSelector selectedTaskId={null} onTaskSelect={mockOnTaskSelect} />,
        { wrapper: createWrapper() }
      )

      // Open
      await user.click(screen.getByText('Select Task'))
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument()
      })

      // Close
      await user.click(screen.getByText('Select Task'))
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search tasks...')).not.toBeInTheDocument()
      })
    })
  })
})
