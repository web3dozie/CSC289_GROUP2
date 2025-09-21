import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { useAuthLogin, useAuthLogout, useAuthSetup, useAuthChangePin } from '../lib/hooks'
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
  login: (pin: string) => Promise<void>
  logout: () => Promise<void>
  setup: (data: { pin: string; username?: string; email?: string }) => Promise<void>
  changePin: (data: { currentPin: string; newPin: string }) => Promise<void>
  unlock: (pin: string) => Promise<void>
  updateActivity: () => void
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = 'taskline_auth'

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [lastActivity, setLastActivity] = useState<number>(Date.now())

  // Settings for auto-lock
  const { data: settings } = useSettings()

  // Refs for timers
  const autoLockTimerRef = useRef<number | null>(null)
  const activityCheckTimerRef = useRef<number | null>(null)

  // Mutations
  const loginMutation = useAuthLogin()
  const logoutMutation = useAuthLogout()
  const setupMutation = useAuthSetup()
  const changePinMutation = useAuthChangePin()

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY)
        if (stored) {
          const authData = JSON.parse(stored)
          setUser(authData.user)
        }
      } catch (error) {
        console.error('Failed to load auth state:', error)
        localStorage.removeItem(AUTH_STORAGE_KEY)
      } finally {
        setIsLoading(false)
      }
    }

    loadAuthState()
  }, [])

  // Save auth state to localStorage whenever user changes
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user }))
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }
  }, [user, isLoading])

  const login = async (pin: string) => {
    try {
      setError(null)
      const result = await loginMutation.mutateAsync({ pin })
      setUser({ id: result.user_id, username: result.username })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      setError(message)
      throw error
    }
  }

  const logout = async () => {
    try {
      setError(null)
      await logoutMutation.mutateAsync()
      setUser(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed'
      setError(message)
      // Still clear user state even if logout request fails
      setUser(null)
      throw error
    }
  }

  const setup = async (data: { pin: string; username?: string; email?: string }) => {
    try {
      setError(null)
      const result = await setupMutation.mutateAsync(data)
      setUser({ id: result.user_id, username: result.username })
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

  const clearError = () => {
    setError(null)
  }

  // Activity monitoring and auto-lock functionality
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now())
    if (isLocked) {
      setIsLocked(false)
    }
  }, [isLocked])

  const unlock = useCallback(async (pin: string) => {
    try {
      setError(null)
      await loginMutation.mutateAsync({ pin })
      setIsLocked(false)
      updateActivity()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unlock failed'
      setError(message)
      throw error
    }
  }, [loginMutation, updateActivity])

  // Auto-lock logic
  useEffect(() => {
    if (!user || !settings?.auto_lock_minutes || settings.auto_lock_minutes === 0) {
      return
    }

    const checkAutoLock = () => {
      const now = Date.now()
      const timeSinceActivity = (now - lastActivity) / 1000 / 60 // minutes

      if (timeSinceActivity >= settings.auto_lock_minutes && !isLocked) {
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
    unlock,
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