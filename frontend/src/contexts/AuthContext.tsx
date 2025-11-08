import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { useAuthLogin, useAuthLogout, useAuthSetup, useAuthChangePin, useAuthChangeUsername } from '../lib/hooks'
import { settingsApi } from '../lib/api'
import { useSettings } from '../lib/hooks'

interface User {
  id: number
  username: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isLocked: boolean
  login: (username: string, pin: string) => Promise<void>
  logout: () => Promise<void>
  setup: (data: { pin: string; username: string; email?: string }) => Promise<void>
  changePin: (data: { currentPin: string; newPin: string }) => Promise<void>
  changeUsername: (data: { newUsername: string; pin: string }) => Promise<void>
  unlock: (pin: string) => Promise<void>
  lock: () => void
  updateActivity: () => void
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Use sessionStorage instead of localStorage so data clears when browser closes
const AUTH_STORAGE_KEY = 'taskline_auth'
const LOCK_STORAGE_KEY = 'taskline_lock_state'

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [lastActivity, setLastActivity] = useState<number>(Date.now())

  // Settings for auto-lock - only fetch when user is authenticated
  const { data: settings } = useSettings(!!user && !isLoading)

  // Refs for timers
  const autoLockTimerRef = useRef<number | null>(null)
  const activityCheckTimerRef = useRef<number | null>(null)

  // Mutations
  const loginMutation = useAuthLogin()
  const logoutMutation = useAuthLogout()
  const setupMutation = useAuthSetup()
  const changePinMutation = useAuthChangePin()
  const changeUsernameMutation = useAuthChangeUsername()

  // Load auth state from sessionStorage on mount
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        // Clear any old localStorage data (migration from localStorage to sessionStorage)
        localStorage.removeItem(AUTH_STORAGE_KEY)
        localStorage.removeItem(LOCK_STORAGE_KEY)
        
        console.log('[AuthContext] Loading auth state from sessionStorage')
        const stored = sessionStorage.getItem(AUTH_STORAGE_KEY)
        if (stored) {
          const authData = JSON.parse(stored)
          console.log('[AuthContext] Found stored auth data:', { username: authData.user?.username })
          
          // Validate session with backend - only restore if backend session is still valid
          // This ensures that if the browser was closed and reopened, the session will be gone
          try {
            console.log('[AuthContext] Validating session with backend...')
            await settingsApi.getSettings()
            console.log('[AuthContext] Session is valid, restoring user')
            setUser(authData.user)
            
            // Restore lock state if it was locked before refresh
            const lockState = sessionStorage.getItem(LOCK_STORAGE_KEY)
            console.log('[AuthContext] Lock state from storage:', lockState)
            
            if (lockState === 'true') {
              console.log('[AuthContext] Restoring locked state')
              setIsLocked(true)
            }
          } catch (error) {
            // Session is invalid (e.g., browser was closed and session expired), clear sessionStorage
            // This forces the user to log in again
            console.log('[AuthContext] Session validation failed (browser may have been closed), clearing auth state:', error)
            sessionStorage.removeItem(AUTH_STORAGE_KEY)
            sessionStorage.removeItem(LOCK_STORAGE_KEY)
          }
        } else {
          console.log('[AuthContext] No stored auth data found')
        }
      } catch (error) {
        console.error('[AuthContext] Failed to load auth state:', error)
        sessionStorage.removeItem(AUTH_STORAGE_KEY)
        sessionStorage.removeItem(LOCK_STORAGE_KEY)
      } finally {
        setIsLoading(false)
        console.log('[AuthContext] Auth state loading complete')
      }
    }

    loadAuthState()
  }, [])

  // Save auth state to sessionStorage whenever user changes
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user }))
      } else {
        sessionStorage.removeItem(AUTH_STORAGE_KEY)
        sessionStorage.removeItem(LOCK_STORAGE_KEY)
      }
    }
  }, [user, isLoading])

  // Save lock state to sessionStorage whenever it changes
  useEffect(() => {
    if (!isLoading && user) {
      console.log('[AuthContext] Saving lock state:', isLocked)
      sessionStorage.setItem(LOCK_STORAGE_KEY, String(isLocked))
    }
  }, [isLocked, user, isLoading])

  const login = async (username: string, pin: string) => {
    try {
      console.log('[AuthContext] Attempting login for user:', username)
      setError(null)
      const result = await loginMutation.mutateAsync({ username, pin })
      console.log('[AuthContext] Login successful:', { userId: result.user.id, username: result.user.username })
      setUser({ id: result.user.id, username: result.user.username })
      setIsLocked(false) // Clear locked state on fresh login
      sessionStorage.removeItem(LOCK_STORAGE_KEY)
    } catch (error) {
      console.error('[AuthContext] Login failed:', error)
      const message = error instanceof Error ? error.message : 'Login failed'
      setError(message)
      throw error
    }
  }

  const logout = async () => {
    try {
      setError(null)
      // Clear user state first to immediately disable authenticated queries
      const previousUser = user
      setUser(null)
      
      try {
        await logoutMutation.mutateAsync()
      } catch (error) {
        // If logout fails, restore user state
        setUser(previousUser)
        throw error
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed'
      setError(message)
      throw error
    }
  }

  const setup = async (data: { pin: string; username: string; email?: string }) => {
    try {
      setError(null)
      const result = await setupMutation.mutateAsync(data)
      setUser({ id: result.user.id, username: result.user.username })
      
      // Clear any previous tutorial state and trigger tutorial on first login
      localStorage.removeItem('taskline_tutorial_completed')
      sessionStorage.removeItem('taskline_tutorial_active')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Setup failed'
      setError(message)
      throw error
    }
  }

  const changePin = async (data: { currentPin: string; newPin: string }) => {
    try {
      setError(null)
      await changePinMutation.mutateAsync({
        current_pin: data.currentPin,
        new_pin: data.newPin,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PIN change failed'
      setError(message)
      throw error
    }
  }

  const changeUsername = async (data: { newUsername: string; pin: string }) => {
    try {
      setError(null)
      const result = await changeUsernameMutation.mutateAsync({
        new_username: data.newUsername,
        pin: data.pin,
      })
      // Update local user state with new username
      if (user) {
        setUser({ ...user, username: result.username })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Username change failed'
      setError(message)
      throw error
    }
  }

  const clearError = () => {
    setError(null)
  }

  // Activity monitoring and auto-lock functionality
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now())
  }, [])

  const unlock = useCallback(async (pin: string) => {
    try {
      console.log('[AuthContext] Attempting to unlock with PIN')
      setError(null)
      if (!user) throw new Error('No user session')
      await loginMutation.mutateAsync({ username: user.username, pin })
      console.log('[AuthContext] Unlock successful')
      setIsLocked(false)
      sessionStorage.removeItem(LOCK_STORAGE_KEY)
      updateActivity()
    } catch (error) {
      console.error('[AuthContext] Unlock failed:', error)
      const message = error instanceof Error ? error.message : 'Unlock failed'
      setError(message)
      throw error
    }
  }, [loginMutation, updateActivity, user])

  // Manual lock function for testing
  const lock = useCallback(() => {
    console.log('[AuthContext] Manually locking app')
    setIsLocked(true)
  }, [])

  // Auto-lock logic
  useEffect(() => {
    if (!user || !settings?.auto_lock_minutes || settings.auto_lock_minutes === 0) {
      return
    }

    const checkAutoLock = () => {
      const now = Date.now()
      const timeSinceActivity = (now - lastActivity) / 1000 / 60 // minutes

      if (timeSinceActivity >= settings.auto_lock_minutes && !isLocked) {
        console.log('[AuthContext] Auto-lock triggered after', timeSinceActivity.toFixed(1), 'minutes of inactivity')
        setIsLocked(true)
      }
    }

    // Check immediately and then every minute
    checkAutoLock()
    activityCheckTimerRef.current = window.setInterval(checkAutoLock, 60000) // Check every minute

    return () => {
      if (activityCheckTimerRef.current) {
        clearInterval(activityCheckTimerRef.current)
        activityCheckTimerRef.current = null
      }
    }
  }, [user, settings?.auto_lock_minutes, lastActivity, isLocked])

  // Activity event listeners
  useEffect(() => {
    if (!user || isLocked) return

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

    const handleActivity = () => updateActivity()

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [user, isLocked, updateActivity])

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (autoLockTimerRef.current) {
        clearTimeout(autoLockTimerRef.current)
      }
      if (activityCheckTimerRef.current) {
        clearInterval(activityCheckTimerRef.current)
      }
    }
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isLocked,
    login,
    logout,
    setup,
    changePin,
    changeUsername,
    unlock,
    lock,
    updateActivity,
    error,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}