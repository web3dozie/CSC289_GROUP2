import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { queryClient } from '../../src/lib/queryClient'
import { ApiError } from '../../src/lib/api'

describe('queryClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Configuration', () => {
    it('should be an instance of QueryClient', () => {
      expect(queryClient).toBeInstanceOf(QueryClient)
    })

    it('should have correct staleTime configured (5 minutes)', () => {
      const options = queryClient.getDefaultOptions()
      expect(options.queries?.staleTime).toBe(1000 * 60 * 5)
    })

    it('should have correct gcTime configured (10 minutes)', () => {
      const options = queryClient.getDefaultOptions()
      expect(options.queries?.gcTime).toBe(1000 * 60 * 10)
    })

    it('should have refetchOnWindowFocus disabled', () => {
      const options = queryClient.getDefaultOptions()
      expect(options.queries?.refetchOnWindowFocus).toBe(false)
    })
  })

  describe('Query Retry Logic', () => {
    it('should not retry on client errors (4xx)', () => {
      const options = queryClient.getDefaultOptions()
      const retryFn = options.queries?.retry as Function
      
      const clientError = new ApiError(400, 'Bad Request')
      const shouldRetry = retryFn(1, clientError)
      
      expect(shouldRetry).toBe(false)
    })

    it('should retry server errors up to 3 times', () => {
      const options = queryClient.getDefaultOptions()
      const retryFn = options.queries?.retry as Function
      
      const serverError = new ApiError(500, 'Internal Server Error')
      
      expect(retryFn(0, serverError)).toBe(true)  // First retry
      expect(retryFn(1, serverError)).toBe(true)  // Second retry
      expect(retryFn(2, serverError)).toBe(true)  // Third retry
      expect(retryFn(3, serverError)).toBe(false) // No fourth retry
    })

    it('should not retry on network errors', () => {
      const options = queryClient.getDefaultOptions()
      const retryFn = options.queries?.retry as Function
      
      const networkError = new ApiError(0, 'Network Error')
      const shouldRetry = retryFn(1, networkError)
      
      expect(shouldRetry).toBe(false)
    })

    it('should retry unknown errors up to 3 times', () => {
      const options = queryClient.getDefaultOptions()
      const retryFn = options.queries?.retry as Function
      
      const unknownError = new Error('Unknown error')
      
      expect(retryFn(0, unknownError)).toBe(true)
      expect(retryFn(1, unknownError)).toBe(true)
      expect(retryFn(2, unknownError)).toBe(true)
      expect(retryFn(3, unknownError)).toBe(false)
    })
  })

  describe('Retry Delay', () => {
    it('should use exponential backoff starting at 1 second', () => {
      const options = queryClient.getDefaultOptions()
      const retryDelayFn = options.queries?.retryDelay as Function
      
      expect(retryDelayFn(0)).toBe(1000)   // 1s
      expect(retryDelayFn(1)).toBe(2000)   // 2s
      expect(retryDelayFn(2)).toBe(4000)   // 4s
      expect(retryDelayFn(3)).toBe(8000)   // 8s
    })

    it('should cap retry delay at 30 seconds', () => {
      const options = queryClient.getDefaultOptions()
      const retryDelayFn = options.queries?.retryDelay as Function
      
      // 2^10 = 1024 seconds, but should be capped at 30
      expect(retryDelayFn(10)).toBe(30000)
    })
  })

  describe('Mutation Retry Logic', () => {
    it('should not retry mutations on client errors', () => {
      const options = queryClient.getDefaultOptions()
      const retryFn = options.mutations?.retry as Function
      
      const clientError = new ApiError(400, 'Bad Request')
      const shouldRetry = retryFn(0, clientError)
      
      expect(shouldRetry).toBe(false)
    })

    it('should retry mutations once on server errors', () => {
      const options = queryClient.getDefaultOptions()
      const retryFn = options.mutations?.retry as Function
      
      const serverError = new ApiError(500, 'Internal Server Error')
      
      expect(retryFn(0, serverError)).toBe(true)  // First retry
      expect(retryFn(1, serverError)).toBe(false) // No second retry
    })

    it('should retry mutations once on non-ApiError errors', () => {
      const options = queryClient.getDefaultOptions()
      const retryFn = options.mutations?.retry as Function
      
      const unknownError = new Error('Unknown error')
      
      expect(retryFn(0, unknownError)).toBe(true)
      expect(retryFn(1, unknownError)).toBe(false)
    })
  })

  describe('Global Error Handler', () => {
    it('should have onError handler configured for mutations', () => {
      const options = queryClient.getDefaultOptions()
      expect(options.mutations?.onError).toBeDefined()
      expect(typeof options.mutations?.onError).toBe('function')
    })

    it('should log ApiError details when mutation fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const options = queryClient.getDefaultOptions()
      const onError = options.mutations?.onError as Function
      
      const apiError = new ApiError(422, 'Validation failed', { field: 'email' })
      onError(apiError)
      
      expect(consoleSpy).toHaveBeenCalledWith('[API Error]', {
        code: 422,
        message: 'Validation failed',
        details: { field: 'email' },
      })
      
      consoleSpy.mockRestore()
    })

    it('should log unexpected errors when mutation fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const options = queryClient.getDefaultOptions()
      const onError = options.mutations?.onError as Function
      
      const unexpectedError = new Error('Unexpected error')
      onError(unexpectedError)
      
      expect(consoleSpy).toHaveBeenCalledWith('[Unexpected Error]', unexpectedError)
      
      consoleSpy.mockRestore()
    })
  })

  describe('ApiError Helper Methods', () => {
    it('should correctly identify client errors (4xx)', () => {
      expect(new ApiError(400, 'Bad Request').isClientError()).toBe(true)
      expect(new ApiError(401, 'Unauthorized').isClientError()).toBe(true)
      expect(new ApiError(404, 'Not Found').isClientError()).toBe(true)
      expect(new ApiError(422, 'Unprocessable').isClientError()).toBe(true)
      expect(new ApiError(500, 'Server Error').isClientError()).toBe(false)
    })

    it('should correctly identify server errors (5xx)', () => {
      expect(new ApiError(500, 'Internal Server Error').isServerError()).toBe(true)
      expect(new ApiError(502, 'Bad Gateway').isServerError()).toBe(true)
      expect(new ApiError(503, 'Service Unavailable').isServerError()).toBe(true)
      expect(new ApiError(400, 'Bad Request').isServerError()).toBe(false)
    })

    it('should correctly identify network errors (0)', () => {
      expect(new ApiError(0, 'Network Error').isNetworkError()).toBe(true)
      expect(new ApiError(500, 'Server Error').isNetworkError()).toBe(false)
      expect(new ApiError(400, 'Bad Request').isNetworkError()).toBe(false)
    })
  })
})
