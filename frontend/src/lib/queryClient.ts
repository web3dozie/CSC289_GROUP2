import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api'

// Create a client with sensible defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on client errors (4xx) or authentication errors
        if (error instanceof ApiError) {
          // Don't retry on client errors
          if (error.isClientError()) {
            return false
          }
          // Retry server errors up to 3 times
          if (error.isServerError()) {
            return failureCount < 3
          }
          // Don't retry network errors immediately (let user manually retry)
          if (error.isNetworkError()) {
            return false
          }
        }
        
        // Default: retry up to 3 times for unknown errors
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff: 1s, 2s, 4s
        return Math.min(1000 * 2 ** attemptIndex, 30000)
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on client errors
        if (error instanceof ApiError && error.isClientError()) {
          return false
        }
        // Retry mutations once on server errors
        return failureCount < 1
      },
    },
  },
})

// Add global error handler for logging
queryClient.setDefaultOptions({
  ...queryClient.getDefaultOptions(),
  mutations: {
    ...queryClient.getDefaultOptions().mutations,
    onError: (error) => {
      if (error instanceof ApiError) {
        console.error('[API Error]', {
          code: error.code,
          message: error.message,
          details: error.details,
        })
      } else {
        console.error('[Unexpected Error]', error)
      }
    },
  },
})