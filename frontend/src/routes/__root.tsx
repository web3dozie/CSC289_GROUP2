import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'
import { AuthGuard } from '../components/AuthGuard'
import { AppLayout } from '../components/AppLayout'

// Lazy load landing page components
const Header = lazy(() => import('../components/landing/Header'))
const Hero = lazy(() => import('../components/landing/Hero'))
const Features = lazy(() => import('../components/landing/Features'))
const Views = lazy(() => import('../components/landing/Views'))
const Privacy = lazy(() => import('../components/landing/Privacy'))
const FAQ = lazy(() => import('../components/landing/FAQ'))
const CTA = lazy(() => import('../components/landing/CTA'))
const Footer = lazy(() => import('../components/landing/Footer'))
const Login = lazy(() => import('../components/landing/Login'))
const SignUp = lazy(() => import('../components/landing/SignUp'))
const Overview = lazy(() => import('../components/landing/Overview'))

// Lazy load view components
const Dashboard = lazy(() => import('../components/views/Dashboard').then(module => ({ default: module.Dashboard })))
const TaskList = lazy(() => import('../components/views/TaskList').then(module => ({ default: module.TaskList })))
const TaskBoard = lazy(() => import('../components/views/TaskBoard').then(module => ({ default: module.TaskBoard })))
const TaskCalendar = lazy(() => import('../components/views/TaskCalendar').then(module => ({ default: module.TaskCalendar })))
const TaskReview = lazy(() => import('../components/views/TaskReview').then(module => ({ default: module.TaskReview })))
const Settings = lazy(() => import('../components/views/Settings').then(module => ({ default: module.Settings })))
const PomodoroTimer = lazy(() => import('../components/views/PomodoroTimer').then(module => ({ default: module.PomodoroTimer })))

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
    </>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function LandingPage() {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-900">Loading...</div>}>
        <div className="min-h-screen bg-slate-900">
          <Header />
          <main id="main">
            <Hero />
            <Features />
            <Views />
            <Privacy />
            <FAQ />
            <CTA />
          </main>
          <Footer />
        </div>
      </Suspense>
    )
  },
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: function LoginPage() {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <AuthGuard requireAuth={false}>
          <Login />
        </AuthGuard>
      </Suspense>
    )
  },
})

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: function SignupPage() {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <AuthGuard requireAuth={false}>
          <SignUp />
        </AuthGuard>
      </Suspense>
    )
  },
})

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/overview',
  component: function OverviewPage() {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <Overview />
      </Suspense>
    )
  },
})

// App routes (protected)
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: function AppShell() {
    return (
      <AuthGuard requireAuth={true}>
        <AppLayout />
      </AuthGuard>
    )
  },
})

// Dashboard - index route for /app
const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  component: function DashboardPage() {
    return (
      <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
        <Dashboard />
      </Suspense>
    )
  },
})

// Individual app views
const listRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/list',
  component: function TaskListPage() {
    return (
      <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
        <TaskList />
      </Suspense>
    )
  },
})

const boardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/board',
  component: function TaskBoardPage() {
    return (
      <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
        <TaskBoard />
      </Suspense>
    )
  },
})

const calendarRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/calendar',
  component: function TaskCalendarPage() {
    return (
      <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
        <TaskCalendar />
      </Suspense>
    )
  },
})

const reviewRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/review',
  component: function TaskReviewPage() {
    return (
      <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
        <TaskReview />
      </Suspense>
    )
  },
})

const timerRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/timer',
  component: function PomodoroTimerPage() {
    return (
      <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
        <PomodoroTimer />
      </Suspense>
    )
  },
})

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/settings',
  component: function SettingsPage() {
    return (
      <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
        <Settings />
      </Suspense>
    )
  },
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  overviewRoute,
  appRoute.addChildren([dashboardRoute, listRoute, boardRoute, calendarRoute, reviewRoute, timerRoute, settingsRoute])
])

export const router = createRouter({ routeTree })