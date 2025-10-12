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
  // Part 1: Introduction & List View CRUD
  {
    id: 'welcome',
    title: 'Welcome to Your Workspace!',
    description: 'This tutorial will guide you through creating, managing, and viewing your tasks. We\'ll start in the List view. Click "Next" to begin!',
    position: 'center',
    requiredRoute: '/app/list',
    autoNavigate: true,
  },
  {
    id: 'list-view-nav',
    title: 'Welcome to the List View',
    description: 'This is your Task List - the central hub for managing tasks in a simple, linear format. All your tasks appear here.',
    targetSelector: '[data-tutorial="nav-link-list"]',
    position: 'bottom',
    requiredRoute: '/app/list',
  },
  {
    id: 'create-task-start',
    title: 'Create Your First Task',
    description: 'Now, click the "New Task" button to create a task. The tutorial will wait for you to do this.',
    targetSelector: '[data-tutorial="add-task-button"]',
    position: 'bottom',
    requiredRoute: '/app/list',
  },
  {
    id: 'create-task-form',
    title: 'Fill in the Task Details',
    description: 'Give your task a title like "My first task" or "Draft project proposal". The other fields are optional. Click "Save Task" when ready.',
    targetSelector: '[data-tutorial="task-title-input"]',
    position: 'bottom',
    requiredRoute: '/app/list',
  },
  {
    id: 'read-task-item',
    title: 'Your Task Appears Here',
    description: 'Great! Your task now appears in the list. You can see its title, due date, and other details at a glance.',
    targetSelector: '[data-tutorial="task-item"]',
    position: 'right',
    requiredRoute: '/app/list',
  },
  {
    id: 'update-task-item',
    title: 'Edit a Task',
    description: 'Click the three dots menu to see options. From here you can edit the task to make changes anytime.',
    targetSelector: '[data-tutorial="task-item-menu-button"]',
    position: 'left',
    requiredRoute: '/app/list',
  },
  {
    id: 'delete-task-item',
    title: 'Delete a Task',
    description: 'You can also use the three dots menu to delete a task. Don\'t worry, you\'ll always be asked to confirm before deleting.',
    targetSelector: '[data-tutorial="task-item-menu-button"]',
    position: 'left',
    requiredRoute: '/app/list',
  },

  // Part 2: Kanban Board View
  {
    id: 'board-view-nav',
    title: 'Switch to Board View',
    description: 'Now let\'s see your tasks on a Kanban board. Click "Next" and we\'ll navigate there.',
    targetSelector: '[data-tutorial="nav-link-board"]',
    position: 'bottom',
    requiredRoute: '/app/board',
    autoNavigate: true,
  },
  {
    id: 'board-view-intro',
    title: 'The Kanban Board',
    description: 'The board organizes tasks by status: To Do, In Progress, and Done. This is perfect for tracking workflow progress.',
    targetSelector: '[data-tutorial="board-column-todo"]',
    position: 'top',
    requiredRoute: '/app/board',
  },
  {
    id: 'board-view-drag',
    title: 'Drag & Drop to Update Status',
    description: 'You can drag task cards between columns to update their status. Try dragging a task from "To Do" to "In Progress"!',
    targetSelector: '[data-tutorial="board-card"]',
    position: 'top',
    requiredRoute: '/app/board',
  },

  // Part 3: Calendar View
  {
    id: 'calendar-view-nav',
    title: 'Switch to Calendar View',
    description: 'Finally, let\'s see how your tasks look on a calendar. This view is ideal for managing deadlines. Click "Next" to navigate there.',
    targetSelector: '[data-tutorial="nav-link-calendar"]',
    position: 'bottom',
    requiredRoute: '/app/calendar',
    autoNavigate: true,
  },
  {
    id: 'calendar-view-intro',
    title: 'The Calendar View',
    description: 'Tasks with due dates are automatically shown here. You can click on any date to create a new task or see existing ones.',
    targetSelector: '[data-tutorial="calendar-grid"]',
    position: 'top',
    requiredRoute: '/app/calendar',
  },
  {
    id: 'calendar-view-event',
    title: 'Calendar Events',
    description: 'Each task appears as an event on its due date. You can click on tasks to view or edit them.',
    targetSelector: '[data-tutorial="calendar-event"]',
    position: 'bottom',
    requiredRoute: '/app/calendar',
  },
  {
    id: 'complete',
    title: 'You\'re a Pro! 🎉',
    description: 'You\'ve mastered the core features. Now you\'re ready to organize your work across all views.',
    position: 'center',
  },
]
