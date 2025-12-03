// API client for Task Line backend
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// Standardized API error response format
interface APIErrorResponse {
  success: false
  error: {
    code: number
    message: string
    details?: Record<string, any>
  }
}

// Standardized API success response format
interface APISuccessResponse<T> {
  success: true
  data: T
}

// Export the types for use in other modules
export type { APIErrorResponse, APISuccessResponse }

class ApiError extends Error {
  public code: number
  public details?: Record<string, any>

  constructor(code: number, message: string, details?: Record<string, any>) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }

  /**
   * Check if the error is a specific HTTP error code
   */
  isStatus(status: number): boolean {
    return this.code === status
  }

  /**
   * Check if the error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.code >= 400 && this.code < 500
  }

  /**
   * Check if the error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.code >= 500 && this.code < 600
  }

  /**
   * Check if the error is a network error
   */
  isNetworkError(): boolean {
    return this.code === 0
  }

  /**
   * Get a user-friendly error message
   */
  getUserMessage(): string {
    // Map technical errors to user-friendly messages
    const userFriendlyMessages: Record<number, string> = {
      0: 'Unable to connect to the server. Please check your internet connection.',
      400: 'The request was invalid. Please check your input and try again.',
      401: 'You need to log in to access this resource.',
      403: 'You don\'t have permission to access this resource.',
      404: 'The requested resource could not be found.',
      409: 'This action conflicts with existing data.',
      500: 'An error occurred on the server. Please try again later.',
      502: 'The server is temporarily unavailable. Please try again later.',
      503: 'The service is temporarily unavailable. Please try again later.',
    }

    return userFriendlyMessages[this.code] || this.message
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for session management
    ...options,
  }

  try {
    const response = await fetch(url, config)

    // Handle empty responses (like 204 No Content)
    if (response.status === 204) {
      return {} as T
    }

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      console.error('[API] Error response:', { endpoint, status: response.status, data })
      
      // Try to parse standardized error format
      if (data && typeof data === 'object' && 'success' in data && data.success === false) {
        const errorData = data as APIErrorResponse
        throw new ApiError(
          errorData.error.code,
          errorData.error.message,
          errorData.error.details
        )
      }

      // Fallback for non-standardized errors
      const message = data?.error || data?.message || `HTTP ${response.status}`
      throw new ApiError(response.status, message)
    }

    // Handle standardized success response format
    if (data && typeof data === 'object' && 'success' in data && data.success === true) {
      return (data as APISuccessResponse<T>).data
    }

    // Fallback for non-standardized success responses (backward compatibility)
    return data as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    
    console.error('[API] Request failed:', { endpoint, error })
    
    // Network error or other fetch failures
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(0, 'Network error: Unable to reach the server')
    }
    
    throw new ApiError(0, 'An unexpected error occurred')
  }
}

// Export ApiError for use in components
export { ApiError }

