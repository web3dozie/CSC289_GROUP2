# Task Line Frontend

<div align="center">

![Task Line](https://img.shields.io/badge/Task%20Line-Frontend-blue?style=for-the-badge&logo=react)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.1.5-646CFF?style=flat-square&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.1-38B2AC?style=flat-square&logo=tailwind-css)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)](#)

[![Code Style](https://img.shields.io/badge/code%20style-ESLint%20%2B%20Prettier-ff69b4?style=flat-square)](#)

A modern, responsive task management application built with React 18, TypeScript, and Vite. Features multiple task views, Pomodoro timer, AI-powered insights, and comprehensive data management capabilities.

[Live Demo](#) • [Documentation](#) • [Contributing](#contributing) • [Troubleshooting](#troubleshooting)

</div>

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Component Library](#component-library)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Styling & Theming](#styling--theming)
- [Testing Strategy](#testing-strategy)
- [Build & Deployment](#build--deployment)
- [Performance Optimization](#performance-optimization)
- [Accessibility](#accessibility)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## Overview

Task Line is a comprehensive task management application designed to boost productivity through multiple task views, Pomodoro timer integration, and AI-powered insights. The frontend is built with modern web technologies focusing on performance, accessibility, and developer experience.

### Key Features

- **Multiple Task Views**: List, Board (Kanban), Calendar, and Review views
- **Pomodoro Timer**: Built-in focus timer with task integration
- **Theme Support**: Light/Dark/Auto theme support with system preference detection
- **Security**: PIN-based authentication with auto-lock functionality
- **AI Integration**: OpenAI-compatible API integration for task insights
- **Analytics**: Task completion tracking and productivity insights
- **Accessibility**: WCAG 2.1 compliant with keyboard navigation and screen reader support
- **PWA Ready**: Service worker support and offline capabilities

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | Core UI library with concurrent features |
| **TypeScript** | 5.2.2 | Type safety and developer experience |
| **Vite** | 7.1.5 | Build tool and development server |
| **TanStack Router** | 1.20.0 | Type-safe routing with code splitting |
| **TanStack Query** | 5.17.0 | Server state management and caching |

### Styling & UI

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 3.4.1 | Utility-first CSS framework |
| **Lucide React** | 0.344.0 | Icon library |
| **React Markdown** | 10.1.0 | Markdown rendering |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vitest** | 3.2.4 | Unit testing framework |
| **Testing Library** | 14.2.1 | Component testing utilities |
| **MSW** | 2.2.3 | API mocking for tests |
| **ESLint** | 8.57.0 | Code linting |
| **Prettier** | 3.2.5 | Code formatting |
| **Husky** | 9.0.11 | Git hooks |

## Architecture

### Design Patterns

- **Component-Based Architecture**: Modular, reusable components
- **Context Pattern**: Global state management (Auth, Theme, Tutorial)
- **Custom Hooks**: Reusable stateful logic
- **Provider Pattern**: Context providers for dependency injection
- **Error Boundaries**: Graceful error handling
- **Lazy Loading**: Route-based code splitting

### State Management Layers

```
┌─────────────────────────────────────┐
│           UI Components             │
├─────────────────────────────────────┤
│        Custom Hooks                 │
├─────────────────────────────────────┤
│        React Contexts               │
├─────────────────────────────────────┤
│      TanStack Query Cache           │
├─────────────────────────────────────┤
│           API Layer                 │
└─────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 (or pnpm/yarn equivalent)
- **Backend API**: Running on `http://localhost:5001`

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd taskline-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## Development Setup

### Environment Configuration

Create a `.env` file in the frontend directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5001

# Development settings
VITE_DEV_TOOLS=true
VITE_LOG_LEVEL=debug
```

### IDE Configuration

Recommended VS Code extensions:
- **ES7+ React/Redux/React-Native snippets**
- **TypeScript Importer**
- **Tailwind CSS IntelliSense**
- **ESLint**
- **Prettier - Code formatter**

### Git Hooks

The project uses Husky for Git hooks:
- **Pre-commit**: Runs linting and type checking
- **Pre-push**: Runs tests before pushing

## Available Scripts

### Development

```bash
# Start development server with hot reload
npm run dev

# Type checking without emitting files
npm run type-check

# Start development server with proxy to backend
npm run dev:proxy
```

### Building

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Build with analysis
npm run build:analyze
```

### Testing

```bash
# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Run specific test file
npm run test -- Login.test.tsx
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check
```

## Project Structure

```
frontend/
├── public/                          # Static assets
│   └── taskline-icon.svg           # Application icon
├── src/
│   ├── components/                 # Reusable UI components
│   │   ├── landing/               # Marketing page components
│   │   │   ├── Header.tsx         # Navigation header
│   │   │   ├── Hero.tsx           # Hero section
│   │   │   ├── Features.tsx       # Features showcase
│   │   │   ├── Login.tsx          # Login form
│   │   │   ├── SignUp.tsx         # Registration form
│   │   │   └── ...                # Other landing components
│   │   ├── views/                 # Main app views
│   │   │   ├── Dashboard.tsx      # Main dashboard
│   │   │   ├── TaskList.tsx       # List view
│   │   │   ├── TaskBoard.tsx      # Kanban board
│   │   │   ├── TaskCalendar.tsx   # Calendar view
│   │   │   ├── TaskReview.tsx     # Review and insights
│   │   │   ├── Settings.tsx       # User settings
│   │   │   └── PomodoroTimer.tsx  # Timer component
│   │   ├── tasks/                 # Task-specific components
│   │   │   ├── TaskItem.tsx       # Individual task component
│   │   │   ├── TaskForm.tsx       # Task creation/editing
│   │   │   ├── TaskModal.tsx      # Task details modal
│   │   │   └── ...                # Other task components
│   │   ├── timer/                 # Timer components
│   │   │   ├── TimerDisplay.tsx   # Timer visualization
│   │   │   ├── TimerControls.tsx  # Timer controls
│   │   │   └── TaskSelector.tsx   # Task selection for timer
│   │   ├── AppLayout.tsx          # Main app layout
│   │   ├── AuthGuard.tsx          # Authentication wrapper
│   │   ├── ErrorBoundary.tsx      # Error handling boundary
│   │   ├── TutorialOverlay.tsx    # Tutorial overlay
│   │   └── ChatWidget.tsx         # AI chat integration
│   ├── contexts/                   # React Context providers
│   │   ├── AuthContext.tsx        # Authentication state
│   │   ├── ThemeContext.tsx       # Theme management
│   │   └── TutorialContext.tsx    # Tutorial state
│   ├── lib/                       # Utility libraries
│   │   ├── api.ts                 # API client and types
│   │   ├── hooks.ts               # Custom React hooks
│   │   ├── queryClient.ts         # TanStack Query config
│   │   └── hooks/                 # Specific hook implementations
│   │       └── timer.ts           # Timer-related hooks
│   ├── routes/                    # Route configuration
│   │   └── __root.tsx             # Router setup
│   ├── services/                  # Business logic services
│   │   └── chatService.ts         # AI chat service
│   ├── types/                     # TypeScript type definitions
│   │   └── chat.ts                # Chat-related types
│   ├── config/                    # Configuration files
│   │   └── tutorialSteps.ts       # Tutorial configuration
│   ├── index.css                  # Global styles
│   ├── main.tsx                   # Application entry point
│   └── vite-env.d.ts             # Vite type definitions
├── __tests__/                     # Test files
│   ├── setup.ts                   # Test setup configuration
│   ├── test-utils.tsx             # Testing utilities
│   ├── unit/                      # Unit tests
│   ├── integration/               # Integration tests
│   └── mocks/                     # API mocking
├── .eslintrc.cjs                  # ESLint configuration
├── .husky/                        # Git hooks
├── index.html                     # HTML entry point
├── package.json                   # Dependencies and scripts
├── postcss.config.js              # PostCSS configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
├── tsconfig.node.json             # Node.js TypeScript config
└── vite.config.ts                 # Vite configuration
```

## Component Library

### Landing Components

Located in `src/components/landing/`:

```tsx
// Example: Header component usage
import { Header } from '@/components/landing/Header'

function App() {
  return <Header />
}
```

**Available Components:**
- `Header.tsx` - Navigation with authentication links
- `Hero.tsx` - Main landing hero section
- `Features.tsx` - Feature highlights grid
- `Views.tsx` - Task view demonstrations
- `Login.tsx` - PIN-based authentication form
- `SignUp.tsx` - User registration form
- `FAQ.tsx` - Frequently asked questions
- `CTA.tsx` - Call-to-action sections
- `Footer.tsx` - Site footer with links

### App View Components

Located in `src/components/views/`:

```tsx
// Example: Dashboard usage
import { Dashboard } from '@/components/views/Dashboard'

function App() {
  return <Dashboard />
}
```

**Available Views:**
- `Dashboard.tsx` - Main overview with statistics
- `TaskList.tsx` - List view with filtering and sorting
- `TaskBoard.tsx` - Kanban board with drag-and-drop
- `TaskCalendar.tsx` - Calendar view with due dates
- `TaskReview.tsx` - Weekly review and insights
- `Settings.tsx` - User preferences and configuration
- `PomodoroTimer.tsx` - Focus timer with break cycles

### Reusable UI Components

```tsx
// Example: Task item component
import { TaskItem } from '@/components/tasks/TaskItem'

<TaskItem
  task={task}
  onUpdate={handleUpdate}
  onDelete={handleDelete}
/>
```

## State Management

### Context Providers

#### Authentication Context (AuthContext)

```tsx
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()
  
  return (
    <div>
      {isAuthenticated ? (
        <span>Welcome, {user?.username}!</span>
      ) : (
        <button onClick={login}>Login</button>
      )}
    </div>
  )
}
```

**Features:**
- PIN-based authentication
- Session persistence
- Auto-lock functionality
- Activity monitoring
- Error handling

#### Theme Context (ThemeContext)

```tsx
import { useTheme } from '@/contexts/ThemeContext'

function MyComponent() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme('dark')}>
      Switch to Dark Mode
    </button>
  )
}
```

**Features:**
- Light/Dark/Auto theme support
- System preference detection
- Immediate theme application
- localStorage persistence

#### Tutorial Context (TutorialContext)

```tsx
import { useTutorial } from '@/contexts/TutorialContext'

function MyComponent() {
  const { isActive, startTutorial, completeStep } = useTutorial()
  
  return (
    <button onClick={startTutorial}>
      Start Tutorial
    </button>
  )
}
```

### Custom Hooks

#### API Hooks (TanStack Query)

```tsx
import { useTasks, useCreateTask, useUpdateTask } from '@/lib/hooks'

function TaskList() {
  const { data: tasks, isLoading } = useTasks()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  
  // Use the hooks...
}
```

#### Timer Hook

```tsx
import { useTimer } from '@/lib/hooks/timer'

function TimerComponent() {
  const {
    time,
    isRunning,
    start,
    pause,
    reset,
    mode,
    setMode
  } = useTimer()
  
  return (
    <div>
      <span>{formatTime(time)}</span>
      <button onClick={isRunning ? pause : start}>
        {isRunning ? 'Pause' : 'Start'}
      </button>
    </div>
  )
}
```

## API Integration

### API Client Structure

The application uses a centralized API client located in `src/lib/api.ts`:

```typescript
// Example API usage
import { tasksApi, settingsApi, ApiError } from '@/lib/api'

// Get all tasks
const tasks = await tasksApi.getAll({ status: 'active' })

// Create a new task
const result = await tasksApi.create({
  title: 'Complete documentation',
  description: 'Write comprehensive README',
  priority: true,
  due_date: '2025-12-31'
})

// Handle API errors
try {
  await someApiCall()
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.code}: ${error.getUserMessage()}`)
  }
}
```

### Available API Modules

#### Auth API (`authApi`)
- `setup(data)` - Initialize user account
- `login(data)` - Authenticate user
- `logout()` - End user session
- `changePin(data)` - Update PIN

#### Tasks API (`tasksApi`)
- `getAll(params?)` - Retrieve tasks with filtering
- `getById(id)` - Get specific task
- `create(data)` - Create new task
- `update(id, data)` - Update existing task
- `delete(id)` - Remove task
- `getKanban()` - Get Kanban board data
- `getCalendar()` - Get calendar view data
- `getCategories()` - Get task categories

#### Settings API (`settingsApi`)
- `getSettings()` - Retrieve user settings
- `updateSettings(data)` - Update settings
- `updateTheme(theme)` - Change theme
- `updateAutoLock(minutes)` - Set auto-lock timeout

#### Review API (`reviewApi`)
- `getJournal()` - Get journal entries
- `createJournalEntry(data)` - Create journal entry
- `getDailySummary()` - Get daily productivity summary
- `getWeeklySummary()` - Get weekly analytics
- `getInsights()` - Get AI-powered insights

### Error Handling

The API client provides comprehensive error handling:

```typescript
try {
  const result = await tasksApi.create(taskData)
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 401:
        // Handle authentication error
        break
      case 409:
        // Handle conflict error
        break
      case 500:
        // Handle server error
        break
    }
  }
}
```

## Styling & Theming

### Tailwind CSS Configuration

The project uses Tailwind CSS with custom configuration:

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom theme extensions
    },
  },
  plugins: [],
}
```

### Theme Classes

The application applies theme classes to the root element:

```html
<!-- Light theme -->
<html class="light">

<!-- Dark theme -->
<html class="dark">

<!-- Auto theme (system preference) -->
<html class="auto">
```

### Custom CSS Classes

Global styles in `src/index.css`:

```css
/* Dark mode styles */
.dark {
  color-scheme: dark;
}

/* Focus styles for accessibility */
.focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Responsive Design

The application follows a mobile-first approach:

```tsx
// Example responsive component
function ResponsiveComponent() {
  return (
    <div className="
      p-4 
      sm:p-6 
      md:p-8 
      lg:p-12
      grid 
      grid-cols-1 
      sm:grid-cols-2 
      lg:grid-cols-3
      gap-4
    ">
      {/* Content */}
    </div>
  )
}
```

## Testing Strategy

### Testing Stack

- **Vitest**: Fast unit testing framework
- **Testing Library**: Component testing utilities
- **MSW**: API mocking for reliable tests
- **jsdom**: Browser environment simulation

### Test Structure

```
__tests__/
├── setup.ts                     # Test configuration
├── test-utils.tsx              # Testing utilities
├── unit/                       # Unit tests
│   ├── Header.test.tsx
│   ├── Hero.test.tsx
│   └── Login.test.tsx
├── integration/               # Integration tests
│   ├── TaskList.integration.test.tsx
│   ├── Settings.integration.test.tsx
│   └── Archives.integration.test.tsx
└── mocks/                     # API mocking
    ├── server.ts
    └── handlers.ts
```

### Writing Tests

#### Unit Test Example

```tsx
// __tests__/unit/Login.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Login } from '@/components/landing/Login'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

describe('Login Component', () => {
  it('should render login form', () => {
    render(<Login />)
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/pin/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('should handle form submission', async () => {
    const mockLogin = vi.fn()
    
    render(<Login onLogin={mockLogin} />)
    
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' }
    })
    
    fireEvent.change(screen.getByLabelText(/pin/i), {
      target: { value: '1234' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }))
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'testuser',
        pin: '1234'
      })
    })
  })
})
```

#### Integration Test Example

```tsx
// __tests__/integration/TaskList.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TaskList } from '@/components/views/TaskList'

