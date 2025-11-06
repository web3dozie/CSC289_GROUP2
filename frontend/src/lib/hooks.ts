import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi, tasksApi, reviewApi, settingsApi, healthApi, dataApi, accountApi, type Task } from './api'

// Query keys for consistent caching
export const queryKeys = {
  tasks: ['tasks'] as const,
  task: (id: number) => ['tasks', id] as const,
  kanban: ['tasks', 'kanban'] as const,
  calendar: ['tasks', 'calendar'] as const,
  categories: ['tasks', 'categories'] as const,
  archived: ['tasks', 'archived'] as const,
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
      // Cancel any ongoing queries to prevent 401 errors
      queryClient.cancelQueries()
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
    onSuccess: (_result) => {
      // The server returns the task_id, but we need to refetch to get the full task
      // Invalidate and refetch tasks
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
      queryClient.invalidateQueries({ queryKey: queryKeys.kanban })
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar })
      // Invalidate review analytics queries when a new task is created
      queryClient.invalidateQueries({ queryKey: queryKeys.dailySummary })
      queryClient.invalidateQueries({ queryKey: queryKeys.weeklySummary })
      queryClient.invalidateQueries({ queryKey: queryKeys.insights })
    },
  })
}

export const useUpdateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof tasksApi.update>[1] }) =>
      tasksApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks })
      await queryClient.cancelQueries({ queryKey: queryKeys.task(id) })
      await queryClient.cancelQueries({ queryKey: queryKeys.kanban })
      await queryClient.cancelQueries({ queryKey: queryKeys.calendar })

      // Snapshot the previous values
      const previousTasks = queryClient.getQueryData(queryKeys.tasks)
      const previousTask = queryClient.getQueryData(queryKeys.task(id))
      const previousKanban = queryClient.getQueryData(queryKeys.kanban)
      const previousCalendar = queryClient.getQueryData(queryKeys.calendar)

      // Optimistically update the cache
      if (data.done !== undefined || data.status_id !== undefined) {
        // Update tasks list
        queryClient.setQueryData(queryKeys.tasks, (old: Task[] | undefined) => {
          if (!old) return old
          return old.map(task =>
            task.id === id ? { ...task, ...data, updated_on: new Date().toISOString() } : task
          )
        })

        // Update individual task
        queryClient.setQueryData(queryKeys.task(id), (old: Task | undefined) => {
          if (!old) return old
          return { ...old, ...data, updated_on: new Date().toISOString() }
        })

        // Update kanban view
        queryClient.setQueryData(queryKeys.kanban, (old: any) => {
          if (!old) return old
          const currentTask = queryClient.getQueryData(queryKeys.task(id)) as Task | undefined
          if (!currentTask) return old
          const updatedTask = { ...currentTask, ...data, updated_on: new Date().toISOString() }
          const newData = { ...old }

          // Remove from current column
          Object.keys(newData).forEach(key => {
            newData[key] = newData[key].filter((task: Task) => task.id !== id)
          })

          // Add to appropriate column based on status_id or done flag
          let status: string
          if (data.status_id) {
            switch (data.status_id) {
              case 1: status = 'todo'; break
              case 2: status = 'in_progress'; break
              case 3: status = 'done'; break
              default: status = 'todo'; break
            }
          } else {
            status = updatedTask.done ? 'done' : updatedTask.status?.name === 'in-progress' ? 'in_progress' : 'todo'
          }

          if (newData[status]) {
            newData[status] = [...newData[status], updatedTask]
          }

          return newData
        })

        // Update calendar view if due_date changed
        if (data.due_date !== undefined) {
          queryClient.setQueryData(queryKeys.calendar, (old: any) => {
            if (!old) return old
            const currentTask = queryClient.getQueryData(queryKeys.task(id)) as Task | undefined
            if (!currentTask) return old
            const updatedTask = { ...currentTask, ...data, updated_on: new Date().toISOString() }
            const newData = { ...old }

            // Remove from old date
            Object.keys(newData).forEach(date => {
              newData[date] = newData[date].filter((task: Task) => task.id !== id)
            })

            // Add to new date
            if (updatedTask.due_date) {
              const dateKey = updatedTask.due_date.split('T')[0]
              if (!newData[dateKey]) newData[dateKey] = []
              newData[dateKey].push(updatedTask)
            }

            return newData
          })
        }
      }

      // Return a context object with the snapshotted values
      return { previousTasks, previousTask, previousKanban, previousCalendar }
    },
    onError: (_err, { id }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks, context.previousTasks)
      }
      if (context?.previousTask) {
        queryClient.setQueryData(queryKeys.task(id), context.previousTask)
      }
      if (context?.previousKanban) {
        queryClient.setQueryData(queryKeys.kanban, context.previousKanban)
      }
      if (context?.previousCalendar) {
        queryClient.setQueryData(queryKeys.calendar, context.previousCalendar)
      }
    },
    onSuccess: (_, { id }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
      queryClient.invalidateQueries({ queryKey: queryKeys.task(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.kanban })
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar })
      queryClient.invalidateQueries({ queryKey: queryKeys.archived })
      // Invalidate review analytics queries when task status changes
      queryClient.invalidateQueries({ queryKey: queryKeys.dailySummary })
      queryClient.invalidateQueries({ queryKey: queryKeys.weeklySummary })
      queryClient.invalidateQueries({ queryKey: queryKeys.insights })
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
      queryClient.invalidateQueries({ queryKey: queryKeys.archived })
      // Invalidate review analytics queries when tasks are deleted
      queryClient.invalidateQueries({ queryKey: queryKeys.dailySummary })
      queryClient.invalidateQueries({ queryKey: queryKeys.weeklySummary })
      queryClient.invalidateQueries({ queryKey: queryKeys.insights })
    },
  })
}