// Auth API
export const authApi = {
  setup: (data: { pin: string; username?: string; email?: string }) =>
    apiRequest<{ message: string; user: { id: number; username: string } }>(
      '/api/auth/setup',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  login: (data: { username: string; pin: string }) =>
    apiRequest<{ message: string; user: { id: number; username: string } }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  logout: () =>
    apiRequest<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  changePin: (data: { current_pin: string; new_pin: string }) =>
    apiRequest<{ message: string }>('/api/auth/pin', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changeUsername: (data: { new_username: string; pin: string }) =>
    apiRequest<{ message: string; username: string }>('/api/auth/username', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}

// Tasks API
export interface Task {
  id: number
  title: string
  description?: string
  notes?: string
  done: boolean
  archived: boolean
  category?: string
  priority: boolean
  due_date?: string
  estimate_minutes?: number
  order: number
  status: {
    id: number
    name: string
  }
  status_id?: number  // Add this field for updates
  created_at: string
  updated_on?: string
  closed_on?: string
  created_by: number
}

export const tasksApi = {
  getAll: (params?: { status?: string; category?: string; page?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.category) searchParams.set('category', params.category)
    if (params?.page) searchParams.set('page', params.page.toString())

    const query = searchParams.toString()
    return apiRequest<Task[] | { tasks: Task[]; pagination?: Record<string, unknown> }>(
      `/api/tasks/${query ? `?${query}` : ''}`
    ).then((data) => {
      if (Array.isArray(data)) {
        return data
      }

      return data.tasks
    })
  },

  getKanban: () =>
    apiRequest<{
      todo?: { status_id: number; name: string; tasks: Task[] };
      in_progress?: { status_id: number; name: string; tasks: Task[] };
      done?: { status_id: number; name: string; tasks: Task[] };
    }>('/api/tasks/kanban'),

  getCalendar: () =>
    apiRequest<{ [date: string]: Task[] }>('/api/tasks/calendar'),

  getById: (id: number) =>
    apiRequest<Task>(`/api/tasks/${id}`),

  create: (data: {
    title: string
    description?: string
    category?: string
    priority?: boolean
    due_date?: string
    estimate_minutes?: number
  }) =>
    apiRequest<{ message: string; task_id: number }>('/api/tasks/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<{
    title: string
    description?: string
    notes?: string
    done: boolean
    archived: boolean
    category?: string
    priority: boolean
    due_date?: string
    estimate_minutes?: number
    order?: number
    status_id?: number
  }>) =>
    apiRequest<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<void>(`/api/tasks/${id}`, {
      method: 'DELETE',
    }),

  getCategories: () =>
    apiRequest<string[]>('/api/tasks/categories'),

  archiveCompleted: () =>
    apiRequest<{ message: string; archived_count: number }>('/api/tasks/archive-completed', {
      method: 'POST',
    }),

  getArchived: () =>
    apiRequest<Task[]>('/api/tasks/archived'),
}

// Review API
export interface JournalEntry {
  id: number
  entry_date: string
  content: string
  created_at: string
  updated_on?: string
}

export const reviewApi = {
  getJournal: () =>
    apiRequest<JournalEntry[]>('/api/review/journal'),

  createJournalEntry: (data: { entry_date: string; content: string }) =>
    apiRequest<JournalEntry>('/api/review/journal', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateJournalEntry: (id: number, data: { content: string }) =>
    apiRequest<JournalEntry>(`/api/review/journal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getDailySummary: () =>
    apiRequest<any>('/api/review/summary/daily'),

  getWeeklySummary: () =>
    apiRequest<any>('/api/review/summary/weekly'),

  getInsights: () =>
    apiRequest<any>('/api/review/insights'),
}

// Settings API
export interface UserSettings {
  notes_enabled: boolean
  timer_enabled: boolean
  ai_api_url?: string
  ai_model?: string
  ai_api_key?: string
  auto_lock_minutes: number
  theme: string
  updated_on?: string
}

export const settingsApi = {
  getSettings: () =>
    apiRequest<UserSettings>('/api/settings'),

  updateSettings: (data: Partial<UserSettings>) =>
    apiRequest<UserSettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateNotesSettings: (enabled: boolean) =>
    apiRequest<UserSettings>('/api/settings/notes', {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    }),

  updateTimerSettings: (enabled: boolean) =>
    apiRequest<UserSettings>('/api/settings/timer', {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    }),

  updateAiUrl: (ai_url: string) =>
    apiRequest<UserSettings>('/api/settings/ai-url', {
      method: 'PUT',
      body: JSON.stringify({ ai_url }),
    }),

  updateAutoLock: (auto_lock_minutes: number) =>
    apiRequest<UserSettings>('/api/settings/auto-lock', {
      method: 'PUT',
      body: JSON.stringify({ auto_lock_minutes }),
    }),

  updateTheme: (theme: string) =>
    apiRequest<UserSettings>('/api/settings/theme', {
      method: 'PUT',
      body: JSON.stringify({ theme }),
    }),
}

// Health check
export const healthApi = {
  check: () =>
    apiRequest<{ status: string; timestamp: string; database: string }>('/api/health'),
}

// Data management API
export const dataApi = {
  export: async (format: 'json' | 'md' = 'json'): Promise<Blob> => {
    const url = `${API_BASE_URL}${format === 'md' ? '/api/export.md' : '/api/export'}`

    const config: RequestInit = {
      method: 'GET',
      headers: format === 'json' ? { 'Content-Type': 'application/json' } : {},
      credentials: 'include',
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      if (data && typeof data === 'object' && 'success' in data && data.success === false) {
        const errorData = data as APIErrorResponse
        throw new ApiError(errorData.error.code, errorData.error.message, errorData.error.details)
      }
      const message = (data as any)?.error || (data as any)?.message || `HTTP ${response.status}`
      throw new ApiError(response.status, message)
    }

    return response.blob()
  },

  import: (data: any) =>
    apiRequest<{ message: string; imported_count?: number; conflicts?: string[] }>('/api/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// Account deletion API
export interface AccountDeletionPreview {
  username: string
  data_summary: {
    tasks: number
    journal_entries: number
    conversations: number
    sessions: number
  }
  warning: string
}

export const accountApi = {
  previewDeletion: () =>
    apiRequest<AccountDeletionPreview>('/api/account/preview'),

  deleteAccount: (data: { pin: string; confirmation: string }) =>
    apiRequest<{ message: string; deleted_at: string }>('/api/account', {
      method: 'DELETE',
      body: JSON.stringify(data),
    }),
}

// Categories API
export interface Category {
  id: number
  name: string
  description?: string
  color_hex: string
  created_on: string
  updated_on?: string
  created_by: number
}

export interface CategoryUsage {
  id: number
  name: string
  task_count: number
  color_hex: string
}

export const categoriesApi = {
  getAll: () =>
    apiRequest<Category[]>('/api/categories'),

  getById: (id: number) =>
    apiRequest<Category>(`/api/categories/${id}`),

  create: (data: {
    name: string
    description?: string
    color_hex: string
  }) =>
    apiRequest<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<{
    name: string
    description?: string
    color_hex: string
  }>) =>
    apiRequest<Category>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<{ message: string }>(`/api/categories/${id}`, {
      method: 'DELETE',
    }),

  getUsage: () =>
    apiRequest<CategoryUsage[]>('/api/categories/usage'),
}


