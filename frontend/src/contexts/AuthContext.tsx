import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuthLogin, useAuthLogout, useAuthSetup, useAuthChangePin } from '../lib/hooks'

interface User {
  id: number
  username: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (pin: string) => Promise<void>
  logout: () => Promise<void>
  setup: (data: { pin: string; username?: string; email?: string }) => Promise<void>
  changePin: (data: { currentPin: string; newPin: string }) => Promise<void>
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

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    setup,
    changePin,
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