import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi, tasksApi, reviewApi, settingsApi, healthApi } from './api'

// Query keys for consistent caching
export const queryKeys = {
  tasks: ['tasks'] as const,
  task: (id: number) => ['tasks', id] as const,
  kanban: ['tasks', 'kanban'] as const,
  calendar: ['tasks', 'calendar'] as const,
  categories: ['tasks', 'categories'] as const,
  journal: ['review', 'journal'] as const,
  dailySummary: ['review', 'summary', 'daily'] as const,
  weeklySummary: ['review', 'summary', 'weekly'] as const,
  insights: ['review', 'insights'] as const,
  settings: ['settings'] as const,
  health: ['health'] as const,
}

// Health check
export const useHealthCheck = () => {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: healthApi.check,
    staleTime: 1000 * 60, // 1 minute
  })
}

// Auth hooks
export const useAuthSetup = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.setup,
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
      queryClient.invalidateQueries({ queryKey: queryKeys.settings })
    },
  })
}

export const useAuthLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
      queryClient.invalidateQueries({ queryKey: queryKeys.settings })
    },
  })
}

export const useAuthLogout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear()
    },
  })
}

export const useAuthChangePin = () => {
  return useMutation({
    mutationFn: authApi.changePin,
  })
}

// Tasks hooks
export const useTasks = (params?: { status?: string; category?: string; page?: number }) => {
  return useQuery({
    queryKey: [...queryKeys.tasks, params],
    queryFn: () => tasksApi.getAll(params),
  })
}

export const useKanbanTasks = () => {
  return useQuery({
    queryKey: queryKeys.kanban,
    queryFn: tasksApi.getKanban,
  })
}

export const useCalendarTasks = () => {
  return useQuery({
    queryKey: queryKeys.calendar,
    queryFn: tasksApi.getCalendar,
  })
}

export const useTask = (id: number) => {
  return useQuery({
    queryKey: queryKeys.task(id),
    queryFn: () => tasksApi.getById(id),
    enabled: !!id,
  })
}

export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: tasksApi.getCategories,
  })
}

export const useCreateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      // Invalidate and refetch tasks
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
      queryClient.invalidateQueries({ queryKey: queryKeys.kanban })
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar })
    },
  })
}

export const useUpdateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof tasksApi.update>[1] }) =>
      tasksApi.update(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
      queryClient.invalidateQueries({ queryKey: queryKeys.task(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.kanban })
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar })
    },
  })
}

export const useDeleteTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => {
      // Invalidate tasks queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
      queryClient.invalidateQueries({ queryKey: queryKeys.kanban })
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar })
    },
  })
}

// Review hooks
export const useJournal = () => {
  return useQuery({
    queryKey: queryKeys.journal,
    queryFn: reviewApi.getJournal,
  })
}

export const useCreateJournalEntry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reviewApi.createJournalEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal })
    },
  })
}

export const useUpdateJournalEntry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { content: string } }) =>
      reviewApi.updateJournalEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal })
    },
  })
}

export const useDailySummary = () => {
  return useQuery({
    queryKey: queryKeys.dailySummary,
    queryFn: reviewApi.getDailySummary,
  })
}

export const useWeeklySummary = () => {
  return useQuery({
    queryKey: queryKeys.weeklySummary,
    queryFn: reviewApi.getWeeklySummary,
  })
}

export const useInsights = () => {
  return useQuery({
    queryKey: queryKeys.insights,
    queryFn: reviewApi.getInsights,
  })
}

// Settings hooks
export const useSettings = () => {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: settingsApi.getSettings,
  })
}

export const useUpdateSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: settingsApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings })
    },
  })
}