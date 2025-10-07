import React, { useState } from 'react'
import { X, Calendar, Clock, Star } from 'lucide-react'
import { useCreateTask, useUpdateTask, useCategories } from '../../lib/hooks'
import type { Task } from '../../lib/api'

interface TaskFormProps {
  task?: Task
  onClose: () => void
  onSuccess?: () => void
}

export const TaskForm: React.FC<TaskFormProps> = ({ task, onClose, onSuccess }) => {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [category, setCategory] = useState(task?.category || '')
  const [priority, setPriority] = useState(task?.priority || false)
  const [dueDate, setDueDate] = useState(
    task?.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''
  )
  const [estimateMinutes, setEstimateMinutes] = useState(task?.estimate_minutes?.toString() || '')

  const { data: categories = [] } = useCategories()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const isEditing = !!task
  const isLoading = createTask.isPending || updateTask.isPending

  const modalRef = React.useRef<HTMLDivElement>(null)
  const titleInputRef = React.useRef<HTMLInputElement>(null)

  // Focus management
  React.useEffect(() => {
    // Focus the title input when modal opens
    if (titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [])

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Trap focus within modal
  React.useEffect(() => {
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const modal = modalRef.current
      if (!modal) return

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      category: category || undefined,
      priority,
      due_date: dueDate || undefined,
      estimate_minutes: estimateMinutes ? parseInt(estimateMinutes) : undefined,
    }

    try {
      if (isEditing && task) {
        await updateTask.mutateAsync({ id: task.id, data: taskData })
      } else {
        await createTask.mutateAsync(taskData)
      }
      onSuccess?.()
      onClose()
    } catch (error) {
      // Error is handled by the mutation
      console.error('Task operation failed:', error)
    }
  }

  const handleEstimateChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/\D/g, '')
    setEstimateMinutes(numericValue)
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-form-title"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        role="document"
      >
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2
            id="task-form-title"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 p-1 rounded"
            aria-label="Close task form"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          {/* Title */}
          <div>
            <label
              htmlFor="task-title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Title <span aria-label="required">*</span>
            </label>
            <input
              ref={titleInputRef}
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              required
              aria-required="true"
              aria-describedby="title-error"
              aria-invalid={!title.trim() && title !== ''}
            />
            {title === '' && (
              <span id="title-error" className="sr-only">
                Title is required
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="task-description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Description
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              aria-describedby="description-help"
            />
            <span id="description-help" className="sr-only">
              Optional field for additional task details
            </span>
          </div>

          {/* Category and Priority */}
          <fieldset className="grid grid-cols-2 gap-4">
            <legend className="sr-only">Task properties</legend>

            <div>
              <label
                htmlFor="task-category"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Category
              </label>
              <select
                id="task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                aria-describedby="category-help"
              >
                <option value="">No category</option>
                {categories.map((cat: string) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <span id="category-help" className="sr-only">
                Optional category to organize your tasks
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="task-priority"
                type="checkbox"
                checked={priority}
                onChange={(e) => setPriority(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500"
                aria-describedby="priority-help"
              />
              <label
                htmlFor="task-priority"
                className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                <Star
                  className={`w-4 h-4 mr-1 ${priority ? 'text-yellow-500 fill-current' : 'text-gray-400'}`}
                  aria-hidden="true"
                />
                High Priority
              </label>
              <span id="priority-help" className="sr-only">
                Mark this task as high priority to highlight its importance
              </span>
            </div>
          </fieldset>

          {/* Due Date and Estimate */}
          <fieldset className="grid grid-cols-2 gap-4">
            <legend className="sr-only">Task scheduling</legend>

            <div>
              <label
                htmlFor="task-due-date"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Due Date
              </label>
              <div className="relative">
                <input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  aria-describedby="due-date-help"
                  min={new Date().toISOString().split('T')[0]}
                />
                <Calendar
                  className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2"
                  aria-hidden="true"
                />
              </div>
              <span id="due-date-help" className="sr-only">
                Optional due date for the task
              </span>
            </div>

            <div>
              <label
                htmlFor="task-estimate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Time Estimate (minutes)
              </label>
              <div className="relative">
                <input
                  id="task-estimate"
                  type="text"
                  value={estimateMinutes}
                  onChange={(e) => handleEstimateChange(e.target.value)}
                  placeholder="60"
                  className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  aria-describedby="estimate-help"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <Clock
                  className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2"
                  aria-hidden="true"
                />
              </div>
              <span id="estimate-help" className="sr-only">
                Optional time estimate in minutes for task completion
              </span>
            </div>
          </fieldset>

          {/* Error Display */}
          {(createTask.error || updateTask.error) && (
            <div
              className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-3"
              role="alert"
              aria-live="polite"
            >
              <p className="text-sm text-red-600 dark:text-red-400">
                {createTask.error?.message || updateTask.error?.message || 'An error occurred'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md transition-colors"
              disabled={isLoading}
              aria-describedby="cancel-help"
            >
              Cancel
            </button>
            <span id="cancel-help" className="sr-only">
              Cancel and close the task form without saving
            </span>
            <button
              type="submit"
              disabled={!title.trim() || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-md transition-colors"
              aria-describedby="submit-help"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
            </button>
            <span id="submit-help" className="sr-only">
              {isEditing ? 'Save changes to the task' : 'Create the new task'}
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}