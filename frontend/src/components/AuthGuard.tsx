import React from 'react'
import { Navigate } from '@tanstack/react-router'
import { useAuth } from '../contexts/AuthContext'
import { LockScreen } from './LockScreen'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true
}) => {
  const { isAuthenticated, isLoading, isLocked } = useAuth()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Redirect to login
    return <Navigate to="/login" replace />
  }

  // If user is authenticated but app is locked, show lock screen
  if (requireAuth && isAuthenticated && isLocked) {
    return <LockScreen />
  }

  // If authentication is not required but user is authenticated
  // (e.g., login page when already logged in)
  if (!requireAuth && isAuthenticated) {
    // Redirect to main app
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}