describe('TaskList Integration', () => {
  it('should display tasks from API', async () => {
    render(<TaskList />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Sample Task')).toBeInTheDocument()
    })
  })
})
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run specific test file
npm run test -- TaskList.test.tsx

# Run tests in CI mode
npm run test:run

# Run tests with coverage
npm run test -- --coverage
```

### Mock Service Worker (MSW)

API mocking is configured in `__tests__/mocks/handlers.ts`:

```typescript
// __tests__/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock tasks API
  http.get('/api/tasks', () => {
    return HttpResponse.json([
      {
        id: 1,
        title: 'Sample Task',
        done: false,
        priority: false,
        created_at: '2025-11-05T22:25:22.350Z'
      }
    ])
  }),

  // Mock login API
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: { id: 1, username: 'testuser' },
        message: 'Login successful'
      }
    })
  })
]
```

## Build & Deployment

### Vite Configuration

The build system is configured in `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['@tanstack/react-router', '@tanstack/react-query'],
          'ui-vendor': ['lucide-react', 'react-markdown'],
        },
      },
    },
  },
})
```

### Production Build

```bash
# Create production build
npm run build

# Preview production build
npm run preview

# Build with bundle analysis
npm run build:analyze
```

### Build Output

The build generates optimized files in the `dist/` directory:

```
dist/
├── assets/
│   ├── index-[hash].js        # Main application bundle
│   ├── index-[hash].css       # Stylesheet
│   └── [vendor]-[hash].js     # Vendor chunks
├── index.html                 # Entry HTML
└── vite.svg                  # Favicon
```

### Deployment Options

#### Static Hosting (Netlify, Vercel, GitHub Pages)

```bash
# Build for static hosting
npm run build

