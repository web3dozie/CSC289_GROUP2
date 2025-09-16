import { http, HttpResponse } from 'msw'

// Define handlers for API endpoints
export const handlers = [
  // Example handler for tasks API
  http.get('/api/tasks', () => {
    return HttpResponse.json([
      { id: 1, title: 'Sample Task', completed: false },
    ])
  }),

  // Add more handlers as needed
]