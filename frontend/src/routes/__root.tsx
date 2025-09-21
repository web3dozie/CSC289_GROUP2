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
  component: Login,
})

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: SignUp,
})

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/overview',
  component: Overview,
})

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, signupRoute, overviewRoute])

export const router = createRouter({ routeTree })