# Upload dist/ folder to hosting service
```

#### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Environment Variables

```env
# Production environment variables
VITE_API_URL=https://api.taskline.com
VITE_ENVIRONMENT=production
VITE_LOG_LEVEL=error
```

## Performance Optimization

### Code Splitting

The application implements multiple levels of code splitting:

#### Route-based Splitting

```typescript
// Routes are lazy-loaded for better performance
const Dashboard = lazy(() => import('../components/views/Dashboard'))
const TaskList = lazy(() => import('../components/views/TaskList'))
```

#### Vendor Splitting

```typescript
// Separate chunks for better caching
manualChunks: {
  'react-vendor': ['react', 'react-dom'],
  'router-vendor': ['@tanstack/react-router', '@tanstack/react-query'],
  'ui-vendor': ['lucide-react', 'react-markdown'],
}
```

### React Query Optimization

```typescript
// Configured in queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes
      cacheTime: 10 * 60 * 1000,   // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})
```

### Bundle Optimization

- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image and font optimization
- **CSS Purging**: Unused CSS removal with Tailwind
- **Compression**: Gzip/Brotli compression

### Performance Monitoring

```typescript
// Performance tracking
const trackPerformance = (metric: string, value: number) => {
  if (import.meta.env.PROD) {
    // Send to analytics service
    analytics.track(metric, { value })
  }
}

