import React from 'react'
import { AlertTriangle, RefreshCw, Home, WifiOff } from 'lucide-react'
import { ApiError } from '../lib/api'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({ errorInfo })
    
    // Log to error monitoring service if available
    if (window.location.hostname !== 'localhost') {
      // TODO: Send to error monitoring service (e.g., Sentry, LogRocket)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />
      }

      return (
        <DefaultErrorFallback 
          error={this.state.error!} 
          errorInfo={this.state.errorInfo}
          resetError={this.resetError} 
        />
      )
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  error: Error
  errorInfo?: React.ErrorInfo
  resetError: () => void
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({ 
  error, 
  errorInfo,
  resetError 
}) => {
  const isApiError = error instanceof ApiError
  const isNetworkError = isApiError && error.isNetworkError()
  const isServerError = isApiError && error.isServerError()
  const isAuthError = isApiError && error.isStatus(401)

  // Get user-friendly error message
  const getUserMessage = () => {
    if (isApiError) {
      return error.getUserMessage()
    }
    return 'An unexpected error occurred. Please try again.'
  }

  // Get appropriate icon
  const ErrorIcon = isNetworkError ? WifiOff : AlertTriangle

  // Get appropriate color
  const iconColor = isNetworkError 
    ? 'text-orange-500' 
    : isAuthError 
    ? 'text-yellow-500' 
    : 'text-red-500'

  const handleGoHome = () => {
    window.location.href = '/'
  }

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ErrorIcon className={`w-8 h-8 ${iconColor} mr-3`} />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {isNetworkError ? 'Connection Error' : 'Something went wrong'}
          </h1>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {getUserMessage()}
        </p>

        {/* Show additional details for API errors */}
        {isApiError && error.details && Object.keys(error.details).length > 0 && (
          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Additional information:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
              {Object.entries(error.details).map(([key, value]) => (
                <li key={key}>
                  <span className="font-medium">{key}:</span> {String(value)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Development-only error details */}
        {import.meta.env.DEV && (
          <details className="mb-4">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              Error details (development only)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-48">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
              {errorInfo?.componentStack && `\n\nComponent Stack:${errorInfo.componentStack}`}
            </pre>
          </details>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={resetError}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </button>

          {isNetworkError || isServerError ? (
            <button
              onClick={handleReload}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Reload page
            </button>
          ) : (
            <button
              onClick={handleGoHome}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Go home
            </button>
          )}
        </div>

        {/* Help text for specific error types */}
        {isNetworkError && (
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            Please check your internet connection and try again.
          </p>
        )}
        {isAuthError && (
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            Your session may have expired. Please log in again.
          </p>
        )}
      </div>
    </div>
  )
}

export default ErrorBoundary