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

  // Example handler for tasks API
  http.get('/api/tasks', () => {
    return HttpResponse.json([
      { id: 1, title: 'Sample Task', completed: false },
    ])
  }),

  // Add more handlers as needed
]