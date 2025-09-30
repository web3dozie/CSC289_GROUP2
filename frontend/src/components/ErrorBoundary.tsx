import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
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
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />
      }

      return <DefaultErrorFallback error={this.state.error!} resetError={this.resetError} />
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  error: Error
  resetError: () => void
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Something went wrong
          </h1>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          An unexpected error occurred. This has been logged and we're working to fix it.
        </p>

        {import.meta.env.DEV && (
          <details className="mb-4">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              Error details (development only)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        <div className="flex space-x-3">
          <button
            onClick={resetError}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </button>

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorBoundary