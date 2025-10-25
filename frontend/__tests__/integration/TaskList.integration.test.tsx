import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'
import { TaskList } from '../../src/components/views/TaskList'

describe('TaskList CRUD Integration Tests', () => {
  beforeEach(() => {
    server.resetHandlers()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.spyOn(window, 'confirm').mockImplementation(() => true)

    // Ensure categories endpoint is always available
    server.use(
      http.get('/api/tasks/categories', () => {
        return HttpResponse.json({
          success: true,
          data: ['Work', 'Personal', 'Shopping', 'Health']
        })
      })
    )
  })

  describe('Create Task', () => {
    it('creates a new task with all fields', async () => {
      const user = userEvent.setup()

      // Setup: Mock empty task list initially
      server.use(
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

      // Render component
      render(<TaskList />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/new task/i)).toBeInTheDocument()
      })

      // Click "New Task" button
      const newTaskButton = screen.getByRole('button', { name: /new task/i })
      await user.click(newTaskButton)

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      // Fill in form fields
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'New Integration Test Task')

      const descriptionInput = screen.getByLabelText(/description/i)
      await user.type(descriptionInput, 'This is a comprehensive test description')

      // Set priority
      const priorityCheckbox = screen.getByLabelText(/high priority/i)
      await user.click(priorityCheckbox)

      // Set due date (use a future date)
      const dueDateInput = screen.getByLabelText(/due date/i)
      await user.type(dueDateInput, '2025-12-31')

      // Set time estimate
      const estimateInput = screen.getByLabelText(/time estimate/i)
      await user.type(estimateInput, '120')

      // Mock create API call and subsequent task list refresh
      let createdTaskData: any = null
      server.use(
        http.post('/api/tasks/', async ({ request }) => {
          createdTaskData = await request.json()
          return HttpResponse.json({
            success: true,
            data: { task_id: 999, message: 'Task created successfully' }
          })
        }),
        // Mock refreshed task list with the new task
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 999,
                title: 'New Integration Test Task',
                description: 'This is a comprehensive test description',
                done: false,
                archived: false,
                category: '',
                priority: true,
                estimate_minutes: 120,
                due_date: '2025-12-31',
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                updated_on: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create task/i })
      await user.click(submitButton)

      // Verify API called with correct data
      await waitFor(() => {
        expect(createdTaskData).toBeTruthy()
        expect(createdTaskData.title).toBe('New Integration Test Task')
        expect(createdTaskData.description).toBe('This is a comprehensive test description')
        expect(createdTaskData.priority).toBe(true)
        expect(createdTaskData.due_date).toBe('2025-12-31')
        expect(createdTaskData.estimate_minutes).toBe(120)
      })

      // Verify modal closed and task appears in list
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('New Integration Test Task')).toBeInTheDocument()
        expect(screen.getByText('This is a comprehensive test description')).toBeInTheDocument()
      })
    })

    it('creates a task with only title (minimal fields)', async () => {
      const user = userEvent.setup()

      // Setup: Mock empty task list
      server.use(
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

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText(/new task/i)).toBeInTheDocument()
      })

      // Click "New Task" button
      const newTaskButton = screen.getByRole('button', { name: /new task/i })
      await user.click(newTaskButton)

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      // Fill only title
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Minimal Task')

      // Mock create
      let createdTaskData: any = null
      server.use(
        http.post('/api/tasks/', async ({ request }) => {
          createdTaskData = await request.json()
          return HttpResponse.json({
            success: true,
            data: { task_id: 888, message: 'Task created successfully' }
          })
        }),
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 888,
                title: 'Minimal Task',
                description: '',
                done: false,
                archived: false,
                category: '',
                priority: false,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      // Submit
      const submitButton = screen.getByRole('button', { name: /create task/i })
      await user.click(submitButton)

      // Verify minimal data sent
      await waitFor(() => {
        expect(createdTaskData).toBeTruthy()
        expect(createdTaskData.title).toBe('Minimal Task')
        expect(createdTaskData.description).toBeUndefined()
        expect(createdTaskData.priority).toBe(false)
      })

      // Verify task appears
      await waitFor(() => {
        expect(screen.getByText('Minimal Task')).toBeInTheDocument()
      })
    })

    it('validates required title field', async () => {
      const user = userEvent.setup()

      server.use(
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

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText(/new task/i)).toBeInTheDocument()
      })

      const newTaskButton = screen.getByRole('button', { name: /new task/i })
      await user.click(newTaskButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      // Try to submit without title
      const submitButton = screen.getByRole('button', { name: /create task/i })

      // Submit button should be disabled when title is empty
      expect(submitButton).toBeDisabled()

      // Type some spaces (should still be invalid)
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, '   ')

      // Button should still be disabled
      expect(submitButton).toBeDisabled()
    })

    it('cancels task creation', async () => {
      const user = userEvent.setup()

      server.use(
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

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText(/new task/i)).toBeInTheDocument()
      })

      const newTaskButton = screen.getByRole('button', { name: /new task/i })
      await user.click(newTaskButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      // Fill some fields
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Task to Cancel')

      // Mock to verify no POST call is made
      let postCalled = false
      server.use(
        http.post('/api/tasks/', () => {
          postCalled = true
          return HttpResponse.json({
            success: true,
            data: { task_id: 777, message: 'Task created successfully' }
          })
        })
      )

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Verify modal closed
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Verify no API call was made
      expect(postCalled).toBe(false)
    })

    it('shows success message after creating task', async () => {
      const user = userEvent.setup()

      server.use(
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

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText(/new task/i)).toBeInTheDocument()
      })

      const newTaskButton = screen.getByRole('button', { name: /new task/i })
      await user.click(newTaskButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Success Task')

      server.use(
        http.post('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: { task_id: 666, message: 'Task created successfully' }
          })
        }),
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 666,
                title: 'Success Task',
                done: false,
                archived: false,
                category: '',
                priority: false,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      const submitButton = screen.getByRole('button', { name: /create task/i })
      await user.click(submitButton)

      // Wait for modal to close (indicates success)
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Verify task appears (confirms successful creation)
      await waitFor(() => {
        expect(screen.getByText('Success Task')).toBeInTheDocument()
      })
    })
  })

  describe('Update Task', () => {
    it('edits task title and description', async () => {
      const user = userEvent.setup()

      // Setup: Mock task list with one task
      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 1,
                title: 'Original Title',
                description: 'Original description',
                done: false,
                archived: false,
                category: '',
                priority: false,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      // Wait for task to appear
      await waitFor(() => {
        expect(screen.getByText('Original Title')).toBeInTheDocument()
      })

      // Find and click edit button
      const editButton = screen.getByRole('button', { name: /edit task: original title/i })
      await user.click(editButton)

      // Wait for modal with pre-filled data
      await waitFor(() => {
        const titleInput = screen.getByRole('textbox', { name: /title/i }) as HTMLInputElement
        expect(titleInput.value).toBe('Original Title')
      })

      // Modify title and description
      const titleInput = screen.getByRole('textbox', { name: /title/i })
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Title')

      const descriptionInput = screen.getByRole('textbox', { name: /description/i })
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Updated description')

      // Mock update API
      let updatedTaskData: any = null
      server.use(
        http.put('/api/tasks/1', async ({ request }) => {
          updatedTaskData = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              id: 1,
              title: 'Updated Title',
              description: 'Updated description',
              done: false,
              archived: false,
              category: '',
              priority: false,
              order: 0,
              status: { id: 1, name: 'To Do' },
              created_at: new Date().toISOString(),
              updated_on: new Date().toISOString(),
              created_by: 1
            }
          })
        }),
        // Mock refreshed list
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 1,
                title: 'Updated Title',
                description: 'Updated description',
                done: false,
                archived: false,
                category: '',
                priority: false,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                updated_on: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      // Submit update
      const updateButton = screen.getByRole('button', { name: /update task/i })
      await user.click(updateButton)

      // Verify API called with correct data
      await waitFor(() => {
        expect(updatedTaskData).toBeTruthy()
        expect(updatedTaskData.title).toBe('Updated Title')
        expect(updatedTaskData.description).toBe('Updated description')
      })

      // Verify updated task appears in list
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Updated Title')).toBeInTheDocument()
        expect(screen.getByText('Updated description')).toBeInTheDocument()
      })
    })

    it('updates task priority', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 2,
                title: 'Task to Prioritize',
                description: 'Normal priority task',
                done: false,
                archived: false,
                category: '',
                priority: false,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText('Task to Prioritize')).toBeInTheDocument()
      })

      // Click edit
      const editButton = screen.getByRole('button', { name: /edit task: task to prioritize/i })
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      // Toggle priority
      const priorityCheckbox = screen.getByLabelText(/high priority/i)
      expect(priorityCheckbox).not.toBeChecked()
      await user.click(priorityCheckbox)

      // Mock update
      let updatedTaskData: any = null
      server.use(
        http.put('/api/tasks/2', async ({ request }) => {
          updatedTaskData = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              id: 2,
              title: 'Task to Prioritize',
              description: 'Normal priority task',
              done: false,
              archived: false,
              category: '',
              priority: true,
              order: 0,
              status: { id: 1, name: 'To Do' },
              created_at: new Date().toISOString(),
              updated_on: new Date().toISOString(),
              created_by: 1
            }
          })
        }),
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 2,
                title: 'Task to Prioritize',
                description: 'Normal priority task',
                done: false,
                archived: false,
                category: '',
                priority: true,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                updated_on: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      const updateButton = screen.getByRole('button', { name: /update task/i })
      await user.click(updateButton)

      // Verify priority was updated
      await waitFor(() => {
        expect(updatedTaskData).toBeTruthy()
        expect(updatedTaskData.priority).toBe(true)
      })
    })

    it('updates task due date and estimate', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 3,
                title: 'Task to Schedule',
                description: 'No due date yet',
                done: false,
                archived: false,
                category: '',
                priority: false,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText('Task to Schedule')).toBeInTheDocument()
      })

      const editButton = screen.getByRole('button', { name: /edit task: task to schedule/i })
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument()
      })

      // Set due date (date input doesn't have textbox role, so we need to find it differently)
      const dueDateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      await user.type(dueDateInput, '2025-11-15')

      // Set estimate
      const estimateInput = screen.getByRole('textbox', { name: /time estimate/i })
      await user.type(estimateInput, '90')

      // Mock update
      let updatedTaskData: any = null
      server.use(
        http.put('/api/tasks/3', async ({ request }) => {
          updatedTaskData = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              id: 3,
              title: 'Task to Schedule',
              description: 'No due date yet',
              done: false,
              archived: false,
              category: '',
              priority: false,
              due_date: '2025-11-15',
              estimate_minutes: 90,
              order: 0,
              status: { id: 1, name: 'To Do' },
              created_at: new Date().toISOString(),
              updated_on: new Date().toISOString(),
              created_by: 1
            }
          })
        }),
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 3,
                title: 'Task to Schedule',
                description: 'No due date yet',
                done: false,
                archived: false,
                category: '',
                priority: false,
                due_date: '2025-11-15',
                estimate_minutes: 90,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                updated_on: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      const updateButton = screen.getByRole('button', { name: /update task/i })
      await user.click(updateButton)

      // Verify due date and estimate were updated
      await waitFor(() => {
        expect(updatedTaskData).toBeTruthy()
        expect(updatedTaskData.due_date).toBe('2025-11-15')
        expect(updatedTaskData.estimate_minutes).toBe(90)
      })
    })

    it('marks task as done/complete', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 4,
                title: 'Task to Complete',
                description: 'Not done yet',
                done: false,
                archived: false,
                category: '',
                priority: false,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText('Task to Complete')).toBeInTheDocument()
      })

      // Find checkbox
      const checkbox = screen.getByRole('checkbox', { name: /mark as complete: task to complete/i })
      expect(checkbox).not.toBeChecked()

      // Mock update
      let updatedTaskData: any = null
      server.use(
        http.put('/api/tasks/4', async ({ request }) => {
          updatedTaskData = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              id: 4,
              title: 'Task to Complete',
              description: 'Not done yet',
              done: true,
              archived: false,
              category: '',
              priority: false,
              order: 0,
              status: { id: 1, name: 'To Do' },
              created_at: new Date().toISOString(),
              updated_on: new Date().toISOString(),
              created_by: 1
            }
          })
        }),
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 4,
                title: 'Task to Complete',
                description: 'Not done yet',
                done: true,
                archived: false,
                category: '',
                priority: false,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                updated_on: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      // Click checkbox (this opens completion notes modal in the actual app)
      await user.click(checkbox)

      // Wait for completion notes modal
      await waitFor(() => {
        expect(screen.getByText(/complete task/i)).toBeInTheDocument()
      })

      // Click complete button in modal (no notes) - use getAllByRole and find the one in dialog
      const completeButtons = screen.getAllByRole('button', { name: /complete/i })
      // The complete button in the modal should be the last one (or we can be more specific)
      const modalCompleteButton = completeButtons.find(btn =>
        btn.textContent?.includes('Complete') && !btn.textContent?.includes('Archive')
      )
      await user.click(modalCompleteButton!)

      // Verify done was set to true
      await waitFor(() => {
        expect(updatedTaskData).toBeTruthy()
        expect(updatedTaskData.done).toBe(true)
      })
    })

    it('unmarks task as incomplete', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 5,
                title: 'Completed Task',
                description: 'Already done',
                done: true,
                archived: false,
                category: '',
                priority: false,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
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

      // Find checkbox
      const checkbox = screen.getByRole('checkbox', { name: /mark as incomplete: completed task/i })
      expect(checkbox).toBeChecked()

      // Mock update
      let updatedTaskData: any = null
      server.use(
        http.put('/api/tasks/5', async ({ request }) => {
          updatedTaskData = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              id: 5,
              title: 'Completed Task',
              description: 'Already done',
              done: false,
              archived: false,
              category: '',
              priority: false,
              order: 0,
              status: { id: 1, name: 'To Do' },
              created_at: new Date().toISOString(),
              updated_on: new Date().toISOString(),
              created_by: 1
            }
          })
        }),
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 5,
                title: 'Completed Task',
                description: 'Already done',
                done: false,
                archived: false,
                category: '',
                priority: false,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                updated_on: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      // Click checkbox to unmark (no modal for uncompleting)
      await user.click(checkbox)

      // Verify done was set to false
      await waitFor(() => {
        expect(updatedTaskData).toBeTruthy()
        expect(updatedTaskData.done).toBe(false)
      })
    })
  })

  describe('Delete Task', () => {
    it('deletes a task with confirmation', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 10,
                title: 'Task to Delete',
                description: 'Will be removed',
                done: false,
                archived: false,
                category: '',
                priority: false,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText('Task to Delete')).toBeInTheDocument()
      })

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete task: task to delete/i })
      await user.click(deleteButton)

      // Verify confirmation dialog appears
      await waitFor(() => {
        expect(screen.getByText(/delete task/i)).toBeInTheDocument()
        expect(screen.getByText(/are you sure you want to delete "task to delete"/i)).toBeInTheDocument()
      })

      // Mock delete API
      let deleteCalled = false
      server.use(
        http.delete('/api/tasks/10', () => {
          deleteCalled = true
          return new HttpResponse(null, { status: 204 })
        }),
        // Mock empty list after deletion
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

      // Click confirm delete in dialog - find the delete button within the dialog
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      // The confirm delete button should have only "Delete" or "Deleting..." as text
      const confirmButton = deleteButtons.find(btn => btn.textContent === 'Delete' || btn.textContent === 'Deleting...')
      await user.click(confirmButton!)

      // Verify DELETE was called
      await waitFor(() => {
        expect(deleteCalled).toBe(true)
      })

      // Verify task removed from list
      await waitFor(() => {
        expect(screen.queryByText('Task to Delete')).not.toBeInTheDocument()
      })

      // Should show empty state
      await waitFor(() => {
        expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument()
      })
    })

    it('cancels delete operation', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 11,
                title: 'Task to Keep',
                description: 'Should not be deleted',
                done: false,
                archived: false,
                category: '',
                priority: false,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText('Task to Keep')).toBeInTheDocument()
      })

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete task: task to keep/i })
      await user.click(deleteButton)

      // Verify confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/delete task/i)).toBeInTheDocument()
      })

      // Mock delete API (should not be called)
      let deleteCalled = false
      server.use(
        http.delete('/api/tasks/11', () => {
          deleteCalled = true
          return new HttpResponse(null, { status: 204 })
        })
      )

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Verify dialog closed
      await waitFor(() => {
        expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument()
      })

      // Verify DELETE was not called
      expect(deleteCalled).toBe(false)

      // Verify task still in list
      expect(screen.getByText('Task to Keep')).toBeInTheDocument()
    })

    it('updates task count after deletion', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 12,
                title: 'Task One',
                done: false,
                archived: false,
                category: '',
                priority: false,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }, {
                id: 13,
                title: 'Task Two',
                done: false,
                archived: false,
                category: '',
                priority: false,
                order: 1,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 2, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      // Verify initial count
      await waitFor(() => {
        expect(screen.getByText(/2 of 2 tasks/i)).toBeInTheDocument()
      })

      // Delete first task
      const deleteButtons = screen.getAllByRole('button', { name: /delete task/i })
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText(/delete task/i)).toBeInTheDocument()
      })

      server.use(
        http.delete('/api/tasks/12', () => {
          return new HttpResponse(null, { status: 204 })
        }),
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 13,
                title: 'Task Two',
                done: false,
                archived: false,
                category: '',
                priority: false,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      const confirmButton = screen.getByRole('button', { name: /delete$/i })
      await user.click(confirmButton)

      // Verify count decreased
      await waitFor(() => {
        expect(screen.getByText(/1 of 1 tasks/i)).toBeInTheDocument()
      })
    })
  })

  describe('List and Filter Tasks', () => {
    it('loads initial task list with pagination', async () => {
      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 20,
                title: 'Task Alpha',
                done: false,
                archived: false,
                category: 'Work',
                priority: false,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }, {
                id: 21,
                title: 'Task Beta',
                done: true,
                archived: false,
                category: 'Personal',
                priority: true,
                order: 1,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 2, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      // Verify tasks displayed
      await waitFor(() => {
        expect(screen.getByText('Task Alpha')).toBeInTheDocument()
        expect(screen.getByText('Task Beta')).toBeInTheDocument()
      })

      // Verify count
      expect(screen.getByText(/2 of 2 tasks/i)).toBeInTheDocument()
    })

    it('filters tasks by status', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 22,
                title: 'Pending Task',
                done: false,
                archived: false,
                category: '',
                priority: false,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }, {
                id: 23,
                title: 'Completed Task',
                done: true,
                archived: false,
                category: '',
                priority: false,
                order: 1,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 2, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      // Wait for both tasks
      await waitFor(() => {
        expect(screen.getByText('Pending Task')).toBeInTheDocument()
        expect(screen.getByText('Completed Task')).toBeInTheDocument()
      })

      // Filter by completed
      const statusFilter = screen.getByLabelText(/filter by status/i)
      await user.selectOptions(statusFilter, 'completed')

      // Verify only completed task shown (client-side filtering)
      await waitFor(() => {
        expect(screen.queryByText('Pending Task')).not.toBeInTheDocument()
        expect(screen.getByText('Completed Task')).toBeInTheDocument()
      })

      // Verify count updated
      expect(screen.getByText(/1 of 2 tasks/i)).toBeInTheDocument()

      // Filter by pending
      await user.selectOptions(statusFilter, 'pending')

      await waitFor(() => {
        expect(screen.getByText('Pending Task')).toBeInTheDocument()
        expect(screen.queryByText('Completed Task')).not.toBeInTheDocument()
      })
    })

    it('filters tasks by category', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 24,
                title: 'Work Task',
                done: false,
                archived: false,
                category: 'Work',
                priority: false,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }, {
                id: 25,
                title: 'Personal Task',
                done: false,
                archived: false,
                category: 'Personal',
                priority: false,
                order: 1,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }],
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

      // Filter by Work category
      const categoryFilter = screen.getByLabelText(/filter by category/i)
      await user.selectOptions(categoryFilter, 'Work')

      await waitFor(() => {
        expect(screen.getByText('Work Task')).toBeInTheDocument()
        expect(screen.queryByText('Personal Task')).not.toBeInTheDocument()
      })

      // Verify count
      expect(screen.getByText(/1 of 2 tasks/i)).toBeInTheDocument()
    })

    it('searches tasks by title', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 26,
                title: 'Buy groceries',
                description: 'Milk and eggs',
                done: false,
                archived: false,
                category: '',
                priority: false,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }, {
                id: 27,
                title: 'Write report',
                description: 'Quarterly report',
                done: false,
                archived: false,
                category: '',
                priority: false,
                order: 1,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 2, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText('Buy groceries')).toBeInTheDocument()
        expect(screen.getByText('Write report')).toBeInTheDocument()
      })

      // Search for "groceries"
      const searchInput = screen.getByLabelText(/search tasks/i)
      await user.type(searchInput, 'groceries')

      await waitFor(() => {
        expect(screen.getByText('Buy groceries')).toBeInTheDocument()
        expect(screen.queryByText('Write report')).not.toBeInTheDocument()
      })

      // Clear and search for "report"
      await user.clear(searchInput)
      await user.type(searchInput, 'report')

      await waitFor(() => {
        expect(screen.queryByText('Buy groceries')).not.toBeInTheDocument()
        expect(screen.getByText('Write report')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('shows empty state when no tasks', async () => {
      server.use(
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

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument()
        expect(screen.getByText(/create your first task to get started/i)).toBeInTheDocument()
      })
    })

    it('shows loading skeleton while fetching tasks', async () => {
      // Delay the response
      server.use(
        http.get('/api/tasks/', async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [],
              pagination: { total: 0, page: 1, per_page: 50, total_pages: 0 }
            }
          })
        })
      )

      render(<TaskList />)

      // Should show loading skeleton (check for animate-pulse class)
      const loadingSkeleton = document.querySelector('.animate-pulse')
      expect(loadingSkeleton).toBeTruthy()

      // Wait for tasks to load
      await waitFor(() => {
        expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('handles create task error', async () => {
      const user = userEvent.setup()

      server.use(
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

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText(/new task/i)).toBeInTheDocument()
      })

      const newTaskButton = screen.getByRole('button', { name: /new task/i })
      await user.click(newTaskButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Failed Task')

      // Mock API error
      server.use(
        http.post('/api/tasks/', () => {
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

      const submitButton = screen.getByRole('button', { name: /create task/i })
      await user.click(submitButton)

      // Should show error message in form
      await waitFor(() => {
        expect(screen.getByText(/internal server error|an error occurred/i)).toBeInTheDocument()
      })

      // Modal should still be open
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('handles update task error', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 30,
                title: 'Task to Fail Update',
                done: false,
                archived: false,
                category: '',
                priority: false,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText('Task to Fail Update')).toBeInTheDocument()
      })

      const editButton = screen.getByRole('button', { name: /edit task: task to fail update/i })
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      const titleInput = screen.getByLabelText(/title/i)
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Title')

      // Mock API error
      server.use(
        http.put('/api/tasks/30', () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                code: 500,
                message: 'Failed to update task'
              }
            },
            { status: 500 }
          )
        })
      )

      const updateButton = screen.getByRole('button', { name: /update task/i })
      await user.click(updateButton)

      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/failed to update task|an error occurred/i)).toBeInTheDocument()
      })

      // Modal should still be open
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('shows filtered empty state', async () => {
      const user = userEvent.setup()

      server.use(
        http.get('/api/tasks/', () => {
          return HttpResponse.json({
            success: true,
            data: {
              tasks: [{
                id: 31,
                title: 'Only Task',
                done: false,
                archived: false,
                category: '',
                priority: false,
                order: 0,
                status: { id: 1, name: 'To Do' },
                created_at: new Date().toISOString(),
                created_by: 1
              }],
              pagination: { total: 1, page: 1, per_page: 50, total_pages: 1 }
            }
          })
        })
      )

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText('Only Task')).toBeInTheDocument()
      })

      // Filter by completed (no completed tasks)
      const statusFilter = screen.getByLabelText(/filter by status/i)
      await user.selectOptions(statusFilter, 'completed')

      // Should show filtered empty state
      await waitFor(() => {
        expect(screen.getByText(/no tasks match your filters/i)).toBeInTheDocument()
        expect(screen.getByText(/try adjusting your search or filter criteria/i)).toBeInTheDocument()
      })
    })
  })
})
