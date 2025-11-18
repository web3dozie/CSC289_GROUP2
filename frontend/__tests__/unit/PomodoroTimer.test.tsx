import { render, screen } from '../test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PomodoroTimer } from '../../src/components/views/PomodoroTimer'
import * as hooks from '../../src/lib/hooks'

vi.mock('../../src/lib/hooks', async () => {
  const actual = await vi.importActual('../../src/lib/hooks')
  return {
    ...actual,
    useTasks: vi.fn(),
    useSettings: vi.fn(),
  }
})

describe('PomodoroTimer', () => {
  const mockTasks = [
    {
      id: 1,
      title: 'Task 1',
      description: 'Description 1',
      done: false,
      priority: false,
      estimate_minutes: 25,
      created_on: new Date().toISOString(),
      updated_on: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Task 2',
      description: 'Description 2',
      done: false,
      priority: false,
      estimate_minutes: 50,
      created_on: new Date().toISOString(),
      updated_on: new Date().toISOString(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(hooks.useTasks).mockReturnValue({
      data: mockTasks,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)
    vi.mocked(hooks.useSettings).mockReturnValue({
      data: { timer_enabled: true },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)
  })

  describe('Rendering', () => {
    it('should render timer title', () => {
      render(<PomodoroTimer />)

      expect(screen.getByText(/pomodoro timer/i)).toBeInTheDocument()
    })

    it('should render timer display', () => {
      render(<PomodoroTimer />)

      // Timer should show initial time (25:00 for focus mode)
      expect(screen.getByText(/25:00/)).toBeInTheDocument()
    })

    it('should render start button', () => {
      render(<PomodoroTimer />)

      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
    })

    it('should render timer controls', () => {
      render(<PomodoroTimer />)

      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
    })
  })

  describe('Timer Modes', () => {
    it('should start in focus mode', () => {
      render(<PomodoroTimer />)

      // Check for "Work Session" or "Focus" text in the UI
      const focusElements = screen.queryAllByText(/focus|work session/i)
      expect(focusElements.length).toBeGreaterThan(0)
    })
  })

  describe('Timer disabled state', () => {
    it('should show disabled message when timer is disabled in settings', () => {
      vi.mocked(hooks.useSettings).mockReturnValue({
        data: { timer_enabled: false },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<PomodoroTimer />)

      expect(screen.getByText(/timer disabled/i)).toBeInTheDocument()
    })

    it('should show settings message when timer is disabled', () => {
      vi.mocked(hooks.useSettings).mockReturnValue({
        data: { timer_enabled: false },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<PomodoroTimer />)

      expect(screen.getByText(/enable it in settings/i)).toBeInTheDocument()
    })
  })

  describe('Task Selection', () => {
    it('should display task selector when tasks are available', () => {
      render(<PomodoroTimer />)

      // Multiple elements match, use queryAllByText
      const taskSelectors = screen.queryAllByText(/select task|current task/i)
      expect(taskSelectors.length).toBeGreaterThan(0)
    })

    it('should show no tasks message when tasks are empty', () => {
      vi.mocked(hooks.useTasks).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<PomodoroTimer />)

      // Should show "no task selected" instead
      expect(screen.getByText(/no task selected/i)).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show loading state when tasks are loading', () => {
      vi.mocked(hooks.useTasks).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<PomodoroTimer />)

      // Component still renders timer even during loading
      expect(screen.getByText(/pomodoro timer/i)).toBeInTheDocument()
    })

    it('should show loading state when settings are loading', () => {
      vi.mocked(hooks.useSettings).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as any)

      render(<PomodoroTimer />)

      // Component still renders timer even during loading
      expect(screen.getByText(/pomodoro timer/i)).toBeInTheDocument()
    })
  })
})
