import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import Header from '../components/landing/Header'
import Hero from '../components/landing/Hero'
import Tutorial from '../components/landing/Tutorial'
import Privacy from '../components/landing/Privacy'
import FAQ from '../components/landing/FAQ'
import CTA from '../components/landing/CTA'
import Footer from '../components/landing/Footer'
import Login from '../components/landing/Login'
import SignUp from '../components/landing/SignUp'
import Overview from '../components/landing/Overview'
import { AuthGuard } from '../components/AuthGuard'
import { AppLayout } from '../components/AppLayout'
import { TaskList } from '../components/views/TaskList'
import { TaskBoard } from '../components/views/TaskBoard'
import { TaskCalendar } from '../components/views/TaskCalendar'
import { TaskReview } from '../components/views/TaskReview'
import { Settings } from '../components/views/Settings'
import { PomodoroTimer } from '../components/views/PomodoroTimer'

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
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <main id="main">
          <Hero />
          <Tutorial />
          <Privacy />
          <FAQ />
          <CTA />
        </main>
        <Footer />
      </div>
    )
  },
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: function LoginPage() {
    return (
      <AuthGuard requireAuth={false}>
        <Login />
      </AuthGuard>
    )
  },
})

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: function SignupPage() {
    return (
      <AuthGuard requireAuth={false}>
        <SignUp />
      </AuthGuard>
    )
  },
})

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/overview',
  component: Overview,
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

// Individual app views
const listRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/list',
  component: TaskList,
})

const boardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/board',
  component: TaskBoard,
})

const calendarRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/calendar',
  component: TaskCalendar,
})

const reviewRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/review',
  component: TaskReview,
})

const timerRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/timer',
  component: PomodoroTimer,
})

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/settings',
  component: Settings,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  overviewRoute,
  appRoute.addChildren([listRoute, boardRoute, calendarRoute, reviewRoute, timerRoute, settingsRoute])
])

export const router = createRouter({ routeTree })