import { render, screen, waitFor } from '../test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TaskBoard } from '../../src/components/views/TaskBoard'
import * as hooks from '../../src/lib/hooks'

vi.mock('../../src/lib/hooks', async () => {
  const actual = await vi.importActual('../../src/lib/hooks')
  return {
    ...actual,
    useKanbanTasks: vi.fn(),
    useUpdateTask: vi.fn(),
    useDeleteTask: vi.fn(),
    useArchiveCompletedTasks: vi.fn(),
  }
})

describe('TaskBoard', () => {
  const mockTask1 = {
    id: 1,
    title: 'Task in To Do',
    description: 'Description',
    done: false,
    archived: false,
    priority: false,
    status: { id: 1, name: 'To Do' },
    status_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const mockTask2 = {
    id: 2,
    title: 'Task in Progress',
    description: 'Description',
    done: false,
    archived: false,
    priority: true,
    status: { id: 2, name: 'In Progress' },
    status_id: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const mockKanbanData = {
    todo: {
      tasks: [mockTask1],
      count: 1,
    },
    in_progress: {
      tasks: [mockTask2],
      count: 1,
    },
    done: {
      tasks: [],
      count: 0,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(hooks.useKanbanTasks).mockReturnValue({
      data: mockKanbanData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)
    vi.mocked(hooks.useUpdateTask).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)
    vi.mocked(hooks.useDeleteTask).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)
    vi.mocked(hooks.useArchiveCompletedTasks).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)
  })

  describe('Rendering', () => {
    it('should render board title', () => {
      render(<TaskBoard />)

      expect(screen.getByText(/task board/i)).toBeInTheDocument()
    })

    it('should render all lanes', async () => {
      render(<TaskBoard />)

      await waitFor(() => {
        expect(screen.getByText('To Do')).toBeInTheDocument()
        expect(screen.getByText('In Progress')).toBeInTheDocument()
        expect(screen.getByText('Done')).toBeInTheDocument()
      })
    })

    it('should render tasks in correct lanes', async () => {
      render(<TaskBoard />)

      await waitFor(() => {
        expect(screen.getByText('Task in To Do')).toBeInTheDocument()
        expect(screen.getByText('Task in Progress')).toBeInTheDocument()
      })
    })

    it('should show loading state', () => {
      vi.mocked(hooks.useKanbanTasks).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<TaskBoard />)

      // Check for loading indicators (skeleton loaders)
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should show empty state when no tasks', () => {
      vi.mocked(hooks.useKanbanTasks).mockReturnValue({
        data: {
          todo: { tasks: [], count: 0 },
          in_progress: { tasks: [], count: 0 },
          done: { tasks: [], count: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<TaskBoard />)

      // TaskBoard still renders lanes with empty messages
      expect(screen.getByText('Task Board')).toBeInTheDocument()
      expect(screen.getByText(/no tasks in to do/i)).toBeInTheDocument()
    })
  })

  describe('Task Display', () => {
    it('should display task titles', async () => {
      render(<TaskBoard />)

      await waitFor(() => {
        expect(screen.getByText('Task in To Do')).toBeInTheDocument()
        expect(screen.getByText('Task in Progress')).toBeInTheDocument()
      })
    })

    it('should show priority badge for priority tasks', async () => {
      render(<TaskBoard />)

      await waitFor(() => {
        // Check for high priority task indicator  
        const priorityIcon = screen.getByLabelText(/high priority task/i)
        expect(priorityIcon).toBeInTheDocument()
      })
    })

    it('should render task count per lane', async () => {
      render(<TaskBoard />)

      await waitFor(() => {
        // Check that task counts are displayed
        const counters = screen.getAllByText('1')
        expect(counters.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle undefined data gracefully', () => {
      vi.mocked(hooks.useKanbanTasks).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<TaskBoard />)

      // TaskBoard still renders with default structure, shows 0 tasks
      expect(screen.getByText('Task Board')).toBeInTheDocument()
      expect(screen.getByText(/0 total tasks/i)).toBeInTheDocument()
    })

    it('should handle empty lanes', () => {
      vi.mocked(hooks.useKanbanTasks).mockReturnValue({
        data: {
          todo: { tasks: [], count: 0 },
          in_progress: { tasks: [], count: 0 },
          done: { tasks: [], count: 0 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<TaskBoard />)

      // TaskBoard still renders with empty state messages
      expect(screen.getByText('Task Board')).toBeInTheDocument()
      expect(screen.getByText(/no tasks in to do/i)).toBeInTheDocument()
    })
  })
})
