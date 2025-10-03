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
      notes_enabled: true,
      timer_enabled: true,
      ai_url: null,
      auto_lock_minutes: 10,
      theme: 'light',
      updated_on: new Date().toISOString()
    })
  }),

  http.put('/api/settings', () => {
    return HttpResponse.json({
      notes_enabled: true,
      timer_enabled: true,
      ai_url: null,
      auto_lock_minutes: 10,
      theme: 'light',
      updated_on: new Date().toISOString()
    })
  }),
]