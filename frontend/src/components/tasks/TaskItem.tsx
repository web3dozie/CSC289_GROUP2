import React from 'react'
import { Calendar, Clock, Star, MoreVertical, Edit, Trash2 } from 'lucide-react'
import type { Task } from '../../lib/api'

interface TaskItemProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onToggleComplete: (task: Task) => void
  showActions?: boolean
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onEdit,
  onDelete,
  onToggleComplete,
  showActions = true
}) => {
  const [showMenu, setShowMenu] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.done
  const isDueSoon = task.due_date &&
    new Date(task.due_date).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 &&
    new Date(task.due_date) > new Date() &&
    !task.done

  const taskStatus = task.done ? 'completed' : 'pending'
  const priorityText = task.priority ? 'high priority' : 'normal priority'
  const dueDateText = task.due_date ?
    (isOverdue ? `overdue, due ${formatDate(task.due_date)}` :
     isDueSoon ? `due soon, ${formatDate(task.due_date)}` :
     `due ${formatDate(task.due_date)}`) : 'no due date'

  return (
    <article
      className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
        task.done ? 'opacity-75' : ''
      }`}
      aria-label={`Task: ${task.title}, ${taskStatus}, ${priorityText}, ${dueDateText}`}
    >
      {/* Header with checkbox and actions */}
      <header className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-3 flex-1">
          <input
            type="checkbox"
            id={`task-${task.id}-complete`}
            checked={task.done}
            onChange={() => onToggleComplete(task)}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
            aria-label={`${task.done ? 'Mark as incomplete' : 'Mark as complete'}: ${task.title}`}
          />
          <h3 className={`font-medium text-gray-900 flex-1 ${
            task.done ? 'line-through text-gray-500' : ''
          }`}>
            {task.title}
          </h3>
        </div>

        {showActions && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              aria-label={`Task options for ${task.title}`}
              aria-expanded={showMenu}
              aria-haspopup="menu"
            >
              <MoreVertical className="w-4 h-4" aria-hidden="true" />
            </button>

            {showMenu && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10"
                role="menu"
                aria-label="Task actions"
              >
                <button
                  onClick={() => {
                    onEdit(task)
                    setShowMenu(false)
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                  role="menuitem"
                  aria-label={`Edit task: ${task.title}`}
                >
                  <Edit className="w-4 h-4 mr-2" aria-hidden="true" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(task)
                    setShowMenu(false)
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-100 focus:outline-none focus:bg-red-100"
                  role="menuitem"
                  aria-label={`Delete task: ${task.title}`}
                >
                  <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Description */}
      {task.description && (
        <p className={`text-sm text-gray-600 mb-3 ${
          task.done ? 'line-through' : ''
        }`}>
          {task.description}
        </p>
      )}

      {/* Metadata */}
      <footer className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          {/* Category */}
          {task.category && (
            <span
              className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-800"
              aria-label={`Category: ${task.category}`}
            >
              {task.category}
            </span>
          )}

          {/* Priority */}
          {task.priority && (
            <div
              className="flex items-center text-yellow-600"
              aria-label="High priority task"
            >
              <Star className="w-3 h-3 fill-current" aria-hidden="true" />
            </div>
          )}

          {/* Due Date */}
          {task.due_date && (
            <div className={`flex items-center ${
              isOverdue ? 'text-red-600' :
              isDueSoon ? 'text-orange-600' : 'text-gray-500'
            }`}>
              <Calendar className="w-3 h-3 mr-1" aria-hidden="true" />
              <time dateTime={task.due_date} aria-label={`Due ${dueDateText}`}>
                {formatDate(task.due_date)}
              </time>
            </div>
          )}

          {/* Time Estimate */}
          {task.estimate_minutes && (
            <div
              className="flex items-center text-gray-500"
              aria-label={`Estimated time: ${task.estimate_minutes} minutes`}
            >
              <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
              {task.estimate_minutes}m
            </div>
          )}
        </div>

        {/* Created date */}
        <time
          className="text-xs text-gray-400"
          dateTime={task.created_at}
          aria-label={`Created ${formatDate(task.created_at)}`}
        >
          {formatDate(task.created_at)}
        </time>
      </footer>
    </article>
  )
}