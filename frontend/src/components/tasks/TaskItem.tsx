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

  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
      task.done ? 'opacity-75' : ''
    }`}>
      {/* Header with checkbox and actions */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-3 flex-1">
          <input
            type="checkbox"
            checked={task.done}
            onChange={() => onToggleComplete(task)}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
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
              className="text-gray-400 hover:text-gray-600 p-1 rounded"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <button
                  onClick={() => {
                    onEdit(task)
                    setShowMenu(false)
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(task)
                    setShowMenu(false)
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className={`text-sm text-gray-600 mb-3 ${
          task.done ? 'line-through' : ''
        }`}>
          {task.description}
        </p>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          {/* Category */}
          {task.category && (
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-800">
              {task.category}
            </span>
          )}

          {/* Priority */}
          {task.priority && (
            <div className="flex items-center text-yellow-600">
              <Star className="w-3 h-3 fill-current" />
            </div>
          )}

          {/* Due Date */}
          {task.due_date && (
            <div className={`flex items-center ${
              isOverdue ? 'text-red-600' :
              isDueSoon ? 'text-orange-600' : 'text-gray-500'
            }`}>
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(task.due_date)}
            </div>
          )}

          {/* Time Estimate */}
          {task.estimate_minutes && (
            <div className="flex items-center text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              {task.estimate_minutes}m
            </div>
          )}
        </div>

        {/* Created date */}
        <span className="text-xs text-gray-400">
          {formatDate(task.created_at)}
        </span>
      </div>
    </div>
  )
}