// Track component render time
useEffect(() => {
  performance.mark('component-start')
  
  return () => {
    performance.mark('component-end')
    performance.measure('component-render', 'component-start', 'component-end')
  }
})
```

## Accessibility

### WCAG 2.1 Compliance

The application follows accessibility best practices:

#### Semantic HTML

```tsx
// Proper heading hierarchy
<section aria-labelledby="tasks-heading">
  <h2 id="tasks-heading">My Tasks</h2>
  
  <ul role="list">
    <li role="listitem">
      <article aria-labelledby="task-1-title">
        <h3 id="task-1-title">Complete documentation</h3>
      </article>
    </li>
  </ul>
</section>
```

#### Keyboard Navigation

```tsx
// Tab management
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
  onClick={handleClick}
>
  Accessible Button
</div>
```

#### Screen Reader Support

```tsx
// ARIA labels and descriptions
<button
  aria-label="Delete task 'Complete documentation'"
  aria-describedby="delete-warning"
  onClick={handleDelete}
>
  Delete
</button>

<div id="delete-warning" className="sr-only">
  This action cannot be undone
</div>
```

#### Focus Management

```tsx
// Focus trapping in modals
import { useFocusTrap } from '@/hooks/useFocusTrap'

function Modal({ isOpen, onClose }) {
  const modalRef = useFocusTrap(isOpen)
  
  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      className="modal"
    >
      {/* Modal content */}
    </div>
  )
}
```

### Testing Accessibility

```bash
# Run accessibility tests
npm run test:a11y

