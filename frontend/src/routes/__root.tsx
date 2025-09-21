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
      <div className="min-h-screen bg-white">
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

// Main app route (protected)
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: function MainApp() {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Task Line
              </h1>
              <p className="text-gray-600">
                Your main task management interface will be implemented here.
              </p>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  },
})

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, signupRoute, overviewRoute, appRoute])

export const router = createRouter({ routeTree })