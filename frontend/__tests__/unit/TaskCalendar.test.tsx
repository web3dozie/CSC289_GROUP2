import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskCalendar } from '../../src/components/views/TaskCalendar'
import * as hooks from '../../src/lib/hooks'

// Mock the hooks
vi.mock('../../src/lib/hooks', () => ({
  useCalendarTasks: vi.fn(),
  useUpdateTask: vi.fn(),
  useDeleteTask: vi.fn(),
}))

// Mock child components
vi.mock('../../src/components/tasks', () => ({
  TaskItem: ({ task, onEdit, onDelete }: any) => (
    <div data-testid={`task-item-${task.id}`}>
      <span>{task.title}</span>
      <button onClick={() => onEdit(task)}>Edit</button>
      <button onClick={() => onDelete(task)}>Delete</button>
    </div>
  ),
  TaskModal: ({ isOpen, task }: any) => 
    isOpen ? <div data-testid="task-modal">Task Modal {task?.title}</div> : null,
  DeleteConfirmation: ({ isOpen, onConfirm, onCancel }: any) =>
    isOpen ? (
      <div data-testid="delete-confirmation">
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
  CompletionNotesModal: ({ isOpen, onComplete, onCancel }: any) =>
    isOpen ? (
      <div data-testid="completion-notes-modal">
        <button onClick={() => onComplete('notes', true)}>Complete</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}))

describe('TaskCalendar', () => {
  const mockUpdateTask = {
    mutateAsync: vi.fn(),
    isPending: false,
  }

  const mockDeleteTask = {
    mutateAsync: vi.fn(),
    isPending: false,
  }

  const mockTasksByDate = {
    '2025-11-05': [
      {
        id: 1,
        title: 'Test Task 1',
        description: 'Description 1',
        done: false,
        due_date: '2025-11-05T10:00:00Z',
        priority: false,
        created_at: '2025-11-01T10:00:00Z',
      },
      {
        id: 2,
        title: 'Completed Task',
        description: 'Description 2',
        done: true,
        due_date: '2025-11-05T10:00:00Z',
        priority: false,
        created_at: '2025-11-01T10:00:00Z',
      },
    ],
    '2025-11-03': [
      {
        id: 3,
        title: 'Overdue Task',
        description: 'Description 3',
        done: false,
        due_date: '2025-11-03T10:00:00Z',
        priority: true,
        created_at: '2025-11-01T10:00:00Z',
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock current date to be consistent
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-11-05T12:00:00Z'))

    vi.mocked(hooks.useCalendarTasks).mockReturnValue({
      data: mockTasksByDate,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    vi.mocked(hooks.useUpdateTask).mockReturnValue(mockUpdateTask as any)
    vi.mocked(hooks.useDeleteTask).mockReturnValue(mockDeleteTask as any)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('should render calendar view by default', () => {
      render(<TaskCalendar />)

      expect(screen.getByText('November 2025')).toBeInTheDocument()
      expect(screen.getByText('Sun')).toBeInTheDocument()
      expect(screen.getByText('Mon')).toBeInTheDocument()
      expect(screen.getByText('Sat')).toBeInTheDocument()
    })

    it('should render calendar header with navigation buttons', () => {
      render(<TaskCalendar />)

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(3) // At least prev, next, today, and view buttons
    })

    it('should show calendar when not loading', () => {
      render(<TaskCalendar />)

      // Should show calendar, not loading text
      expect(screen.getByText('November 2025')).toBeInTheDocument()
    })

    it('should display error state', () => {
      vi.mocked(hooks.useCalendarTasks).mockReturnValue({
        data: {},
        isLoading: false,
        error: new Error('Failed to load'),
        refetch: vi.fn(),
      } as any)

      render(<TaskCalendar />)

      expect(screen.getByText(/failed to load calendar/i)).toBeInTheDocument()
    })

    it('should render view toggle buttons', () => {
      render(<TaskCalendar />)

      expect(screen.getByRole('button', { name: /calendar/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /agenda/i })).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should navigate to previous month', async () => {
      const user = userEvent.setup({ delay: null })
      render(<TaskCalendar />)

      expect(screen.getByText('November 2025')).toBeInTheDocument()

      // Click the first chevron button (previous month)
      const buttons = screen.getAllByRole('button')
      const prevButton = buttons[0] // First button is previous month
      await user.click(prevButton)

      expect(screen.getByText('October 2025')).toBeInTheDocument()
    })

    it('should navigate to next month', async () => {
      const user = userEvent.setup({ delay: null })
      render(<TaskCalendar />)

      expect(screen.getByText('November 2025')).toBeInTheDocument()

      // Click the second chevron button (next month)
      const buttons = screen.getAllByRole('button')
      const nextButton = buttons[1] // Second button is next month
      await user.click(nextButton)

      expect(screen.getByText('December 2025')).toBeInTheDocument()
    })

    it('should navigate back to today', async () => {
      const user = userEvent.setup({ delay: null })
      render(<TaskCalendar />)

      // Navigate away from current month
      const buttons = screen.getAllByRole('button')
      const nextButton = buttons[1]
      await user.click(nextButton)
      expect(screen.getByText('December 2025')).toBeInTheDocument()

      // Click today button
      const todayButton = screen.getByRole('button', { name: /today/i })
      await user.click(todayButton)

      expect(screen.getByText('November 2025')).toBeInTheDocument()
    })
  })

  describe('Task Display', () => {
    it('should display tasks on their due dates', () => {
      render(<TaskCalendar />)

      // Tasks should be visible in the calendar
      expect(screen.getByText('Test Task 1')).toBeInTheDocument()
      expect(screen.getByText('Completed Task')).toBeInTheDocument()
      expect(screen.getByText('Overdue Task')).toBeInTheDocument()
    })

    it('should show task count badge when date has tasks', () => {
      render(<TaskCalendar />)

      // Nov 5 has 2 tasks
      const badges = screen.getAllByText('2')
      expect(badges.length).toBeGreaterThan(0)
    })

    it('should highlight today', () => {
      render(<TaskCalendar />)

      // Find the element containing "5" which is today
      const todayElements = screen.getAllByText('5')
      const todayElement = todayElements.find(el => 
        el.classList.contains('text-blue-600') || el.classList.contains('text-blue-400')
      )
      
      expect(todayElement).toBeDefined()
    })
  })

  describe('View Modes', () => {
    it('should switch to agenda view', async () => {
      const user = userEvent.setup({ delay: null })
      render(<TaskCalendar />)

      const agendaButton = screen.getByRole('button', { name: /agenda/i })
      await user.click(agendaButton)

      // Agenda view should show "Upcoming Tasks"
      expect(screen.getByText(/upcoming tasks/i)).toBeInTheDocument()
    })

    it('should switch back to calendar view', async () => {
      const user = userEvent.setup({ delay: null })
      render(<TaskCalendar />)

      // Switch to agenda
      const agendaButton = screen.getByRole('button', { name: /agenda/i })
      await user.click(agendaButton)

      // Switch back to calendar
      const calendarButton = screen.getByRole('button', { name: /calendar/i })
      await user.click(calendarButton)

      // Should show calendar grid again
      expect(screen.getByText('Sun')).toBeInTheDocument()
      expect(screen.getByText('November 2025')).toBeInTheDocument()
    })
  })

  describe('Create Task', () => {
    it('should have new task button', () => {
      render(<TaskCalendar />)

      expect(screen.getByRole('button', { name: /new task/i })).toBeInTheDocument()
    })
  })

  describe('Task Interactions', () => {
    it('should display tasks in calendar', () => {
      render(<TaskCalendar />)

      // Tasks should be visible
      expect(screen.getByText('Test Task 1')).toBeInTheDocument()
      expect(screen.getByText('Completed Task')).toBeInTheDocument()
      expect(screen.getByText('Overdue Task')).toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('should show empty state when no tasks exist', () => {
      vi.mocked(hooks.useCalendarTasks).mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<TaskCalendar />)

      // Calendar should still render, just without tasks
      expect(screen.getByText('November 2025')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible month/year heading', () => {
      render(<TaskCalendar />)

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('November 2025')
    })

    it('should have accessible buttons', () => {
      render(<TaskCalendar />)

      expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /calendar/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /agenda/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /new task/i })).toBeInTheDocument()
    })
  })
})
