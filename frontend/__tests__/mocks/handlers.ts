import { http, HttpResponse } from 'msw'

// Define handlers for API endpoints
export const handlers = [
  // Auth API handlers
  http.post('/api/auth/setup', () => {
    return HttpResponse.json({
      success: true,
      message: 'Setup successful',
      user_id: 1,
      username: 'testuser'
    })
  }),

  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      success: true,
      message: 'Login successful',
      user_id: 1,
      username: 'testuser'
    })
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({
      success: true,
      message: 'Logout successful'
    })
  }),

  http.put('/api/auth/pin', () => {
    return HttpResponse.json({
      success: true,
      message: 'PIN changed successfully'
    })
  }),

  // Settings API handlers
  http.get('/api/settings', () => {
    return HttpResponse.json({
      success: true,
      data: {
        notes_enabled: true,
        timer_enabled: true,
        ai_api_url: '',
        ai_model: '',
        ai_api_key: '',
        auto_lock_minutes: 10,
        theme: 'light',
        updated_on: new Date().toISOString()
      }
    })
  }),

  http.put('/api/settings', async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      success: true,
      data: {
        notes_enabled: body.notes_enabled ?? true,
        timer_enabled: body.timer_enabled ?? true,
        ai_api_url: body.ai_api_url ?? '',
        ai_model: body.ai_model ?? '',
        ai_api_key: body.ai_api_key ?? '',
        auto_lock_minutes: body.auto_lock_minutes ?? 10,
        theme: body.theme ?? 'light',
        updated_on: new Date().toISOString()
      }
    })
  }),

  // Task management handlers
  // GET /api/tasks/ - List tasks with pagination
  http.get('/api/tasks/', () => {
    return HttpResponse.json({
      success: true,
      data: {
        tasks: [
          {
            id: 1,
            title: 'Test Task 1',
            description: 'Test description',
            done: false,
            archived: false,
            priority: 'medium',
            estimate_minutes: 60,
            due_date: '2025-10-30',
            status: { id: 1, name: 'To Do' },
            category: null,
            created_on: new Date().toISOString(),
            updated_on: new Date().toISOString()
          }
        ],
        pagination: {
          total: 1,
          page: 1,
          per_page: 50,
          total_pages: 1
        }
      }
    })
  }),

  // GET /api/tasks/:id - Get single task
  http.get('/api/tasks/:id', ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      success: true,
      data: {
        id: Number(id),
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
        updated_on: new Date().toISOString()
      }
    })
  }),

  // POST /api/tasks/ - Create task
  http.post('/api/tasks/', async () => {
    return HttpResponse.json({
      success: true,
      data: {
        task_id: 999,
        message: 'Task created successfully'
      }
    })
  }),

  // PUT /api/tasks/:id - Update task (including archive)
  http.put('/api/tasks/:id', async ({ request, params }) => {
    const body = await request.json() as any
    const { id } = params
    return HttpResponse.json({
      success: true,
      data: {
        id: Number(id),
        title: body.title ?? 'Test Task',
        description: body.description ?? 'Test description',
        done: body.done ?? false,
        archived: body.archived ?? false,
        priority: body.priority ?? 'medium',
        estimate_minutes: body.estimate_minutes ?? 60,
        due_date: body.due_date ?? '2025-10-30',
        status: { id: 1, name: 'To Do' },
        category: null,
        created_on: new Date().toISOString(),
        updated_on: new Date().toISOString()
      }
    })
  }),

  // DELETE /api/tasks/:id - Delete task
  http.delete('/api/tasks/:id', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /api/tasks/archived - Get archived tasks
  http.get('/api/tasks/archived', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 100,
          title: 'Archived Task',
          description: 'This is archived',
          done: true,
          archived: true,
          priority: 'low',
          estimate_minutes: 30,
          due_date: '2025-10-20',
          status: { id: 4, name: 'Done' },
          category: null,
          created_on: new Date().toISOString(),
          updated_on: new Date().toISOString()
        }
      ]
    })
  }),

  // POST /api/tasks/archive-completed - Archive all completed tasks
  http.post('/api/tasks/archive-completed', () => {
    return HttpResponse.json({
      success: true,
      data: {
        message: 'Archived 5 completed tasks',
        archived_count: 5
      }
    })
  }),

  // GET /api/categories - Get categories
  http.get('/api/categories', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 1, name: 'Work', color: '#3b82f6' },
        { id: 2, name: 'Personal', color: '#10b981' }
      ]
    })
  }),

  // GET /api/categories/usage - Get category usage statistics
  http.get('/api/categories/usage', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { category_id: 1, category_name: 'Work', task_count: 5 },
        { category_id: 2, category_name: 'Personal', task_count: 3 }
      ]
    })
  }),

  // POST /api/categories - Create category
  http.post('/api/categories', async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      success: true,
      data: {
        id: 999,
        name: body.name,
        color_hex: body.color_hex,
        description: body.description || null,
        created_on: new Date().toISOString(),
        updated_on: new Date().toISOString()
      }
    })
  }),

  // PUT /api/categories/:id - Update category
  http.put('/api/categories/:id', async ({ request, params }) => {
    const body = await request.json() as any
    const { id } = params
    return HttpResponse.json({
      success: true,
      data: {
        id: Number(id),
        name: body.name,
        color_hex: body.color_hex,
        description: body.description || null,
        created_on: new Date().toISOString(),
        updated_on: new Date().toISOString()
      }
    })
  }),

  // DELETE /api/categories/:id - Delete category
  http.delete('/api/categories/:id', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /api/tasks/categories - Get task categories (string array)
  http.get('/api/tasks/categories', () => {
    return HttpResponse.json({
      success: true,
      data: ['Work', 'Personal', 'Shopping', 'Health']
    })
  }),
]