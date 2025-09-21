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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">No category</option>
                {categories.map((cat: string) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="priority"
                type="checkbox"
                checked={priority}
                onChange={(e) => setPriority(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="priority" className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                <Star className={`w-4 h-4 mr-1 ${priority ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                High Priority
              </label>
            </div>
          </div>

          {/* Due Date and Estimate */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <div className="relative">
                <input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label htmlFor="estimate" className="block text-sm font-medium text-gray-700 mb-1">
                Time Estimate (minutes)
              </label>
              <div className="relative">
                <input
                  id="estimate"
                  type="text"
                  value={estimateMinutes}
                  onChange={(e) => handleEstimateChange(e.target.value)}
                  placeholder="60"
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Error Display */}
          {(createTask.error || updateTask.error) && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">
                {createTask.error?.message || updateTask.error?.message || 'An error occurred'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}