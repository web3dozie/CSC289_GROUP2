import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock the hooks
vi.mock('../../src/lib/hooks', () => ({
  useAuthLogin: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
  useAuthLogout: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
  useAuthSetup: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
  useAuthChangePin: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
  useAuthChangeUsername: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
  useSettings: vi.fn(() => ({ data: null })),
}))

// Mock the settingsApi
vi.mock('../../src/lib/api', () => ({
  settingsApi: {
    getSettings: vi.fn().mockResolvedValue({
      theme: 'light',
      auto_lock_minutes: 0,
      notes_enabled: true,
      timer_enabled: true,
    }),
    validateSession: vi.fn().mockResolvedValue({ success: true }),
  },
  authApi: {
    validateSession: vi.fn().mockResolvedValue({ success: true }),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    // Don't use fake timers as they interfere with async operations
  })

  afterEach(() => {
    // Cleanup
  })

  describe('Initialization', () => {
    it('should initialize with no user and not authenticated', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

      // Wait for initialization to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLocked).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should throw error when useAuth is used outside AuthProvider', () => {
      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')
    })

    it('should restore user from localStorage if session is valid', async () => {
      const mockUser = { id: 1, username: 'testuser' }
      localStorage.setItem('taskline_auth', JSON.stringify({ user: mockUser }))

      const { settingsApi } = await import('../../src/lib/api')
      vi.mocked(settingsApi.getSettings).mockResolvedValueOnce({
        theme: 'light',
        auto_lock_minutes: 0,
        notes_enabled: true,
        timer_enabled: true,
      })

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should clear localStorage if session validation fails', async () => {
      const mockUser = { id: 1, username: 'testuser' }
      localStorage.setItem('taskline_auth', JSON.stringify({ user: mockUser }))

      const { settingsApi } = await import('../../src/lib/api')
      vi.mocked(settingsApi.getSettings).mockRejectedValueOnce(new Error('Unauthorized'))

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(localStorage.getItem('taskline_auth')).toBeNull()
    })

    it('should restore lock state from localStorage', async () => {
      const mockUser = { id: 1, username: 'testuser' }
      localStorage.setItem('taskline_auth', JSON.stringify({ user: mockUser }))
      localStorage.setItem('taskline_lock_state', 'true')

      const { settingsApi } = await import('../../src/lib/api')
      vi.mocked(settingsApi.getSettings).mockResolvedValueOnce({
        theme: 'light',
        auto_lock_minutes: 0,
        notes_enabled: true,
        timer_enabled: true,
      })

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isLocked).toBe(true)
    })
  })

  describe('Login', () => {
    it('should login successfully', async () => {
      const { useAuthLogin } = await import('../../src/lib/hooks')
      const mockMutateAsync = vi.fn().mockResolvedValue({
        user: { id: 1, username: 'testuser' },
      })
      vi.mocked(useAuthLogin).mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.login('testuser', '1234')
      })

      expect(result.current.user).toEqual({ id: 1, username: 'testuser' })
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLocked).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should clear lock state on fresh login', async () => {
      const { useAuthLogin } = await import('../../src/lib/hooks')
      const mockMutateAsync = vi.fn().mockResolvedValue({
        user: { id: 1, username: 'testuser' },
      })
      vi.mocked(useAuthLogin).mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any)

      localStorage.setItem('taskline_lock_state', 'true')

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.login('testuser', '1234')
      })

      expect(result.current.isLocked).toBe(false)
      const lockState = localStorage.getItem('taskline_lock_state')
      expect(lockState === null || lockState === 'false').toBe(true)
    })
  })

  describe('Logout', () => {
    it('should logout successfully', async () => {
      const { useAuthLogin, useAuthLogout } = await import('../../src/lib/hooks')
      
      const mockLoginMutate = vi.fn().mockResolvedValue({
        user: { id: 1, username: 'testuser' },
      })
      vi.mocked(useAuthLogin).mockReturnValue({
        mutateAsync: mockLoginMutate,
      } as any)

      const mockLogoutMutate = vi.fn().mockResolvedValue(undefined)
      vi.mocked(useAuthLogout).mockReturnValue({
        mutateAsync: mockLogoutMutate,
      } as any)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Login first
      await act(async () => {
        await result.current.login('testuser', '1234')
      })

      expect(result.current.user).toEqual({ id: 1, username: 'testuser' })

      // Then logout
      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(localStorage.getItem('taskline_auth')).toBeNull()
    })
  })

  describe('Setup', () => {
    it('should setup user successfully', async () => {
      const { useAuthSetup } = await import('../../src/lib/hooks')
      const mockMutateAsync = vi.fn().mockResolvedValue({
        user: { id: 1, username: 'newuser' },
      })
      vi.mocked(useAuthSetup).mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.setup({
          pin: '1234',
          username: 'newuser',
          email: 'test@example.com',
        })
      })

      expect(result.current.user).toEqual({ id: 1, username: 'newuser' })
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should clear tutorial state on setup', async () => {
      const { useAuthSetup } = await import('../../src/lib/hooks')
      const mockMutateAsync = vi.fn().mockResolvedValue({
        user: { id: 1, username: 'newuser' },
      })
      vi.mocked(useAuthSetup).mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any)

      localStorage.setItem('taskline_tutorial_completed', 'true')
      sessionStorage.setItem('taskline_tutorial_active', 'true')

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.setup({
          pin: '1234',
          username: 'newuser',
        })
      })

      expect(localStorage.getItem('taskline_tutorial_completed')).toBeNull()
      expect(sessionStorage.getItem('taskline_tutorial_active')).toBeNull()
    })
  })

  describe('Change PIN', () => {
    it('should change PIN successfully', async () => {
      const { useAuthChangePin } = await import('../../src/lib/hooks')
      const mockMutateAsync = vi.fn().mockResolvedValue(undefined)
      vi.mocked(useAuthChangePin).mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.changePin({
          currentPin: '1234',
          newPin: '5678',
        })
      })

      expect(mockMutateAsync).toHaveBeenCalledWith({
        current_pin: '1234',
        new_pin: '5678',
      })
      expect(result.current.error).toBeNull()
    })
  })

  describe('Change Username', () => {
    it('should change username successfully', async () => {
      const { useAuthLogin, useAuthChangeUsername } = await import('../../src/lib/hooks')
      
      const mockLoginMutate = vi.fn().mockResolvedValue({
        user: { id: 1, username: 'olduser' },
      })
      vi.mocked(useAuthLogin).mockReturnValue({
        mutateAsync: mockLoginMutate,
      } as any)

      const mockChangeUsernameMutate = vi.fn().mockResolvedValue({
        username: 'newuser',
      })
      vi.mocked(useAuthChangeUsername).mockReturnValue({
        mutateAsync: mockChangeUsernameMutate,
      } as any)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Login first
      await act(async () => {
        await result.current.login('olduser', '1234')
      })

      // Change username
      await act(async () => {
        await result.current.changeUsername({
          newUsername: 'newuser',
          pin: '1234',
        })
      })

      expect(mockChangeUsernameMutate).toHaveBeenCalledWith({
        new_username: 'newuser',
        pin: '1234',
      })
      expect(result.current.user?.username).toBe('newuser')
      expect(result.current.error).toBeNull()
    })
  })

  describe('Lock/Unlock', () => {
    it('should manually lock the app', async () => {
      const { useAuthLogin } = await import('../../src/lib/hooks')
      const mockMutateAsync = vi.fn().mockResolvedValue({
        user: { id: 1, username: 'testuser' },
      })
      vi.mocked(useAuthLogin).mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Login first
      await act(async () => {
        await result.current.login('testuser', '1234')
      })

      expect(result.current.isLocked).toBe(false)

      // Lock
      act(() => {
        result.current.lock()
      })

      expect(result.current.isLocked).toBe(true)
    })

    it('should unlock with correct PIN', async () => {
      const { useAuthLogin } = await import('../../src/lib/hooks')
      const mockMutateAsync = vi.fn().mockResolvedValue({
        user: { id: 1, username: 'testuser' },
      })
      vi.mocked(useAuthLogin).mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Login and lock
      await act(async () => {
        await result.current.login('testuser', '1234')
        result.current.lock()
      })

      expect(result.current.isLocked).toBe(true)

      // Unlock
      await act(async () => {
        await result.current.unlock('1234')
      })

      expect(result.current.isLocked).toBe(false)
      // Lock state might be removed or set to 'false' depending on timing
      const lockState = localStorage.getItem('taskline_lock_state')
      expect(lockState === null || lockState === 'false').toBe(true)
    })

    it('should fail unlock when no user session', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.unlock('1234')
        })
      ).rejects.toThrow('No user session')
    })
  })

  describe('Auto-lock functionality', () => {
    beforeEach(() => {
      // Use fake timers only for auto-lock tests
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should auto-lock after inactivity period', async () => {
      const { useAuthLogin, useSettings } = await import('../../src/lib/hooks')
      
      const mockLoginMutate = vi.fn().mockResolvedValue({
        user: { id: 1, username: 'testuser' },
      })
      vi.mocked(useAuthLogin).mockReturnValue({
        mutateAsync: mockLoginMutate,
      } as any)

      vi.mocked(useSettings).mockReturnValue({
        data: {
          theme: 'light',
          auto_lock_minutes: 1, // 1 minute
          notes_enabled: true,
          timer_enabled: true,
        },
      } as any)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

      // Run all pending timers for initialization
      await act(async () => {
        await vi.runAllTimersAsync()
      })

      // Login
      await act(async () => {
        await result.current.login('testuser', '1234')
      })

      expect(result.current.isLocked).toBe(false)

      // Advance time by 2 minutes and run timers
      await act(async () => {
        await vi.advanceTimersByTimeAsync(120000) // 2 minutes in milliseconds
      })

      // Check immediately after timer advancement (no waitFor with fake timers)
      expect(result.current.isLocked).toBe(true)
    })

    it('should not auto-lock when auto_lock_minutes is 0', async () => {
      const { useAuthLogin, useSettings } = await import('../../src/lib/hooks')
      
      const mockLoginMutate = vi.fn().mockResolvedValue({
        user: { id: 1, username: 'testuser' },
      })
      vi.mocked(useAuthLogin).mockReturnValue({
        mutateAsync: mockLoginMutate,
      } as any)

      vi.mocked(useSettings).mockReturnValue({
        data: {
          theme: 'light',
          auto_lock_minutes: 0, // Disabled
          notes_enabled: true,
          timer_enabled: true,
        },
      } as any)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

      // Run all pending timers for initialization
      await act(async () => {
        await vi.runAllTimersAsync()
      })

      // Login
      await act(async () => {
        await result.current.login('testuser', '1234')
      })

      expect(result.current.isLocked).toBe(false)

      // Advance time significantly
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600000) // 10 minutes
      })

      expect(result.current.isLocked).toBe(false)
    })

    it('should update activity timestamp', async () => {
      const { useAuthLogin } = await import('../../src/lib/hooks')
      const mockMutateAsync = vi.fn().mockResolvedValue({
        user: { id: 1, username: 'testuser' },
      })
      vi.mocked(useAuthLogin).mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

      // Run all pending timers for initialization
      await act(async () => {
        await vi.runAllTimersAsync()
      })

      // Login
      await act(async () => {
        await result.current.login('testuser', '1234')
      })

      // Update activity
      act(() => {
        result.current.updateActivity()
      })

      // Should not throw error
      expect(result.current.error).toBeNull()
    })
  })

  describe('LocalStorage integration', () => {
    it('should save user to localStorage after login', async () => {
      const { useAuthLogin } = await import('../../src/lib/hooks')
      const mockMutateAsync = vi.fn().mockResolvedValue({
        user: { id: 1, username: 'testuser' },
      })
      vi.mocked(useAuthLogin).mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.login('testuser', '1234')
      })

      const stored = localStorage.getItem('taskline_auth')
      expect(stored).toBeTruthy()
      const parsed = JSON.parse(stored!)
      expect(parsed.user).toEqual({ id: 1, username: 'testuser' })
    })

    it('should save lock state to localStorage', async () => {
      const { useAuthLogin } = await import('../../src/lib/hooks')
      const mockMutateAsync = vi.fn().mockResolvedValue({
        user: { id: 1, username: 'testuser' },
      })
      vi.mocked(useAuthLogin).mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any)

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.login('testuser', '1234')
      })

      act(() => {
        result.current.lock()
      })

      await waitFor(() => {
        expect(localStorage.getItem('taskline_lock_state')).toBe('true')
      })
    })

    it('should handle corrupted localStorage data gracefully', async () => {
      localStorage.setItem('taskline_auth', 'invalid json')

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(localStorage.getItem('taskline_auth')).toBeNull()
    })
  })
})
