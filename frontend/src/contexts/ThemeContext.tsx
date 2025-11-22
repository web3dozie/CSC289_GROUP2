import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSettings } from '../lib/hooks'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { data: settings } = useSettings() // Fetch settings without auth check
  const [theme, setThemeState] = useState<Theme>(() => {
    // Load from localStorage first for immediate theme application
    const stored = localStorage.getItem('theme') as Theme
    return stored || 'light'
  })
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // Update theme from settings when loaded - but only if different from current theme
  useEffect(() => {
    if (settings?.theme && settings.theme !== theme) {
      setThemeState(settings.theme as Theme)
    }
  }, [settings?.theme])

  // Resolve theme based on user preference and system preference
  useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === 'auto') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setResolvedTheme(systemPrefersDark ? 'dark' : 'light')
      } else {
        setResolvedTheme(theme)
      }
    }

    updateResolvedTheme()

    // Listen for system theme changes when theme is 'auto'
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => updateResolvedTheme()
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement

    // Remove existing theme classes
    root.classList.remove('light', 'dark')

    // Add resolved theme class
    root.classList.add(resolvedTheme)

    // Store in localStorage for immediate access on reload
    localStorage.setItem('theme', theme)
  }, [theme, resolvedTheme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}