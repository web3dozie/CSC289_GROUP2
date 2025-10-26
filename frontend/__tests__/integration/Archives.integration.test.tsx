import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { TaskList } from '../../src/components/views/TaskList'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

describe('Archive Management Integration Tests', () => {
  beforeEach(() => {
    server.resetHandlers()
    // Mock window.alert for archive completed functionality
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  describe('Archive from Main List', () => {
    it('archives a task from main task list', async () => {
      const user = userEvent.setup()

      // Setup: Return one active task
      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 1,
                title: 'Test Task',
                description: 'Test description',
                done: false,
                archived: false,
                priority: 'medium',
                estimate_minutes: 60,
                due_date: '2025-10-30',
                status: { id: 1, name: 'To Do' },
                category: null,
                created_on: new Date().toISOString(),
                updated_on: new Date().toISOString(),
                created_at: new Date().toISOString()
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      // Wait for task to load
      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument()
      })

      // Find and click archive button
      const archiveButton = screen.getByLabelText('Archive task: Test Task')

      // Mock archive API call
      let archivedData: any = null
      server.use(
        http.put('/api/tasks/1', async ({ request }) => {
          archivedData = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              id: 1,
              title: 'Test Task',
              description: 'Test description',
              archived: true,
              done: false,
              priority: 'medium',
              estimate_minutes: 60,
              due_date: '2025-10-30',
              status: { id: 1, name: 'To Do' },
              category: null,
              created_on: new Date().toISOString(),
              updated_on: new Date().toISOString(),
              created_at: new Date().toISOString()
            }
          })
        }),
        // Main list now returns empty (archived tasks filtered out)
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [],
              pagination: { total: 0, page: 1, per_page: 50, total_pages: 0 }
            }
          })
        })
      )

      // Click archive
      await user.click(archiveButton)

      // Verify API called with archived: true
      await waitFor(() => {
        expect(archivedData).toBeTruthy()
        expect(archivedData.archived).toBe(true)
      })

      // Verify task removed from main list
      await waitFor(() => {
        expect(screen.queryByText('Test Task')).not.toBeInTheDocument()
        expect(screen.getByText('No tasks yet')).toBeInTheDocument()
      })
    })

    it('archives multiple tasks from list', async () => {
      const user = userEvent.setup()

      // Setup: Return 3 active tasks
      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [
                {
                  id: 1,
                  title: 'Task 1',
                  description: 'Description 1',
                  done: false,
                  archived: false,
                  priority: 'high',
                  estimate_minutes: 30,
                  due_date: '2025-10-28',
                  status: { id: 1, name: 'To Do' },
                  category: null,
                  created_on: new Date().toISOString(),
                  updated_on: new Date().toISOString(),
                  created_at: new Date().toISOString()
                },
                {
                  id: 2,
                  title: 'Task 2',
                  description: 'Description 2',
                  done: false,
                  archived: false,
                  priority: 'medium',
                  estimate_minutes: 45,
                  due_date: '2025-10-29',
                  status: { id: 2, name: 'In Progress' },
                  category: null,
                  created_on: new Date().toISOString(),
                  updated_on: new Date().toISOString(),
                  created_at: new Date().toISOString()
                },
                {
                  id: 3,
                  title: 'Task 3',
                  description: 'Description 3',
                  done: false,
                  archived: false,
                  priority: 'low',
                  estimate_minutes: 60,
                  due_date: '2025-10-30',
                  status: { id: 1, name: 'To Do' },
                  category: null,
                  created_on: new Date().toISOString(),
                  updated_on: new Date().toISOString(),
                  created_at: new Date().toISOString()
                }
              ],
              pagination: { total: 3, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      // Wait for all tasks to load
      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument()
        expect(screen.getByText('Task 2')).toBeInTheDocument()
        expect(screen.getByText('Task 3')).toBeInTheDocument()
      })

      // Archive task 1
      let archived1Data: any = null
      server.use(
        http.put('/api/tasks/1', async ({ request }) => {
          archived1Data = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              id: 1,
              title: 'Task 1',
              archived: true,
              done: false,
              priority: 'high',
              estimate_minutes: 30,
              due_date: '2025-10-28',
              status: { id: 1, name: 'To Do' },
              category: null,
              created_on: new Date().toISOString(),
              updated_on: new Date().toISOString(),
              created_at: new Date().toISOString()
            }
          })
        }),
        // Return 2 tasks after first archive
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [
                {
                  id: 2,
                  title: 'Task 2',
                  done: false,
                  archived: false,
                  priority: 'medium',
                  estimate_minutes: 45,
                  due_date: '2025-10-29',
                  status: { id: 2, name: 'In Progress' },
                  category: null,
                  created_on: new Date().toISOString(),
                  updated_on: new Date().toISOString(),
                  created_at: new Date().toISOString()
                },
                {
                  id: 3,
                  title: 'Task 3',
                  done: false,
                  archived: false,
                  priority: 'low',
                  estimate_minutes: 60,
                  due_date: '2025-10-30',
                  status: { id: 1, name: 'To Do' },
                  category: null,
                  created_on: new Date().toISOString(),
                  updated_on: new Date().toISOString(),
                  created_at: new Date().toISOString()
                }
              ],
              pagination: { total: 2, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      const archiveButton1 = screen.getByLabelText('Archive task: Task 1')
      await user.click(archiveButton1)

      // Verify first task archived
      await waitFor(() => {
        expect(archived1Data).toBeTruthy()
        expect(archived1Data.archived).toBe(true)
        expect(screen.queryByText('Task 1')).not.toBeInTheDocument()
        expect(screen.getByText('Task 2')).toBeInTheDocument()
        expect(screen.getByText('Task 3')).toBeInTheDocument()
      })

      // Archive task 2
      let archived2Data: any = null
      server.use(
        http.put('/api/tasks/2', async ({ request }) => {
          archived2Data = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              id: 2,
              title: 'Task 2',
              archived: true,
              done: false,
              priority: 'medium',
              estimate_minutes: 45,
              due_date: '2025-10-29',
              status: { id: 2, name: 'In Progress' },
              category: null,
              created_on: new Date().toISOString(),
              updated_on: new Date().toISOString(),
              created_at: new Date().toISOString()
            }
          })
        }),
        // Return only task 3 after second archive
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 3,
                title: 'Task 3',
                done: false,
                archived: false,
                priority: 'low',
                estimate_minutes: 60,
                due_date: '2025-10-30',
                status: { id: 1, name: 'To Do' },
                category: null,
                created_on: new Date().toISOString(),
                updated_on: new Date().toISOString(),
                created_at: new Date().toISOString()
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      const archiveButton2 = screen.getByLabelText('Archive task: Task 2')
      await user.click(archiveButton2)

      // Verify both tasks archived
      await waitFor(() => {
        expect(archived2Data).toBeTruthy()
        expect(archived2Data.archived).toBe(true)
        expect(screen.queryByText('Task 1')).not.toBeInTheDocument()
        expect(screen.queryByText('Task 2')).not.toBeInTheDocument()
        expect(screen.getByText('Task 3')).toBeInTheDocument()
      })

      // Verify task count updated
      expect(screen.getByText('1 of 1 tasks')).toBeInTheDocument()
    })

    it('archives a completed task', async () => {
      const user = userEvent.setup()

      // Setup: Return one completed task
      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 5,
                title: 'Completed Task',
                description: 'This task is done',
                done: true,
                archived: false,
                priority: 'high',
                estimate_minutes: 90,
                due_date: '2025-10-25',
                status: { id: 4, name: 'Done' },
                category: 'Work',
                created_on: new Date().toISOString(),
                updated_on: new Date().toISOString(),
                created_at: new Date().toISOString()
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      // Wait for task to load
      await waitFor(() => {
        expect(screen.getByText('Completed Task')).toBeInTheDocument()
      })

      // Mock archive API call
      let archivedData: any = null
      server.use(
        http.put('/api/tasks/5', async ({ request }) => {
          archivedData = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              id: 5,
              title: 'Completed Task',
              archived: true,
              done: true,
              priority: 'high',
              estimate_minutes: 90,
              due_date: '2025-10-25',
              status: { id: 4, name: 'Done' },
              category: 'Work',
              created_on: new Date().toISOString(),
              updated_on: new Date().toISOString(),
              created_at: new Date().toISOString()
            }
          })
        }),
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [],
              pagination: { total: 0, page: 1, per_page: 50, total_pages: 0 }
            }
          })
        })
      )

      // Archive the completed task
      const archiveButton = screen.getByLabelText('Archive task: Completed Task')
      await user.click(archiveButton)

      // Verify archived successfully
      await waitFor(() => {
        expect(archivedData).toBeTruthy()
        expect(archivedData.archived).toBe(true)
        expect(screen.queryByText('Completed Task')).not.toBeInTheDocument()
      })
    })

    it('shows correct task count after archiving', async () => {
      const user = userEvent.setup()

      // Setup: Return 5 tasks
      const createTask = (id: number) => ({
        id,
        title: `Task ${id}`,
        description: `Description ${id}`,
        done: false,
        archived: false,
        priority: 'medium',
        estimate_minutes: 30,
        due_date: '2025-10-30',
        status: { id: 1, name: 'To Do' },
        category: null,
        created_on: new Date().toISOString(),
        updated_on: new Date().toISOString(),
        created_at: new Date().toISOString()
      })

      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [1, 2, 3, 4, 5].map(createTask),
              pagination: { total: 5, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      // Wait for tasks to load
      await waitFor(() => {
        expect(screen.getByText('5 of 5 tasks')).toBeInTheDocument()
      })

      // Archive one task
      server.use(
        http.put('/api/tasks/3', async () => {
          return HttpResponse.json({
            success: true,
            data: { ...createTask(3), archived: true }
          })
        }),
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [1, 2, 4, 5].map(createTask),
              pagination: { total: 4, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      const archiveButton = screen.getByLabelText('Archive task: Task 3')
      await user.click(archiveButton)

      // Verify count updated
      await waitFor(() => {
        expect(screen.getByText('4 of 4 tasks')).toBeInTheDocument()
      })
    })
  })

  describe('Bulk Operations', () => {
    it('archives all completed tasks at once', async () => {
      const user = userEvent.setup()

      // Setup: Return 5 tasks (3 completed, 2 active)
      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [
                {
                  id: 1,
                  title: 'Active Task 1',
                  done: false,
                  archived: false,
                  priority: 'high',
                  estimate_minutes: 30,
                  due_date: '2025-10-28',
                  status: { id: 1, name: 'To Do' },
                  category: null,
                  created_on: new Date().toISOString(),
                  updated_on: new Date().toISOString(),
                  created_at: new Date().toISOString()
                },
                {
                  id: 2,
                  title: 'Completed Task 1',
                  done: true,
                  archived: false,
                  priority: 'medium',
                  estimate_minutes: 45,
                  due_date: '2025-10-25',
                  status: { id: 4, name: 'Done' },
                  category: null,
                  created_on: new Date().toISOString(),
                  updated_on: new Date().toISOString(),
                  created_at: new Date().toISOString()
                },
                {
                  id: 3,
                  title: 'Completed Task 2',
                  done: true,
                  archived: false,
                  priority: 'low',
                  estimate_minutes: 60,
                  due_date: '2025-10-24',
                  status: { id: 4, name: 'Done' },
                  category: null,
                  created_on: new Date().toISOString(),
                  updated_on: new Date().toISOString(),
                  created_at: new Date().toISOString()
                },
                {
                  id: 4,
                  title: 'Active Task 2',
                  done: false,
                  archived: false,
                  priority: 'medium',
                  estimate_minutes: 30,
                  due_date: '2025-10-29',
                  status: { id: 2, name: 'In Progress' },
                  category: null,
                  created_on: new Date().toISOString(),
                  updated_on: new Date().toISOString(),
                  created_at: new Date().toISOString()
                },
                {
                  id: 5,
                  title: 'Completed Task 3',
                  done: true,
                  archived: false,
                  priority: 'high',
                  estimate_minutes: 90,
                  due_date: '2025-10-23',
                  status: { id: 4, name: 'Done' },
                  category: null,
                  created_on: new Date().toISOString(),
                  updated_on: new Date().toISOString(),
                  created_at: new Date().toISOString()
                }
              ],
              pagination: { total: 5, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      // Wait for all tasks to load
      await waitFor(() => {
        expect(screen.getByText('5 of 5 tasks')).toBeInTheDocument()
        expect(screen.getByText('Active Task 1')).toBeInTheDocument()
        expect(screen.getByText('Completed Task 1')).toBeInTheDocument()
      })

      // Find the "Archive Completed" button
      const archiveCompletedButton = screen.getByRole('button', { name: /archive completed/i })
      expect(archiveCompletedButton).toBeInTheDocument()

      // Mock bulk archive API call
      server.use(
        http.post('/api/tasks/archive-completed', () => {
          return HttpResponse.json({
            success: true,
            data: {
              message: 'Archived 3 completed tasks',
              archived_count: 3
            }
          })
        }),
        // Main list now returns only 2 active tasks
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [
                {
                  id: 1,
                  title: 'Active Task 1',
                  done: false,
                  archived: false,
                  priority: 'high',
                  estimate_minutes: 30,
                  due_date: '2025-10-28',
                  status: { id: 1, name: 'To Do' },
                  category: null,
                  created_on: new Date().toISOString(),
                  updated_on: new Date().toISOString(),
                  created_at: new Date().toISOString()
                },
                {
                  id: 4,
                  title: 'Active Task 2',
                  done: false,
                  archived: false,
                  priority: 'medium',
                  estimate_minutes: 30,
                  due_date: '2025-10-29',
                  status: { id: 2, name: 'In Progress' },
                  category: null,
                  created_on: new Date().toISOString(),
                  updated_on: new Date().toISOString(),
                  created_at: new Date().toISOString()
                }
              ],
              pagination: { total: 2, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      // Click the Archive Completed button
      await user.click(archiveCompletedButton)

      // Verify success alert shown with correct message
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Successfully archived 3 completed tasks!')
      })

      // Verify main list updated to show only 2 active tasks
      await waitFor(() => {
        expect(screen.getByText('2 of 2 tasks')).toBeInTheDocument()
        expect(screen.getByText('Active Task 1')).toBeInTheDocument()
        expect(screen.getByText('Active Task 2')).toBeInTheDocument()
        expect(screen.queryByText('Completed Task 1')).not.toBeInTheDocument()
        expect(screen.queryByText('Completed Task 2')).not.toBeInTheDocument()
        expect(screen.queryByText('Completed Task 3')).not.toBeInTheDocument()
      })
    })

    it('shows button disabled state during bulk archive', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 1,
                title: 'Completed Task',
                done: true,
                archived: false,
                priority: 'medium',
                estimate_minutes: 30,
                due_date: '2025-10-25',
                status: { id: 4, name: 'Done' },
                category: null,
                created_on: new Date().toISOString(),
                updated_on: new Date().toISOString(),
                created_at: new Date().toISOString()
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText('Completed Task')).toBeInTheDocument()
      })

      const archiveButton = screen.getByRole('button', { name: /archive completed/i })
      expect(archiveButton).not.toBeDisabled()

      // Mock slow API response
      server.use(
        http.post('/api/tasks/archive-completed', async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json({
            success: true,
            data: {
              message: 'Archived 1 completed tasks',
              archived_count: 1
            }
          })
        })
      )

      await user.click(archiveButton)

      // Button should show loading state
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /archiving/i })
        expect(button).toBeInTheDocument()
        expect(button).toBeDisabled()
      })
    })

    it('handles bulk archive with no completed tasks', async () => {
      const user = userEvent.setup()

      // Setup: Return only active tasks
      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [
                {
                  id: 1,
                  title: 'Active Task 1',
                  done: false,
                  archived: false,
                  priority: 'high',
                  estimate_minutes: 30,
                  due_date: '2025-10-28',
                  status: { id: 1, name: 'To Do' },
                  category: null,
                  created_on: new Date().toISOString(),
                  updated_on: new Date().toISOString(),
                  created_at: new Date().toISOString()
                },
                {
                  id: 2,
                  title: 'Active Task 2',
                  done: false,
                  archived: false,
                  priority: 'medium',
                  estimate_minutes: 45,
                  due_date: '2025-10-29',
                  status: { id: 2, name: 'In Progress' },
                  category: null,
                  created_on: new Date().toISOString(),
                  updated_on: new Date().toISOString(),
                  created_at: new Date().toISOString()
                }
              ],
              pagination: { total: 2, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText('2 of 2 tasks')).toBeInTheDocument()
      })

      // Mock bulk archive returning 0 count
      server.use(
        http.post('/api/tasks/archive-completed', () => {
          return HttpResponse.json({
            success: true,
            data: {
              message: 'Archived 0 completed tasks',
              archived_count: 0
            }
          })
        })
      )

      const archiveButton = screen.getByRole('button', { name: /archive completed/i })
      await user.click(archiveButton)

      // Should still show success message
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Successfully archived 0 completed tasks!')
      })

      // Tasks remain unchanged
      expect(screen.getByText('Active Task 1')).toBeInTheDocument()
      expect(screen.getByText('Active Task 2')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('shows error when archive fails', async () => {
      const user = userEvent.setup()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Setup: Return one task
      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 1,
                title: 'Test Task',
                done: false,
                archived: false,
                priority: 'medium',
                estimate_minutes: 30,
                due_date: '2025-10-30',
                status: { id: 1, name: 'To Do' },
                category: null,
                created_on: new Date().toISOString(),
                updated_on: new Date().toISOString(),
                created_at: new Date().toISOString()
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument()
      })

      // Mock archive API to fail
      server.use(
        http.put('/api/tasks/1', () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                code: 500,
                message: 'Internal server error'
              }
            },
            { status: 500 }
          )
        })
      )

      const archiveButton = screen.getByLabelText('Archive task: Test Task')
      await user.click(archiveButton)

      // Verify error was logged
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to archive task:',
          expect.any(Error)
        )
      })

      // Task should still be visible (archive failed)
      expect(screen.getByText('Test Task')).toBeInTheDocument()

      consoleErrorSpy.mockRestore()
    })

    it('shows error when bulk archive fails', async () => {
      const user = userEvent.setup()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 1,
                title: 'Completed Task',
                done: true,
                archived: false,
                priority: 'medium',
                estimate_minutes: 30,
                due_date: '2025-10-25',
                status: { id: 4, name: 'Done' },
                category: null,
                created_on: new Date().toISOString(),
                updated_on: new Date().toISOString(),
                created_at: new Date().toISOString()
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText('Completed Task')).toBeInTheDocument()
      })

      // Mock bulk archive to fail
      server.use(
        http.post('/api/tasks/archive-completed', () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                code: 500,
                message: 'Database error'
              }
            },
            { status: 500 }
          )
        })
      )

      const archiveButton = screen.getByRole('button', { name: /archive completed/i })
      await user.click(archiveButton)

      // Verify error was logged and alert shown
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to archive completed tasks:',
          expect.any(Error)
        )
        expect(window.alert).toHaveBeenCalledWith(
          'Failed to archive completed tasks. Please try again.'
        )
      })

      // Task should still be visible
      expect(screen.getByText('Completed Task')).toBeInTheDocument()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Archive Button Visibility', () => {
    it('shows archive button for all tasks in list', async () => {
      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [
                {
                  id: 1,
                  title: 'Task 1',
                  done: false,
                  archived: false,
                  priority: 'medium',
                  estimate_minutes: 30,
                  due_date: '2025-10-30',
                  status: { id: 1, name: 'To Do' },
                  category: null,
                  created_on: new Date().toISOString(),
                  updated_on: new Date().toISOString(),
                  created_at: new Date().toISOString()
                },
                {
                  id: 2,
                  title: 'Task 2',
                  done: true,
                  archived: false,
                  priority: 'high',
                  estimate_minutes: 60,
                  due_date: '2025-10-28',
                  status: { id: 4, name: 'Done' },
                  category: null,
                  created_on: new Date().toISOString(),
                  updated_on: new Date().toISOString(),
                  created_at: new Date().toISOString()
                }
              ],
              pagination: { total: 2, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument()
        expect(screen.getByText('Task 2')).toBeInTheDocument()
      })

      // Verify archive buttons exist for both tasks
      expect(screen.getByLabelText('Archive task: Task 1')).toBeInTheDocument()
      expect(screen.getByLabelText('Archive task: Task 2')).toBeInTheDocument()
    })

    it('archive button has correct hover color and icon', async () => {
      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 1,
                title: 'Test Task',
                done: false,
                archived: false,
                priority: 'medium',
                estimate_minutes: 30,
                due_date: '2025-10-30',
                status: { id: 1, name: 'To Do' },
                category: null,
                created_on: new Date().toISOString(),
                updated_on: new Date().toISOString(),
                created_at: new Date().toISOString()
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument()
      })

      const archiveButton = screen.getByLabelText('Archive task: Test Task')

      // Verify button exists and has correct properties
      expect(archiveButton).toBeInTheDocument()
      expect(archiveButton.tagName).toBe('BUTTON')

      // Verify the Archive icon is present (svg element)
      const svg = archiveButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Integration with React Query', () => {
    it('invalidates queries after archiving task', async () => {
      const user = userEvent.setup()

      // Track how many times GET /api/tasks/ is called
      let getTasksCalls = 0

      server.use(
        http.get('/api/tasks/', () => {
          getTasksCalls++
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 1,
                title: 'Test Task',
                done: false,
                archived: false,
                priority: 'medium',
                estimate_minutes: 30,
                due_date: '2025-10-30',
                status: { id: 1, name: 'To Do' },
                category: null,
                created_on: new Date().toISOString(),
                updated_on: new Date().toISOString(),
                created_at: new Date().toISOString()
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument()
      })

      const initialCalls = getTasksCalls

      // Mock archive
      server.use(
        http.put('/api/tasks/1', async () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 1,
              title: 'Test Task',
              archived: true,
              done: false,
              priority: 'medium',
              estimate_minutes: 30,
              due_date: '2025-10-30',
              status: { id: 1, name: 'To Do' },
              category: null,
              created_on: new Date().toISOString(),
              updated_on: new Date().toISOString(),
              created_at: new Date().toISOString()
            }
          })
        }),
        http.get('/api/tasks/', () => {
          getTasksCalls++
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [],
              pagination: { total: 0, page: 1, per_page: 50, total_pages: 0 }
            }
          })
        })
      )

      const archiveButton = screen.getByLabelText('Archive task: Test Task')
      await user.click(archiveButton)

      // Verify React Query refetched tasks
      await waitFor(() => {
        expect(getTasksCalls).toBeGreaterThan(initialCalls)
      })
    })

    it('maintains filtered view after archiving', async () => {
      const user = userEvent.setup()

      // Setup tasks with categories
      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [
                {
                  id: 1,
                  title: 'Work Task',
                  done: false,
                  archived: false,
                  priority: 'high',
                  estimate_minutes: 60,
                  due_date: '2025-10-30',
                  status: { id: 1, name: 'To Do' },
                  category: 'Work',
                  created_on: new Date().toISOString(),
                  updated_on: new Date().toISOString(),
                  created_at: new Date().toISOString()
                },
                {
                  id: 2,
                  title: 'Personal Task',
                  done: false,
                  archived: false,
                  priority: 'medium',
                  estimate_minutes: 30,
                  due_date: '2025-10-29',
                  status: { id: 1, name: 'To Do' },
                  category: 'Personal',
                  created_on: new Date().toISOString(),
                  updated_on: new Date().toISOString(),
                  created_at: new Date().toISOString()
                }
              ],
              pagination: { total: 2, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText('Work Task')).toBeInTheDocument()
        expect(screen.getByText('Personal Task')).toBeInTheDocument()
      })

      // Filter by category "Work"
      const categoryFilter = screen.getByLabelText('Filter by category')
      await user.selectOptions(categoryFilter, 'Work')

      // Verify only work task shown
      await waitFor(() => {
        expect(screen.getByText('Work Task')).toBeInTheDocument()
        expect(screen.queryByText('Personal Task')).not.toBeInTheDocument()
      })

      // Archive the work task
      server.use(
        http.put('/api/tasks/1', async () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 1,
              title: 'Work Task',
              archived: true,
              done: false,
              priority: 'high',
              estimate_minutes: 60,
              due_date: '2025-10-30',
              status: { id: 1, name: 'To Do' },
              category: 'Work',
              created_on: new Date().toISOString(),
              updated_on: new Date().toISOString(),
              created_at: new Date().toISOString()
            }
          })
        }),
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 2,
                title: 'Personal Task',
                done: false,
                archived: false,
                priority: 'medium',
                estimate_minutes: 30,
                due_date: '2025-10-29',
                status: { id: 1, name: 'To Do' },
                category: 'Personal',
                created_on: new Date().toISOString(),
                updated_on: new Date().toISOString(),
                created_at: new Date().toISOString()
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      const archiveButton = screen.getByLabelText('Archive task: Work Task')
      await user.click(archiveButton)

      // After archive, should show empty state for Work category
      await waitFor(() => {
        expect(screen.queryByText('Work Task')).not.toBeInTheDocument()
        expect(screen.getByText('No tasks match your filters')).toBeInTheDocument()
      })

      // Switch back to "All Categories"
      await user.selectOptions(categoryFilter, 'all')

      // Should now show Personal task
      await waitFor(() => {
        expect(screen.getByText('Personal Task')).toBeInTheDocument()
      })
    })
  })
})
