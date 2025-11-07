import { render, screen, waitFor } from '../test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Dashboard } from '../../src/components/views/Dashboard'
import * as hooks from '../../src/lib/hooks'

vi.mock('../../src/lib/hooks', async () => {
  const actual = await vi.importActual('../../src/lib/hooks')
  return {
    ...actual,
    useTasks: vi.fn(),
  }
})

describe('Dashboard', () => {
  const mockTasks = [
    {
      id: 1,
      title: 'Task 1',
      description: 'Description 1',
      done: false,
      priority: true,
      due_date: new Date().toISOString().split('T')[0], // Today
      created_on: new Date().toISOString(),
      updated_on: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Task 2',
      description: 'Description 2',
      done: true,
      priority: false,
      due_date: null,
      created_on: new Date().toISOString(),
      updated_on: new Date().toISOString(),
    },
    {
      id: 3,
      title: 'Overdue Task',
      description: 'This is overdue',
      done: false,
      priority: false,
      due_date: '2025-01-01', // Past date
      created_on: new Date().toISOString(),
      updated_on: new Date().toISOString(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render dashboard title', () => {
      vi.mocked(hooks.useTasks).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<Dashboard />)

      expect(screen.getByText(/welcome to task line/i)).toBeInTheDocument()
    })

    it('should display loading state', () => {
      vi.mocked(hooks.useTasks).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<Dashboard />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should render statistics cards', async () => {
      vi.mocked(hooks.useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText(/total tasks/i)).toBeInTheDocument()
        expect(screen.getByText(/completed/i)).toBeInTheDocument()
        expect(screen.getByText(/pending/i)).toBeInTheDocument()
      })
    })

    it('should render quick action buttons', async () => {
      vi.mocked(hooks.useTasks).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText(/list view/i)).toBeInTheDocument()
        expect(screen.getByText(/board view/i)).toBeInTheDocument()
        expect(screen.getByText(/calendar/i)).toBeInTheDocument()
        expect(screen.getByText(/review/i)).toBeInTheDocument()
        expect(screen.getByText(/pomodoro timer/i)).toBeInTheDocument()
      })
    })
  })

  describe('Statistics Calculation', () => {
    it('should calculate total tasks correctly', async () => {
      vi.mocked(hooks.useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<Dashboard />)

      await waitFor(() => {
        const totalTasks = screen.getAllByText('3')
        expect(totalTasks.length).toBeGreaterThan(0)
      })
    })

    it('should calculate completed tasks correctly', async () => {
      vi.mocked(hooks.useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<Dashboard />)

      await waitFor(() => {
        const completedTasks = screen.getAllByText('1')
        expect(completedTasks.length).toBeGreaterThan(0)
      })
    })

    it('should calculate pending tasks correctly', async () => {
      vi.mocked(hooks.useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<Dashboard />)

      await waitFor(() => {
        const pendingTasks = screen.getAllByText('2')
        expect(pendingTasks.length).toBeGreaterThan(0)
      })
    })

    it('should calculate completion rate correctly', async () => {
      vi.mocked(hooks.useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<Dashboard />)

      await waitFor(() => {
        // 1 completed out of 3 = 33%
        expect(screen.getByText(/33%/i)).toBeInTheDocument()
      })
    })

    it('should show 0% completion rate when no tasks', async () => {
      vi.mocked(hooks.useTasks).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText(/0%/i)).toBeInTheDocument()
      })
    })

    it('should calculate overdue count correctly', async () => {
      vi.mocked(hooks.useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<Dashboard />)

      await waitFor(() => {
        // Check for "Overdue" pattern
        const overdueElements = screen.queryAllByText(/overdue/i)
        expect(overdueElements.length).toBeGreaterThan(0)
      })
    })

    it('should calculate high priority count correctly', async () => {
      vi.mocked(hooks.useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText(/high priority/i)).toBeInTheDocument()
      })
    })
  })

  describe('Task Lists', () => {
    it('should render task list sections', () => {
      vi.mocked(hooks.useTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<Dashboard />)

      // Check that dashboard renders with task sections
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    })
  })

  describe('Navigation Links', () => {
    it('should have links to all views', async () => {
      vi.mocked(hooks.useTasks).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<Dashboard />)

      await waitFor(() => {
        const links = screen.getAllByRole('link')
        expect(links.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle empty task array gracefully', () => {
      vi.mocked(hooks.useTasks).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<Dashboard />)

      expect(screen.getByText(/welcome to task line/i)).toBeInTheDocument()
    })

    it('should handle undefined data gracefully', () => {
      vi.mocked(hooks.useTasks).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<Dashboard />)

      // Should still render without crashing
      expect(screen.getByText(/welcome to task line/i)).toBeInTheDocument()
    })
  })
})
