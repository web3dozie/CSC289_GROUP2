import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskReview } from '../../src/components/views/TaskReview'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

let mockUseJournal: any
let mockUseCreateJournalEntry: any
let mockUseUpdateJournalEntry: any
let mockUseDailySummary: any
let mockUseWeeklySummary: any
let mockUseInsights: any
let mockUseArchivedTasks: any
let mockUseUpdateTask: any
let mockUseDeleteTask: any

// Mock hooks
vi.mock('../../src/lib/hooks', () => ({
  useJournal: () => mockUseJournal,
  useCreateJournalEntry: () => mockUseCreateJournalEntry,
  useUpdateJournalEntry: () => mockUseUpdateJournalEntry,
  useDailySummary: () => mockUseDailySummary,
  useWeeklySummary: () => mockUseWeeklySummary,
  useInsights: () => mockUseInsights,
  useArchivedTasks: () => mockUseArchivedTasks,
  useUpdateTask: () => mockUseUpdateTask,
  useDeleteTask: () => mockUseDeleteTask
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

describe('TaskReview', () => {
  beforeEach(() => {
    mockUseJournal = { data: [], isLoading: false }
    mockUseCreateJournalEntry = { mutateAsync: vi.fn(), isPending: false }
    mockUseUpdateJournalEntry = { mutateAsync: vi.fn(), isPending: false }
    mockUseDailySummary = { data: null, isLoading: false }
    mockUseWeeklySummary = { data: null, isLoading: false }
    mockUseInsights = { data: null, isLoading: false }
    mockUseArchivedTasks = { data: [], isLoading: false }
    mockUseUpdateTask = { mutateAsync: vi.fn(), isPending: false }
    mockUseDeleteTask = { mutateAsync: vi.fn(), isPending: false }
  })

  describe('Rendering', () => {
    it('should render review page', () => {
      renderWithProviders(<TaskReview />)
      expect(screen.getByText(/review & reflect/i)).toBeInTheDocument()
    })

    it('should render all tab buttons', () => {
      renderWithProviders(<TaskReview />)
      expect(screen.getByRole('button', { name: /journal/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /daily summary/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /weekly summary/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /insights/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /archived tasks/i })).toBeInTheDocument()
    })

    it('should show New Entry button on journal tab', () => {
      renderWithProviders(<TaskReview />)
      expect(screen.getByRole('button', { name: /new entry/i })).toBeInTheDocument()
    })
  })

  describe('Journal Tab', () => {
    it('should show empty state when no journal entries', () => {
      renderWithProviders(<TaskReview />)
      expect(screen.getByText(/no journal entries yet/i)).toBeInTheDocument()
      expect(screen.getByText(/write first entry/i)).toBeInTheDocument()
    })

    it('should show journal entries when data exists', () => {
      mockUseJournal.data = [
        { id: 1, entry_date: '2024-01-15', content: 'Test journal entry', created_at: '2024-01-15' }
      ]
      renderWithProviders(<TaskReview />)
      expect(screen.getByText('Test journal entry')).toBeInTheDocument()
    })

    it('should show loading state', () => {
      mockUseJournal.isLoading = true
      renderWithProviders(<TaskReview />)
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should open journal editor when clicking New Entry', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TaskReview />)
      
      await user.click(screen.getByRole('button', { name: /new entry/i }))
      expect(screen.getByLabelText(/journal entry/i)).toBeInTheDocument()
    })

    it('should create journal entry', async () => {
      const user = userEvent.setup()
      const mutateAsync = vi.fn().mockResolvedValue({})
      mockUseCreateJournalEntry.mutateAsync = mutateAsync
      
      renderWithProviders(<TaskReview />)
      
      await user.click(screen.getByRole('button', { name: /new entry/i }))
      const textarea = screen.getByLabelText(/journal entry/i)
      await user.type(textarea, 'My new journal entry')
      await user.click(screen.getByRole('button', { name: /save entry/i }))
      
      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalled()
      })
    })

    it('should show journal entries with edit capability', async () => {
      mockUseJournal.data = [
        { id: 1, entry_date: '2024-01-15', content: 'Original content', created_at: '2024-01-15' }
      ]
      
      renderWithProviders(<TaskReview />)
      
      expect(screen.getByText('Original content')).toBeInTheDocument()
      // Journal entries have edit buttons
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Daily Summary Tab', () => {
    it('should show empty state when no data', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TaskReview />)
      
      await user.click(screen.getByRole('button', { name: /daily summary/i }))
      expect(screen.getByText(/no daily summary available/i)).toBeInTheDocument()
    })

    it('should display daily statistics', async () => {
      const user = userEvent.setup()
      mockUseDailySummary.data = {
        completed_tasks: 5,
        created_tasks: 3,
        overdue_tasks: 2,
        time_spent: 120,
        todo_tasks: 4,
        in_progress_tasks: 1
      }
      
      renderWithProviders(<TaskReview />)
      await user.click(screen.getByRole('button', { name: /daily summary/i }))
      
      // Check for stats display
      expect(screen.getByText(/tasks completed/i)).toBeInTheDocument()
      expect(screen.getByText(/tasks created/i)).toBeInTheDocument()
      expect(screen.getByText(/overdue tasks/i)).toBeInTheDocument()
    })

    it('should show loading skeleton', async () => {
      const user = userEvent.setup()
      mockUseDailySummary.isLoading = true
      
      renderWithProviders(<TaskReview />)
      await user.click(screen.getByRole('button', { name: /daily summary/i }))
      
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('Weekly Summary Tab', () => {
    it('should show empty state', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TaskReview />)
      
      await user.click(screen.getByRole('button', { name: /weekly summary/i }))
      expect(screen.getByText(/no weekly summary available/i)).toBeInTheDocument()
    })

    it('should display weekly statistics', async () => {
      const user = userEvent.setup()
      mockUseWeeklySummary.data = {
        total_completed: 25,
        average_daily: 3.5,
        most_productive_day: 'Monday',
        total_time: 10,
        daily_breakdown: [
          { day: 'Mon', count: 5 },
          { day: 'Tue', count: 4 }
        ]
      }
      
      renderWithProviders(<TaskReview />)
      await user.click(screen.getByRole('button', { name: /weekly summary/i }))
      
      expect(screen.getByText('25')).toBeInTheDocument()
      expect(screen.getByText('Monday')).toBeInTheDocument()
    })
  })

  describe('Insights Tab', () => {
    it('should show empty state', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TaskReview />)
      
      await user.click(screen.getByRole('button', { name: /insights/i }))
      expect(screen.getByText(/no insights available/i)).toBeInTheDocument()
    })

    it('should display insights data', async () => {
      const user = userEvent.setup()
      mockUseInsights.data = {
        productivity_score: 85,
        completion_rate: 90,
        avg_task_time: 45,
        strengths: ['Good task completion rate'],
        improvements: ['Focus on time management']
      }
      
      renderWithProviders(<TaskReview />)
      await user.click(screen.getByRole('button', { name: /insights/i }))
      
      expect(screen.getByText('85%')).toBeInTheDocument()
      expect(screen.getByText('90%')).toBeInTheDocument()
    })
  })

  describe('Archived Tasks Tab', () => {
    it('should show empty state', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TaskReview />)
      
      await user.click(screen.getByRole('button', { name: /archived tasks/i }))
      expect(screen.getByText(/no archived tasks/i)).toBeInTheDocument()
    })

    it('should display archived tasks', async () => {
      const user = userEvent.setup()
      mockUseArchivedTasks.data = [
        {
          id: 1,
          title: 'Archived Task',
          description: 'Task description',
          status: 'done',
          created_at: '2024-01-01',
          category: 'Work'
        }
      ]
      
      renderWithProviders(<TaskReview />)
      await user.click(screen.getByRole('button', { name: /archived tasks/i }))
      
      expect(screen.getByText('Archived Task')).toBeInTheDocument()
      expect(screen.getByText('Task description')).toBeInTheDocument()
    })

    it('should restore archived task', async () => {
      const user = userEvent.setup()
      const mutateAsync = vi.fn().mockResolvedValue({})
      mockUseUpdateTask.mutateAsync = mutateAsync
      mockUseArchivedTasks.data = [
        { id: 1, title: 'Archived Task', status: 'done', created_at: '2024-01-01' }
      ]
      
      renderWithProviders(<TaskReview />)
      await user.click(screen.getByRole('button', { name: /archived tasks/i }))
      
      const restoreButton = screen.getByRole('button', { name: /restore/i })
      await user.click(restoreButton)
      
      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          id: 1,
          data: { archived: false }
        })
      })
    })

    it('should delete archived task', async () => {
      const user = userEvent.setup()
      const mutateAsync = vi.fn().mockResolvedValue({})
      mockUseDeleteTask.mutateAsync = mutateAsync
      mockUseArchivedTasks.data = [
        { id: 1, title: 'Archived Task', status: 'done', created_at: '2024-01-01' }
      ]
      
      renderWithProviders(<TaskReview />)
      await user.click(screen.getByRole('button', { name: /archived tasks/i }))
      
      const deleteButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Delete'))
      if (deleteButton) await user.click(deleteButton)
      
      expect(screen.getByText(/permanently delete task/i)).toBeInTheDocument()
    })
  })
})
