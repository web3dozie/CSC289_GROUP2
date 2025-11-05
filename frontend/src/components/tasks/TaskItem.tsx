import React from 'react'
import { Calendar, Clock, Star, Edit, Trash2, Archive } from 'lucide-react'
import type { Task } from '../../lib/api'

interface TaskItemProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onArchive?: (task: Task) => void
  onToggleComplete: (task: Task) => void
  showActions?: boolean
  isFirstTask?: boolean
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onEdit,
  onDelete,
  onArchive,
  onToggleComplete,
  showActions = true,
  isFirstTask = false
}) => {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  // Compare dates only (not time) - task is overdue only after the due date has passed
  const isOverdue = task.due_date && (() => {
    const dueDate = new Date(task.due_date)
    const today = new Date()
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return dueDateOnly < todayStart && !task.done
  })()
  
  const isDueSoon = task.due_date && (() => {
    const dueDate = new Date(task.due_date)
    const today = new Date()
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)
    return dueDateOnly >= todayStart && dueDateOnly < tomorrowStart && !task.done
  })()

  const taskStatus = task.done ? 'completed' : 'pending'
  const priorityText = task.priority ? 'high priority' : 'normal priority'
  const dueDateText = task.due_date ?
    (isOverdue ? `overdue, due ${formatDate(task.due_date)}` :
     isDueSoon ? `due soon, ${formatDate(task.due_date)}` :
     `due ${formatDate(task.due_date)}`) : 'no due date'
  const archiveText = task.archived ? 'archived' : ''

  return (
    <article
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
        task.archived ? 'opacity-50 bg-gray-50 dark:bg-gray-700' : task.done ? 'opacity-75' : ''
      }`}
      aria-label={`Task: ${task.title}, ${taskStatus}, ${archiveText}, ${priorityText}, ${dueDateText}`}
    >
      {/* Header with checkbox and actions */}
      <header className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-3 flex-1">
          <input
            type="checkbox"
            id={`task-${task.id}-complete`}
            checked={task.done}
            onChange={() => onToggleComplete(task)}
            className="w-4 h-4 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
            aria-label={`${task.done ? 'Mark as incomplete' : 'Mark as complete'}: ${task.title}`}
          />
          <h3
            data-tutorial={isFirstTask ? "task-item-title" : undefined}
            className={`font-medium text-gray-900 dark:text-gray-100 flex-1 ${
            task.archived ? 'text-gray-500 dark:text-gray-400' : task.done ? 'line-through text-gray-500 dark:text-gray-400' : ''
          }`}>
            {task.title}
          </h3>
        </div>

        {showActions && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(task)}
              className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
              aria-label={`Edit task: ${task.title}`}
              data-tutorial={isFirstTask ? "task-item-edit-button" : undefined}
            >
              <Edit className="w-4 h-4" aria-hidden="true" />
            </button>
            {onArchive && (
              <button
                onClick={() => onArchive(task)}
                className="text-gray-400 dark:text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 p-1 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
                aria-label={`Archive task: ${task.title}`}
              >
                <Archive className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            <button
              onClick={() => onDelete(task)}
              className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 p-1 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
              aria-label={`Delete task: ${task.title}`}
              data-tutorial={isFirstTask ? "task-item-delete-button" : undefined}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </header>

      {/* Description */}
      {task.description && (
        <p className={`text-sm text-gray-600 dark:text-gray-400 mb-3 ${
          task.archived ? 'text-gray-400 dark:text-gray-500' : task.done ? 'line-through' : ''
        }`}>
          {task.description}
        </p>
      )}

      {/* Metadata */}
      <footer className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          {/* Category */}
          {task.category && (
            <span
              className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
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
              className="flex items-center text-gray-500 dark:text-gray-400"
              aria-label={`Estimated time: ${task.estimate_minutes} minutes`}
            >
              <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
              {task.estimate_minutes}m
            </div>
          )}
        </div>

        {/* Created date */}
        <time
          className="text-xs text-gray-400 dark:text-gray-500"
          dateTime={task.created_at}
          aria-label={`Created ${formatDate(task.created_at)}`}
        >
          {formatDate(task.created_at)}
        </time>
      </footer>
    </article>
  )
}
