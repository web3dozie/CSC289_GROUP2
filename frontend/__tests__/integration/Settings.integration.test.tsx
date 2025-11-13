import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { Settings } from '../../src/components/views/Settings'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'
import { ThemeProvider } from '../../src/contexts/ThemeContext'
import { TutorialProvider } from '../../src/contexts/TutorialContext'

// Wrapper component that includes ThemeProvider and TutorialProvider
const SettingsWithProviders = () => (
  <ThemeProvider>
    <TutorialProvider>
      <Settings />
    </TutorialProvider>
  </ThemeProvider>
)

describe('Settings Integration Tests', () => {
  beforeEach(() => {
    // Reset handlers before each test
    server.resetHandlers()

    // Mock window.alert
    vi.spyOn(window, 'alert').mockImplementation(() => {})

    // Mock window.matchMedia for theme detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    // Clear localStorage before each test
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('AI Configuration (3-Field Model)', () => {
    it('loads and displays empty AI configuration fields', async () => {
      // Setup: Return empty AI config
      server.use(
        http.get('/api/settings', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notes_enabled: true,
              timer_enabled: true,
              ai_api_url: '',
              ai_model: '',
              ai_api_key: '',
              auto_lock_minutes: 10,
              theme: 'light',
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      render(<SettingsWithProviders />)

      // Wait for settings to load
      await waitFor(() => {
        expect(screen.getByText('AI Integration')).toBeInTheDocument()
      })

      // Verify all 3 AI fields are present by their placeholders
      const apiUrlInput = screen.getByPlaceholderText(/generativelanguage\.googleapis\.com/i)
      const modelInput = screen.getByPlaceholderText(/gemini-2\.0-flash/i)
      const apiKeyInput = screen.getByPlaceholderText(/your api key/i)

      expect(apiUrlInput).toBeInTheDocument()
      expect(modelInput).toBeInTheDocument()
      expect(apiKeyInput).toBeInTheDocument()

      // Verify fields are empty
      expect(apiUrlInput).toHaveValue('')
      expect(modelInput).toHaveValue('')
      expect(apiKeyInput).toHaveValue('')
    })

    it('saves 3-field AI configuration successfully', async () => {
      const user = userEvent.setup()

      // Setup: Return empty AI config initially
      server.use(
        http.get('/api/settings', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notes_enabled: true,
              timer_enabled: true,
              ai_api_url: '',
              ai_model: '',
              ai_api_key: '',
              auto_lock_minutes: 10,
              theme: 'light',
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      render(<SettingsWithProviders />)

      // Wait for settings to load
      await waitFor(() => {
        expect(screen.getByText('AI Integration')).toBeInTheDocument()
      })

      // Fill in AI config fields
      const apiUrlInput = screen.getByPlaceholderText(/generativelanguage\.googleapis\.com/i)
      const modelInput = screen.getByPlaceholderText(/gemini-2\.0-flash/i)
      const apiKeyInput = screen.getByPlaceholderText(/your api key/i)

      await user.clear(apiUrlInput)
      await user.type(apiUrlInput, 'https://generativelanguage.googleapis.com/v1beta/openai')

      await user.clear(modelInput)
      await user.type(modelInput, 'gemini-2.0-flash')

      await user.clear(apiKeyInput)
      await user.type(apiKeyInput, 'test-api-key-xyz123')

      // Mock the save endpoint
      let savedData: any = null
      server.use(
        http.put('/api/settings', async ({ request }) => {
          savedData = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              notes_enabled: true,
              timer_enabled: true,
              ai_api_url: savedData.ai_api_url,
              ai_model: savedData.ai_model,
              ai_api_key: savedData.ai_api_key,
              auto_lock_minutes: 10,
              theme: 'light',
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      // Click Save Settings button
      const saveButton = screen.getByRole('button', { name: /save settings/i })
      await user.click(saveButton)

      // Verify API was called with correct data
      await waitFor(() => {
        expect(savedData).toBeTruthy()
        expect(savedData.ai_api_url).toBe('https://generativelanguage.googleapis.com/v1beta/openai')
        expect(savedData.ai_model).toBe('gemini-2.0-flash')
        expect(savedData.ai_api_key).toBe('test-api-key-xyz123')
      })

      // Verify success alert was shown
      expect(window.alert).toHaveBeenCalledWith('Settings saved successfully!')
    })

    it('loads and displays pre-filled AI configuration', async () => {
      // Setup: Return pre-filled AI config
      server.use(
        http.get('/api/settings', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notes_enabled: true,
              timer_enabled: true,
              ai_api_url: 'https://api.openai.com/v1/chat/completions',
              ai_model: 'gpt-4',
              ai_api_key: 'sk-existing-key-123',
              auto_lock_minutes: 10,
              theme: 'dark',
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      render(<SettingsWithProviders />)

      // Wait for settings to load
      await waitFor(() => {
        expect(screen.getByText('AI Integration')).toBeInTheDocument()
      })

      // Verify fields are pre-filled
      const apiUrlInput = screen.getByPlaceholderText(/generativelanguage\.googleapis\.com/i) as HTMLInputElement
      const modelInput = screen.getByPlaceholderText(/gemini-2\.0-flash/i) as HTMLInputElement
      const apiKeyInput = screen.getByPlaceholderText(/your api key/i) as HTMLInputElement

      await waitFor(() => {
        expect(apiUrlInput.value).toBe('https://api.openai.com/v1/chat/completions')
        expect(modelInput.value).toBe('gpt-4')
        expect(apiKeyInput.value).toBe('sk-existing-key-123')
      })
    })

    it('updates AI configuration fields independently', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/settings', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notes_enabled: true,
              timer_enabled: true,
              ai_api_url: 'https://api.openai.com/v1',
              ai_model: 'gpt-3.5-turbo',
              ai_api_key: 'sk-old-key',
              auto_lock_minutes: 10,
              theme: 'light',
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      render(<SettingsWithProviders />)

      await waitFor(() => {
        expect(screen.getByText('AI Integration')).toBeInTheDocument()
      })

      // Update only the model field
      const modelInput = screen.getByPlaceholderText(/gemini-2\.0-flash/i) as HTMLInputElement
      
      // Triple-click to select all text, then type to replace
      await user.tripleClick(modelInput)
      await user.keyboard('gpt-4o-mini')

      let savedData: any = null
      server.use(
        http.put('/api/settings', async ({ request }) => {
          savedData = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              ...savedData,
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      const saveButton = screen.getByRole('button', { name: /save settings/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(savedData).toBeTruthy()
        expect(savedData.ai_api_url).toBe('https://api.openai.com/v1')
        expect(savedData.ai_model).toBe('gpt-4o-mini')
        expect(savedData.ai_api_key).toBe('sk-old-key')
      })
    })
  })

  describe('Theme Settings', () => {
    it('changes theme and saves successfully', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/settings', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notes_enabled: true,
              timer_enabled: true,
              ai_api_url: '',
              ai_model: '',
              ai_api_key: '',
              auto_lock_minutes: 10,
              theme: 'light',
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      render(<SettingsWithProviders />)

      await waitFor(() => {
        expect(screen.getByText('Appearance')).toBeInTheDocument()
      })

      // Find and click dark theme option
      const darkThemeLabel = screen.getByText('Dark').closest('label')
      expect(darkThemeLabel).toBeInTheDocument()

      if (darkThemeLabel) {
        await user.click(darkThemeLabel)
      }

      // Mock save
      let savedData: any = null
      server.use(
        http.put('/api/settings', async ({ request }) => {
          savedData = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              ...savedData,
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      // Click Save
      const saveButton = screen.getByRole('button', { name: /save settings/i })
      await user.click(saveButton)

      // Verify theme was saved
      await waitFor(() => {
        expect(savedData?.theme).toBe('dark')
      })
    })

    it('selects auto theme correctly', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/settings', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notes_enabled: true,
              timer_enabled: true,
              ai_api_url: '',
              ai_model: '',
              ai_api_key: '',
              auto_lock_minutes: 10,
              theme: 'light',
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      render(<SettingsWithProviders />)

      await waitFor(() => {
        expect(screen.getByText('Appearance')).toBeInTheDocument()
      })

      // Click auto theme option
      const autoThemeLabel = screen.getByText('Auto').closest('label')

      if (autoThemeLabel) {
        await user.click(autoThemeLabel)
      }

      let savedData: any = null
      server.use(
        http.put('/api/settings', async ({ request }) => {
          savedData = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              ...savedData,
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      const saveButton = screen.getByRole('button', { name: /save settings/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(savedData?.theme).toBe('auto')
      })
    })
  })

  describe('Auto-lock Settings', () => {
    it('updates auto-lock minutes', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/settings', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notes_enabled: true,
              timer_enabled: true,
              ai_api_url: '',
              ai_model: '',
              ai_api_key: '',
              auto_lock_minutes: 10,
              theme: 'light',
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      render(<SettingsWithProviders />)

      await waitFor(() => {
        expect(screen.getByText('Security')).toBeInTheDocument()
      })

      // Find auto-lock select by finding the select element in the Security section
      const securitySection = screen.getByText('Security').closest('.bg-white')
      const autoLockSelect = securitySection?.querySelector('select') as HTMLSelectElement

      // Change to 30 minutes
      await user.selectOptions(autoLockSelect, '30')

      // Mock save
      let savedData: any = null
      server.use(
        http.put('/api/settings', async ({ request }) => {
          savedData = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              ...savedData,
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      // Click Save
      const saveButton = screen.getByRole('button', { name: /save settings/i })
      await user.click(saveButton)

      // Verify auto-lock was updated
      await waitFor(() => {
        expect(savedData?.auto_lock_minutes).toBe(30)
      })
    })

    it('sets auto-lock to never (0 minutes)', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/settings', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notes_enabled: true,
              timer_enabled: true,
              ai_api_url: '',
              ai_model: '',
              ai_api_key: '',
              auto_lock_minutes: 30,
              theme: 'light',
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      render(<SettingsWithProviders />)

      await waitFor(() => {
        expect(screen.getByText('Security')).toBeInTheDocument()
      })

      const securitySection = screen.getByText('Security').closest('.bg-white')
      const autoLockSelect = securitySection?.querySelector('select') as HTMLSelectElement
      await user.selectOptions(autoLockSelect, '0')

      let savedData: any = null
      server.use(
        http.put('/api/settings', async ({ request }) => {
          savedData = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              ...savedData,
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      const saveButton = screen.getByRole('button', { name: /save settings/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(savedData?.auto_lock_minutes).toBe(0)
      })
    })
  })

  describe('Feature Toggles', () => {
    it('toggles notes feature off and saves', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/settings', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notes_enabled: true,
              timer_enabled: true,
              ai_api_url: '',
              ai_model: '',
              ai_api_key: '',
              auto_lock_minutes: 10,
              theme: 'light',
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      render(<SettingsWithProviders />)

      await waitFor(() => {
        expect(screen.getByText('Features')).toBeInTheDocument()
      }, { timeout: 5000 })

      // Wait for data to load and state to update
      await waitFor(() => {
        const notesText = screen.getByText('Task Notes')
        const toggleContainer = notesText.closest('.flex')
        const notesToggle = toggleContainer?.querySelector('input[type="checkbox"]') as HTMLInputElement
        expect(notesToggle).toBeInTheDocument()
      })

      // Find notes toggle by searching for the text nearby
      const notesText = screen.getByText('Task Notes')
      const toggleContainer = notesText.closest('.flex')
      const notesToggle = toggleContainer?.querySelector('input[type="checkbox"]') as HTMLInputElement

      expect(notesToggle).toBeChecked()

      // Toggle notes off
      await user.click(notesToggle)

      // Mock save
      let savedData: any = null
      server.use(
        http.put('/api/settings', async ({ request }) => {
          savedData = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              ...savedData,
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      // Click Save
      const saveButton = screen.getByRole('button', { name: /save settings/i })
      await user.click(saveButton)

      // Verify notes was toggled off
      await waitFor(() => {
        expect(savedData).toBeTruthy()
        expect(savedData.notes_enabled).toBe(false)
      })
    })

    it('toggles timer feature off and saves', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/settings', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notes_enabled: true,
              timer_enabled: true,
              ai_api_url: '',
              ai_model: '',
              ai_api_key: '',
              auto_lock_minutes: 10,
              theme: 'light',
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      render(<SettingsWithProviders />)

      await waitFor(() => {
        expect(screen.getByText('Features')).toBeInTheDocument()
      }, { timeout: 5000 })

      // Wait for data to load and state to update
      await waitFor(() => {
        const timerText = screen.getByText('Pomodoro Timer')
        const toggleContainer = timerText.closest('.flex')
        const timerToggle = toggleContainer?.querySelector('input[type="checkbox"]') as HTMLInputElement
        expect(timerToggle).toBeInTheDocument()
      })

      // Find timer toggle
      const timerText = screen.getByText('Pomodoro Timer')
      const toggleContainer = timerText.closest('.flex')
      const timerToggle = toggleContainer?.querySelector('input[type="checkbox"]') as HTMLInputElement

      expect(timerToggle).toBeChecked()

      // Toggle timer off
      await user.click(timerToggle)

      let savedData: any = null
      server.use(
        http.put('/api/settings', async ({ request }) => {
          savedData = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              ...savedData,
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      const saveButton = screen.getByRole('button', { name: /save settings/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(savedData).toBeTruthy()
        expect(savedData.timer_enabled).toBe(false)
      })
    })

    it('toggles both features on and off', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/settings', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notes_enabled: false,
              timer_enabled: false,
              ai_api_url: '',
              ai_model: '',
              ai_api_key: '',
              auto_lock_minutes: 10,
              theme: 'light',
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      render(<SettingsWithProviders />)

      await waitFor(() => {
        expect(screen.getByText('Features')).toBeInTheDocument()
      })

      // Find both toggles
      const notesText = screen.getByText('Task Notes')
      const notesContainer = notesText.closest('.flex')
      const notesToggle = notesContainer?.querySelector('input[type="checkbox"]') as HTMLInputElement

      const timerText = screen.getByText('Pomodoro Timer')
      const timerContainer = timerText.closest('.flex')
      const timerToggle = timerContainer?.querySelector('input[type="checkbox"]') as HTMLInputElement

      // Both should be unchecked initially
      expect(notesToggle).not.toBeChecked()
      expect(timerToggle).not.toBeChecked()

      // Toggle both on
      await user.click(notesToggle)
      await user.click(timerToggle)

      let savedData: any = null
      server.use(
        http.put('/api/settings', async ({ request }) => {
          savedData = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              ...savedData,
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      const saveButton = screen.getByRole('button', { name: /save settings/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(savedData).toBeTruthy()
        expect(savedData.notes_enabled).toBe(true)
        expect(savedData.timer_enabled).toBe(true)
      })
    })
  })

  describe('Complete Settings Workflow', () => {
    it('updates all settings fields together and saves', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/settings', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notes_enabled: false,
              timer_enabled: false,
              ai_api_url: '',
              ai_model: '',
              ai_api_key: '',
              auto_lock_minutes: 10,
              theme: 'light',
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      render(<SettingsWithProviders />)

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument()
      })

      // Change theme to dark
      const darkThemeLabel = screen.getByText('Dark').closest('label')
      if (darkThemeLabel) {
        await user.click(darkThemeLabel)
      }

      // Change auto-lock to 60 minutes
      const securitySection = screen.getByText('Security').closest('.bg-white')
      const autoLockSelect = securitySection?.querySelector('select') as HTMLSelectElement
      await user.selectOptions(autoLockSelect, '60')

      // Toggle features on
      const notesText = screen.getByText('Task Notes')
      const notesContainer = notesText.closest('.flex')
      const notesToggle = notesContainer?.querySelector('input[type="checkbox"]') as HTMLInputElement
      await user.click(notesToggle)

      const timerText = screen.getByText('Pomodoro Timer')
      const timerContainer = timerText.closest('.flex')
      const timerToggle = timerContainer?.querySelector('input[type="checkbox"]') as HTMLInputElement
      await user.click(timerToggle)

      // Fill AI config
      const apiUrlInput = screen.getByPlaceholderText(/generativelanguage\.googleapis\.com/i)
      const modelInput = screen.getByPlaceholderText(/gemini-2\.0-flash/i)
      const apiKeyInput = screen.getByPlaceholderText(/your api key/i)

      await user.type(apiUrlInput, 'https://api.openai.com/v1')
      await user.type(modelInput, 'gpt-4o')
      await user.type(apiKeyInput, 'sk-test-key-123')

      // Save all changes
      let savedData: any = null
      server.use(
        http.put('/api/settings', async ({ request }) => {
          savedData = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              ...savedData,
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      const saveButton = screen.getByRole('button', { name: /save settings/i })
      await user.click(saveButton)

      // Verify all settings were saved correctly
      await waitFor(() => {
        expect(savedData).toBeTruthy()
        expect(savedData.theme).toBe('dark')
        expect(savedData.auto_lock_minutes).toBe(60)
        expect(savedData.notes_enabled).toBe(true)
        expect(savedData.timer_enabled).toBe(true)
        expect(savedData.ai_api_url).toBe('https://api.openai.com/v1')
        expect(savedData.ai_model).toBe('gpt-4o')
        expect(savedData.ai_api_key).toBe('sk-test-key-123')
      })

      expect(window.alert).toHaveBeenCalledWith('Settings saved successfully!')
    })
  })

  describe('Error Handling', () => {
    it('shows error message when save fails', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/settings', () => {
          return HttpResponse.json({
            success: true,
            data: {
              notes_enabled: true,
              timer_enabled: true,
              ai_api_url: '',
              ai_model: '',
              ai_api_key: '',
              auto_lock_minutes: 10,
              theme: 'light',
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      render(<SettingsWithProviders />)

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument()
      })

      // Make a change
      const securitySection = screen.getByText('Security').closest('.bg-white')
      const autoLockSelect = securitySection?.querySelector('select') as HTMLSelectElement
      await user.selectOptions(autoLockSelect, '30')

      // Mock failed save
      server.use(
        http.put('/api/settings', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      const saveButton = screen.getByRole('button', { name: /save settings/i })
      await user.click(saveButton)

      // Verify error alert was shown
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to save settings. Please try again.')
      })
    })

    it('loads settings with loading state', async () => {
      server.use(
        http.get('/api/settings', async () => {
          // Delay response to show loading state
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json({
            success: true,
            data: {
              notes_enabled: true,
              timer_enabled: true,
              ai_api_url: '',
              ai_model: '',
              ai_api_key: '',
              auto_lock_minutes: 10,
              theme: 'light',
              updated_on: new Date().toISOString()
            }
          })
        })
      )

      render(<SettingsWithProviders />)

      // Check for loading state (skeleton or loading indicators)
      // The component shows an animated pulse skeleton during loading
      const loadingElements = screen.getAllByRole('generic').filter(el =>
        el.className.includes('animate-pulse')
      )
      expect(loadingElements.length).toBeGreaterThan(0)

      // Wait for actual content to load
      await waitFor(() => {
        expect(screen.getByText('AI Integration')).toBeInTheDocument()
      })
    })
  })
})
