import React from 'react'
import { Link } from '@tanstack/react-router'
import {
  CheckSquare,
  Kanban,
  Calendar,
  BarChart3,
  Timer,
  TrendingUp,
  Clock,
  Target,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Zap
} from 'lucide-react'
import { useTasks } from '../../lib/hooks'

export const Dashboard: React.FC = () => {
  const { data: tasks = [], isLoading } = useTasks()

  // Calculate statistics
  const stats = React.useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.done).length
    const pendingTasks = tasks.filter(t => !t.done).length
    const dueTodayTasks = tasks.filter(t => {
      if (!t.due_date || t.done) return false
      const dueDate = new Date(t.due_date)
      return dueDate >= todayStart && dueDate < todayEnd
    })
    const overdueTasks = tasks.filter(t => {
      if (!t.due_date || t.done) return false
      return new Date(t.due_date) < now
    })
    const highPriorityTasks = tasks.filter(t => !t.done && t.priority === true)
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      dueTodayCount: dueTodayTasks.length,
      dueTodayTasks: dueTodayTasks.slice(0, 5),
      overdueCount: overdueTasks.length,
      overdueTasks: overdueTasks.slice(0, 5),
      highPriorityCount: highPriorityTasks.length,
      highPriorityTasks: highPriorityTasks.slice(0, 5),
      completionRate
    }
  }, [tasks])

  const quickActions = [
    {
      name: 'List View',
      description: 'View all tasks in a list',
      icon: CheckSquare,
      href: '/app/list',
      color: 'purple'
    },
    {
      name: 'Board View',
      description: 'Organize tasks by status',
      icon: Kanban,
      href: '/app/board',
      color: 'blue'
    },
    {
      name: 'Calendar',
      description: 'See tasks by date',
      icon: Calendar,
      href: '/app/calendar',
      color: 'green'
    },
    {
      name: 'Review',
      description: 'Track your progress',
      icon: BarChart3,
      href: '/app/review',
      color: 'orange'
    },
    {
      name: 'Pomodoro Timer',
      description: 'Focus with time tracking',
      icon: Timer,
      href: '/app/timer',
      color: 'red'
    }
  ]

  const statCards = [
    {
      label: 'Total Tasks',
      value: stats.totalTasks,
      icon: Target,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/10'
    },
    {
      label: 'Completed',
      value: stats.completedTasks,
      icon: CheckCircle2,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/10'
    },
    {
      label: 'Pending',
      value: stats.pendingTasks,
      icon: Clock,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/10'
    },
    {
      label: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/10'
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <Zap className="w-8 h-8 mr-3 text-purple-600" />
          Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome back! Here's an overview of your tasks and productivity.
        </p>
      </header>

      {/* Stats Grid */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className={`${stat.bgColor} rounded-lg p-6 border border-gray-200 dark:border-gray-700 transition-shadow hover:shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.color} rounded-full p-3`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Task Alerts */}
      {(stats.overdueCount > 0 || stats.dueTodayCount > 0 || stats.highPriorityCount > 0) && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Attention Needed
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overdue Tasks */}
            {stats.overdueCount > 0 && (
              <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-6 border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                    <h3 className="font-semibold text-red-900 dark:text-red-100">
                      Overdue ({stats.overdueCount})
                    </h3>
                  </div>
                  <Link
                    to="/app/list"
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    View all
                  </Link>
                </div>
                <ul className="space-y-2">
                  {stats.overdueTasks.map((task) => (
                    <li
                      key={task.id}
                      className="text-sm text-red-900 dark:text-red-100 truncate"
                    >
                      • {task.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Due Today */}
            {stats.dueTodayCount > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                      Due Today ({stats.dueTodayCount})
                    </h3>
                  </div>
                  <Link
                    to="/app/calendar"
                    className="text-sm text-yellow-600 dark:text-yellow-400 hover:underline"
                  >
                    View all
                  </Link>
                </div>
                <ul className="space-y-2">
                  {stats.dueTodayTasks.map((task) => (
                    <li
                      key={task.id}
                      className="text-sm text-yellow-900 dark:text-yellow-100 truncate"
                    >
                      • {task.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* High Priority */}
            {stats.highPriorityCount > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Target className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2" />
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                      High Priority ({stats.highPriorityCount})
                    </h3>
                  </div>
                  <Link
                    to="/app/list"
                    className="text-sm text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    View all
                  </Link>
                </div>
                <ul className="space-y-2">
                  {stats.highPriorityTasks.map((task) => (
                    <li
                      key={task.id}
                      className="text-sm text-orange-900 dark:text-orange-100 truncate"
                    >
                      • {task.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            const colorClasses = {
              purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/30',
              blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30',
              green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30',
              orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/30',
              red: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30'
            }

            return (
              <Link
                key={action.name}
                to={action.href}
                className="group bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
              >
                <div
                  className={`${colorClasses[action.color as keyof typeof colorClasses]} rounded-lg p-3 inline-flex mb-4 transition-colors`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {action.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {action.description}
                </p>
                <div className="flex items-center text-sm font-medium text-purple-600 dark:text-purple-400">
                  Open
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Getting Started - Show when no tasks exist */}
      {stats.totalTasks === 0 && (
        <section className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-lg p-8 border border-purple-200 dark:border-purple-800">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-purple-100 dark:bg-purple-900/20 rounded-full p-4 inline-flex mb-4">
              <CheckSquare className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Welcome to Task Line!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get started by creating your first task. Stay organized, focused, and productive.
            </p>
            <Link
              to="/app/list"
              className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Create Your First Task
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
