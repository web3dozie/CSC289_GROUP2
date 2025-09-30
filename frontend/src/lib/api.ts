// API client for Task Line backend
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new ApiError(response.status, errorData.message || `HTTP ${response.status}`)
    }

    // Handle empty responses (like 204 No Content)
    if (response.status === 204) {
      return {} as T
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(0, 'Network error')
  }
}

// Auth API
export const authApi = {
  setup: (data: { pin: string; username?: string; email?: string }) =>
    apiRequest<{ success: boolean; message: string; user_id: number; username: string }>(
      '/api/auth/setup',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  login: (data: { username: string; pin: string }) =>
    apiRequest<{ success: boolean; message: string; user_id: number; username: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  logout: () =>
    apiRequest<{ success: boolean; message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  changePin: (data: { current_pin: string; new_pin: string }) =>
    apiRequest<{ success: boolean; message: string }>('/api/auth/pin', {
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
    return apiRequest<Task[]>(`/api/tasks/${query ? `?${query}` : ''}`)
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
    apiRequest<{ task_id: number }>('/api/tasks/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<{
    title: string
    description?: string
    notes?: string
    done: boolean
    category?: string
    priority: boolean
    due_date?: string
    estimate_minutes?: number
    order?: number
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
  ai_url?: string
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