import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react'
import { useCalendarTasks } from '../../lib/hooks'
import { TaskItem, TaskModal, DeleteConfirmation } from '../tasks'
import type { Task } from '../../lib/api'

interface CalendarDayProps {
  date: Date
  tasks: Task[]
  isCurrentMonth: boolean
  isToday: boolean
  onTaskClick: (task: Task) => void
  onDateClick: (date: Date) => void
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  tasks,
  isCurrentMonth,
  isToday,
  onTaskClick,
  onDateClick
}) => {
  const dayTasks = tasks.filter(task => {
    if (!task.due_date) return false
    const taskDate = new Date(task.due_date)
    return taskDate.toDateString() === date.toDateString()
  })

  const overdueTasks = dayTasks.filter(task => {
    const taskDate = new Date(task.due_date!)
    return taskDate < new Date() && !task.done
  })

  const completedTasks = dayTasks.filter(task => task.done)
  const pendingTasks = dayTasks.filter(task => !task.done && !overdueTasks.includes(task))

  return (
    <div
      className={`min-h-32 p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
        !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
      } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
      onClick={() => onDateClick(date)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
          {date.getDate()}
        </span>
        {dayTasks.length > 0 && (
          <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full">
            {dayTasks.length}
          </span>
        )}
      </div>

      <div className="space-y-1">
        {/* Overdue tasks */}
        {overdueTasks.slice(0, 2).map(task => (
          <div
            key={task.id}
            className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded truncate cursor-pointer hover:bg-red-200"
            onClick={(e) => {
              e.stopPropagation()
              onTaskClick(task)
            }}
            title={task.title}
          >
            {task.title}
          </div>
        ))}

        {/* Pending tasks */}
        {pendingTasks.slice(0, 2).map(task => (
          <div
            key={task.id}
            className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded truncate cursor-pointer hover:bg-yellow-200"
            onClick={(e) => {
              e.stopPropagation()
              onTaskClick(task)
            }}
            title={task.title}
          >
            {task.title}
          </div>
        ))}

        {/* Completed tasks */}
        {completedTasks.slice(0, 2).map(task => (
          <div
            key={task.id}
            className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded truncate cursor-pointer hover:bg-green-200 line-through"
            onClick={(e) => {
              e.stopPropagation()
              onTaskClick(task)
            }}
            title={task.title}
          >
            {task.title}
          </div>
        ))}

        {/* Show indicator if there are more tasks */}
        {dayTasks.length > 6 && (
          <div className="text-xs text-gray-500 text-center">
            +{dayTasks.length - 6} more
          </div>
        )}
      </div>
    </div>
  )
}

export const TaskCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)

  const { data: tasks = [], isLoading, error } = useCalendarTasks()

  // Calculate calendar grid
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const current = new Date(startDate)

    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }, [currentDate])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
    setSelectedDate(null)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(null)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const handleTaskClick = (task: Task) => {
    setEditingTask(task)
  }

  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return []
    return tasks.filter(task => {
      if (!task.due_date) return false
      const taskDate = new Date(task.due_date)
      return taskDate.toDateString() === selectedDate.toDateString()
    })
  }, [tasks, selectedDate])

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {[...Array(42)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center text-red-600">
            <p>Failed to load calendar. Please try again.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h1>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Today
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {dayNames.map(day => (
                <div key={day} className="p-4 text-center text-sm font-medium text-gray-700">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date, index) => (
                <CalendarDay
                  key={index}
                  date={date}
                  tasks={tasks}
                  isCurrentMonth={date.getMonth() === currentDate.getMonth()}
                  isToday={date.toDateString() === new Date().toDateString()}
                  onTaskClick={handleTaskClick}
                  onDateClick={handleDateClick}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Selected Date Tasks */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <CalendarIcon className="w-5 h-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedDate
                ? selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'Select a date'
              }
            </h2>
          </div>

          {selectedDate ? (
            <div className="space-y-3">
              {selectedDateTasks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No tasks for this date
                </p>
              ) : (
                selectedDateTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onEdit={setEditingTask}
                    onDelete={setDeletingTask}
                    onToggleComplete={() => {}} // Will be handled by modal
                    showActions={true}
                  />
                ))
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Click on a date to see tasks
            </p>
          )}
        </div>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
      />

      <TaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask || undefined}
        onSuccess={() => setEditingTask(null)}
      />

      <DeleteConfirmation
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={() => {
          // Delete functionality would be implemented here
          setDeletingTask(null)
        }}
        title="Delete Task"
        message={`Are you sure you want to delete "${deletingTask?.title}"? This action cannot be undone.`}
      />
    </div>
  )
}