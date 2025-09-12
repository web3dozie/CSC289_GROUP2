import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import Header from '../components/landing/Header'
import Hero from '../components/landing/Hero'
import WhyDifferent from '../components/landing/WhyDifferent'
import Features from '../components/landing/Features'
import Views from '../components/landing/Views'
import CoachChat from '../components/landing/CoachChat'
import Tutorial from '../components/landing/Tutorial'
import Analytics from '../components/landing/Analytics'
import Privacy from '../components/landing/Privacy'
import FAQ from '../components/landing/FAQ'
import CTA from '../components/landing/CTA'
import Footer from '../components/landing/Footer'
import Login from '../components/landing/Login'

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
          <WhyDifferent />
          <Features />
          <Views />
          <CoachChat />
          <Tutorial />
          <Analytics />
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

const routeTree = rootRoute.addChildren([indexRoute, loginRoute])

export const router = createRouter({ routeTree })