export const useArchiveCompletedTasks = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksApi.archiveCompleted,
    onSuccess: () => {
      // Invalidate tasks queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
      queryClient.invalidateQueries({ queryKey: queryKeys.kanban })
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar })
      queryClient.invalidateQueries({ queryKey: queryKeys.archived })
      // Invalidate review analytics queries when tasks are archived
      queryClient.invalidateQueries({ queryKey: queryKeys.dailySummary })
      queryClient.invalidateQueries({ queryKey: queryKeys.weeklySummary })
      queryClient.invalidateQueries({ queryKey: queryKeys.insights })
    },
  })
}

export const useArchivedTasks = () => {
  return useQuery({
    queryKey: queryKeys.archived,
    queryFn: tasksApi.getArchived,
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
export const useSettings = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: settingsApi.getSettings,
    enabled: enabled, // Allow disabling the query when user is not authenticated
    retry: (failureCount, error: any) => {
      // do not retry on 401 authentication errors
      if (error?.code === 401 || error?.isStatus?.(401)) {
        return false
      }
      return failureCount < 3
    },
  })
}

export const useUpdateSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: settingsApi.updateSettings,
    onSuccess: (data) => {
      console.log('Mutation onSuccess - received data:', data)
      // Immediately update the cache with the returned data
      queryClient.setQueryData(queryKeys.settings, data)
      console.log('Updated settings cache with new data')
    },
    onError: (error) => {
      console.error('Mutation onError:', error)
    }
  })
}

// Timer hooks
export { usePomodoroTimer } from './hooks/timer'

// Data management hooks
export const useExportData = () => {
  return useMutation({
    mutationFn: async () => {
      const blob = await dataApi.export()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      link.download = `taskline-export-${timestamp}.json`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      return { success: true }
    },
  })
}

export const useImportData = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: dataApi.import,
    onSuccess: () => {
      // Invalidate all data queries to refresh the UI with imported data
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
      queryClient.invalidateQueries({ queryKey: queryKeys.kanban })
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar })
      queryClient.invalidateQueries({ queryKey: queryKeys.categories })
      queryClient.invalidateQueries({ queryKey: queryKeys.archived })
      queryClient.invalidateQueries({ queryKey: queryKeys.journal })
      queryClient.invalidateQueries({ queryKey: queryKeys.settings })
    },
  })
}

// Account deletion hooks
export const useAccountDeletionPreview = () => {
  return useQuery({
    queryKey: ['account', 'deletion-preview'],
    queryFn: accountApi.previewDeletion,
    enabled: false, // Don't fetch automatically, only when explicitly called
    staleTime: 0, // Always fetch fresh data
  })
}

export const useDeleteAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: accountApi.deleteAccount,
    onSuccess: () => {
      // Clear all cached data after account deletion
      queryClient.clear()
    },
  })
}