# Manual testing checklist
npm run test:manual-a11y
```

## Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Run tests**: `npm run test`
5. **Lint your code**: `npm run lint`
6. **Commit your changes**: `git commit -m 'Add amazing feature'`
7. **Push to branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Code Standards

#### TypeScript Guidelines

```typescript
// Good: Use proper typing
interface TaskProps {
  task: Task
  onUpdate: (id: number, changes: Partial<Task>) => void
  onDelete: (id: number) => void
}

// Bad: Avoid 'any' types
interface BadProps {
  task: any
  onUpdate: any
  onDelete: any
}
```

#### Component Structure

```tsx
// Good: Well-structured component
interface ComponentProps {
  title: string
  onAction: () => void
}

export const MyComponent: React.FC<ComponentProps> = ({ 
  title, 
  onAction 
}) => {
  // Hooks at the top
  const { data } = useMyHook()
  const { theme } = useTheme()
  
  // Event handlers
  const handleClick = useCallback(() => {
    onAction()
  }, [onAction])
  
  // Early returns
  if (!data) return <LoadingSpinner />
  
  // Main render
  return (
    <div className="my-component">
      <h2>{title}</h2>
      <button onClick={handleClick}>
        Action
      </button>
    </div>
  )
}
```

#### Custom Hooks

```tsx
// Good: Well-designed custom hook
export const useTaskManager = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  const tasksQuery = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: () => tasksApi.getAll(),
    enabled: !!user,
  })
  
  const createTaskMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
  
  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    createTask: createTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
  }
}
```

### Git Commit Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(auth): add PIN reset functionality
fix(ui): resolve modal focus trap issue
docs(readme): update installation instructions
test(tasks): add integration tests for task creation
```

