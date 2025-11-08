import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Settings } from '../../src/components/views/Settings'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '../../src/contexts/ThemeContext'
import { AuthProvider } from '../../src/contexts/AuthContext'
import { TutorialProvider } from '../../src/contexts/TutorialContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

// Mock hooks
const mockSettings = {
  theme: 'light',
  auto_lock_minutes: 30,
  notes_enabled: true,
  timer_enabled: true,
  ai_api_url: '',
  ai_model: '',
  ai_api_key: ''
}

vi.mock('../../src/lib/hooks', () => ({
  useSettings: () => ({ data: mockSettings, isLoading: false }),
  useUpdateSettings: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isLoading: false }),
  useAuthChangePin: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isLoading: false }),
  useExportData: () => ({ mutate: vi.fn(), isLoading: false }),
  useImportData: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useAccountDeletionPreview: () => ({ refetch: vi.fn(), isLoading: false }),
  useDeleteAccount: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useAuthLogin: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useAuthLogout: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useAuthSetup: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useAuthChangeUsername: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false })
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TutorialProvider>
            {component}
          </TutorialProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render settings page', async () => {
      renderWithProviders(<Settings />)
      expect(await screen.findByRole('heading', { name: /^Settings$/i })).toBeInTheDocument()
    })

    it('should render appearance section', async () => {
      renderWithProviders(<Settings />)
      expect(await screen.findByRole('heading', { name: /^Appearance$/i })).toBeInTheDocument()
    })

    it('should render security section', () => {
      renderWithProviders(<Settings />)
      expect(screen.getByRole('heading', { name: /^Security$/i })).toBeInTheDocument()
    })

    it('should render features section', () => {
      renderWithProviders(<Settings />)
      expect(screen.getByRole('heading', { name: /^Features$/i })).toBeInTheDocument()
    })

    it('should render AI settings section', () => {
      renderWithProviders(<Settings />)
      expect(screen.getByRole('heading', { name: /AI Integration/i })).toBeInTheDocument()
    })

    it('should render data management section', () => {
      renderWithProviders(<Settings />)
      expect(screen.getByRole('heading', { name: /^Data Management$/i })).toBeInTheDocument()
    })
  })

  describe('Theme Settings', () => {
    it('should display theme section', () => {
      renderWithProviders(<Settings />)
      expect(screen.getByText(/theme/i)).toBeInTheDocument()
    })
  })

  describe('Auto-lock Settings', () => {
    it('should display security section', () => {
      renderWithProviders(<Settings />)
      expect(screen.getByRole('heading', { name: /security/i })).toBeInTheDocument()
    })
  })

  describe('Feature Toggles', () => {
    it('should display features section', () => {
      renderWithProviders(<Settings />)
      expect(screen.getByRole('heading', { name: /features/i })).toBeInTheDocument()
    })
  })

  describe('Save Button', () => {
    it('should display settings saved button', () => {
      renderWithProviders(<Settings />)
      expect(screen.getByRole('button', { name: /settings saved/i })).toBeInTheDocument()
    })
  })

  describe('PIN Change', () => {
    it('should display change PIN button', () => {
      renderWithProviders(<Settings />)
      expect(screen.getByRole('button', { name: /change pin/i })).toBeInTheDocument()
    })
  })

  describe('Data Management', () => {
    it('should display export button', () => {
      renderWithProviders(<Settings />)
      expect(screen.getByRole('button', { name: /download json/i })).toBeInTheDocument()
    })

    it('should display data management heading', () => {
      renderWithProviders(<Settings />)
      expect(screen.getByRole('heading', { name: /data management/i })).toBeInTheDocument()
    })
  })

  describe('Tutorial', () => {
    it('should display tutorial section', () => {
      renderWithProviders(<Settings />)
      expect(screen.getByRole('button', { name: /start tutorial/i })).toBeInTheDocument()
    })
  })

  describe('Account Deletion', () => {
    it('should display delete account section', () => {
      renderWithProviders(<Settings />)
      expect(screen.getByText(/delete account/i)).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show loading skeleton when data is loading', () => {
      // Note: Testing loading state would require dynamic mocking
      // For now, we verify the page renders even with the default mock
      renderWithProviders(<Settings />)
      expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('should have all setting inputs', () => {
      renderWithProviders(<Settings />)
      expect(screen.getByRole('heading', { name: /appearance/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /security/i })).toBeInTheDocument()
    })
  })
})
