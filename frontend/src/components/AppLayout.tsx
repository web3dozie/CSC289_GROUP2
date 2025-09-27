import React from 'react'
import { Outlet, Link, useLocation } from '@tanstack/react-router'
import {
  CheckSquare,
  Kanban,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  User,
  Timer
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navigation = [
  { name: 'List', href: '/app/list', icon: CheckSquare },
  { name: 'Board', href: '/app/board', icon: Kanban },
  { name: 'Calendar', href: '/app/calendar', icon: Calendar },
  { name: 'Review', href: '/app/review', icon: BarChart3 },
  { name: 'Timer', href: '/app/timer', icon: Timer },
]

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Skip Navigation Links */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-md"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-32 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-md"
      >
        Skip to navigation
      </a>

      {/* Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg"
        role="complementary"
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <header className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Task Line</h1>
          </header>

          {/* Navigation */}
          <nav
            id="navigation"
            className="flex-1 px-4 py-6 space-y-2"
            role="navigation"
            aria-label="Task management views"
          >
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    isActive
                      ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-r-2 border-purple-700 dark:border-purple-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5 mr-3" aria-hidden="true" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <section className="border-t border-gray-200 dark:border-gray-700 p-4" aria-label="User account">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user?.username || 'User'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                title="Logout"
                aria-label="Logout from your account"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Settings link */}
            <Link
              to="/app/settings"
              className="flex items-center mt-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              aria-label="Go to settings page"
            >
              <Settings className="w-4 h-4 mr-2" aria-hidden="true" />
              Settings
            </Link>
          </section>
        </div>
      </aside>

      {/* Main content */}
      <div className="pl-64">
        <main
          id="main-content"
          className="py-6"
          role="main"
          aria-label="Task management content"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}