## Troubleshooting

### Common Issues

#### Development Server Issues

**Problem**: `Cannot resolve module '@/*'`

**Solution**: 
```bash
# Check tsconfig.json has proper path mapping
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

#### API Connection Issues

**Problem**: `Network Error` or CORS issues

**Solution**:
```typescript
// Check Vite proxy configuration in vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5001',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

#### TypeScript Errors

**Problem**: `Property 'X' does not exist on type 'Y'`

**Solution**:
```typescript
// Check type definitions in src/lib/api.ts
interface Task {
  id: number
  title: string
  // Add missing properties here
}

// Use proper typing in components
const TaskComponent: React.FC<{ task: Task }> = ({ task }) => {
  return <div>{task.title}</div>
}
```

#### Build Failures

**Problem**: `Chunk size limit exceeded`

**Solution**:
```typescript
// Update vite.config.ts chunk size limit
build: {
  chunkSizeWarningLimit: 1000,
  rollupOptions: {
    output: {
      manualChunks: {
        // Add more vendor chunks
        'large-vendor': ['heavy-package']
      }
    }
  }
}
```

#### Test Failures

**Problem**: `Testing Library element not found`

**Solution**:
```tsx
// Good: Use proper query methods
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/username/i)
screen.getByTestId('custom-element')

// Bad: Avoid brittle selectors
screen.getByText('Submit')  // May fail on translation
```

#### Performance Issues

**Problem**: Slow rendering or frequent re-renders

**Solution**:
```tsx
// Good: Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Expensive render */}</div>
})

// Good: Use useCallback for event handlers
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies])

// Good: Optimize queries with proper keys
const { data } = useQuery({
  queryKey: ['tasks', userId, filters],
  queryFn: () => tasksApi.getAll({ userId, ...filters }),
  enabled: !!userId,
})
```

### Debug Mode

Enable debug logging:

```typescript
// .env
VITE_LOG_LEVEL=debug

// Code - conditional logging
if (import.meta.env.DEV) {
  console.log('[Debug] Component rendered:', props)
}
```

### Performance Profiling

```typescript
// React DevTools Profiler
import { Profiler } from 'react'

<Profiler
  id="TaskList"
  onRender={(id, phase, actualDuration) => {
    console.log(id, phase, actualDuration)
  }}
>
  <TaskList />
</Profiler>
```

### Getting Help

- **Check existing issues** in the repository
- **Review documentation** in `/docs`
- **Ask in discussions** for general questions
- **Create an issue** for bugs or feature requests

### Useful Commands

```bash
# Clear all caches
npm run clean

# Reset node_modules
rm -rf node_modules package-lock.json
npm install

# Type check only
npm run type-check

# Bundle analysis
npm run build:analyze

# Test with coverage
npm run test -- --coverage

# Lint specific file
npx eslint src/components/MyComponent.tsx

# Format specific file
npx prettier --write src/components/MyComponent.tsx
```

---

<div align="center">

**Built with love using React, TypeScript, and Vite**

[Website](#) • [Documentation](#) • [API Reference](#) • [Support](#)

</div>
