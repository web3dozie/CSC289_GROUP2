// Tutorial step configuration for the interactive tutorial system

export interface TutorialStep {
  id: string
  title: string
  description: string
  targetSelector?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  requiredRoute?: string // Route that must be active for this step
  autoNavigate?: boolean // Should we automatically navigate to requiredRoute?
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  // Part 1: Introduction & Overview
  {
    id: 'welcome',
    title: 'Welcome to Your Workspace! ',
    description: 'This quick tour will show you the key features of your task management system. We\'ll explore three different views for organizing your work. Click "Next" to begin!',
    position: 'center',
    requiredRoute: '/app/list',
    autoNavigate: true,
  },

  // Part 2: List View
  {
    id: 'list-view-intro',
    title: 'List View',
    description: 'This is your Task List - a simple, linear view of all your tasks. Perfect for quick overviews and daily planning.',
    targetSelector: '[data-tutorial="nav-link-list"]',
    position: 'bottom',
    requiredRoute: '/app/list',
  },
  {
    id: 'list-create-button',
    title: 'Creating Tasks',
    description: 'Click the "New Task" button here to create a new task. You can add a title, description, due date, priority, and more.',
    targetSelector: '[data-tutorial="add-task-button"]',
    position: 'bottom',
    requiredRoute: '/app/list',
  },
  {
    id: 'list-task-details',
    title: 'Task Details',
    description: 'Each task shows its title, description, due date, category, priority status, and time estimate. Tasks with due dates appear in all three views.',
    targetSelector: '[data-tutorial="task-item"]',
    position: 'right',
    requiredRoute: '/app/list',
  },
  {
    id: 'list-task-actions',
    title: 'Managing Tasks',
    description: 'Use the edit and delete buttons on each task to manage them. You can also check the box to quickly mark tasks as complete.',
    targetSelector: '[data-tutorial="task-item-edit-button"]',
    position: 'bottom',
    requiredRoute: '/app/list',
  },

  // Part 3: Kanban Board View
  {
    id: 'board-view-nav',
    title: 'Kanban Board View',
    description: 'Let\'s switch to the Board view to see a different perspective. This view is great for visualizing workflow.',
    targetSelector: '[data-tutorial="nav-link-board"]',
    position: 'bottom',
    requiredRoute: '/app/board',
    autoNavigate: true,
  },
  {
    id: 'board-view-columns',
    title: 'Status Columns',
    description: 'The board organizes tasks into three columns: To Do, In Progress, and Done. This helps you track where each task is in your workflow.',
    targetSelector: '[data-tutorial="board-column-todo"]',
    position: 'top',
    requiredRoute: '/app/board',
  },
  {
    id: 'board-view-cards',
    title: 'Task Cards',
    description: 'Each task appears as a card showing its key information. You can drag cards between columns to update their status, or use the move buttons at the bottom of each card.',
    targetSelector: '[data-tutorial="board-card"]',
    position: 'top',
    requiredRoute: '/app/board',
  },

  // Part 4: Calendar View
  {
    id: 'calendar-view-nav',
    title: 'Calendar View',
    description: 'Now let\'s check out the Calendar view - perfect for managing deadlines and planning ahead.',
    targetSelector: '[data-tutorial="nav-link-calendar"]',
    position: 'bottom',
    requiredRoute: '/app/calendar',
    autoNavigate: true,
  },
  {
    id: 'calendar-view-layout',
    title: 'Monthly Overview',
    description: 'The calendar shows all your tasks with due dates organized by month. This makes it easy to see what\'s coming up and plan accordingly.',
    targetSelector: '[data-tutorial="calendar-grid"]',
    position: 'top',
    requiredRoute: '/app/calendar',
  },
  {
    id: 'calendar-view-events',
    title: 'Task Events',
    description: 'Tasks appear as events on their due dates. Click on any task to view details or make changes. Click on empty dates to create new tasks.',
    targetSelector: '[data-tutorial="calendar-event"]',
    position: 'bottom',
    requiredRoute: '/app/calendar',
  },

  // Part 5: Completion
  {
    id: 'complete',
    title: 'You\'re All Set! ',
    description: 'You now know how to use all three views: List for quick access, Board for workflow tracking, and Calendar for deadline management. Start creating tasks and stay organized!',
    position: 'center',
  },
]
