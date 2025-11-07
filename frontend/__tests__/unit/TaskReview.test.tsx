import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TaskReview } from '../../src/components/views/TaskReview'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

// Mock hooks
vi.mock('../../lib/hooks', () => ({
  useJournal: () => ({ data: [], isLoading: false, error: null }),
  useCreateJournalEntry: () => ({ mutate: vi.fn(), isLoading: false }),
  useUpdateJournalEntry: () => ({ mutate: vi.fn(), isLoading: false }),
  useDailySummary: () => ({ data: null, isLoading: false }),
  useWeeklySummary: () => ({ data: null, isLoading: false }),
  useInsights: () => ({ data: null, isLoading: false }),
  useArchivedTasks: () => ({ data: [], isLoading: false }),
  useUpdateTask: () => ({ mutate: vi.fn(), isLoading: false }),
  useDeleteTask: () => ({ mutate: vi.fn(), isLoading: false })
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('TaskReview', () => {
  describe('Rendering', () => {
    it('should render review page', () => {
      renderWithProviders(<TaskReview />)
      expect(screen.getByText(/review & reflect/i)).toBeInTheDocument()
    })

    it('should render journal tab', () => {
      renderWithProviders(<TaskReview />)
      expect(screen.getByRole('button', { name: /journal/i })).toBeInTheDocument()
    })

    it('should render daily summary tab', () => {
      renderWithProviders(<TaskReview />)
      expect(screen.getByRole('button', { name: /daily summary/i })).toBeInTheDocument()
    })

    it('should render weekly summary tab', () => {
      renderWithProviders(<TaskReview />)
      expect(screen.getByRole('button', { name: /weekly summary/i })).toBeInTheDocument()
    })

    it('should render insights tab', () => {
      renderWithProviders(<TaskReview />)
      expect(screen.getByRole('button', { name: /insights/i })).toBeInTheDocument()
    })
  })
})
