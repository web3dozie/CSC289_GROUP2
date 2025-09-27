import React, { useState } from 'react'
import { CheckSquare, Search, X } from 'lucide-react'
import { useTasks } from '../../lib/hooks'
import type { Task } from '../../lib/api'

interface TaskSelectorProps {
  selectedTaskId: number | null
  onTaskSelect: (taskId: number | null) => void
}

export const TaskSelector: React.FC<TaskSelectorProps> = ({
  selectedTaskId,
  onTaskSelect
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: tasks = [], isLoading } = useTasks()

  // Filter tasks based on search term and exclude completed/archived tasks
  const availableTasks = tasks.filter(task =>
    !task.done &&
    !task.archived &&
    (searchTerm === '' ||
     task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())))
  )

  const selectedTask = tasks.find(task => task.id === selectedTaskId)

  const handleTaskSelect = (task: Task) => {
    onTaskSelect(task.id)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClearSelection = () => {
    onTaskSelect(null)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Current Task
      </h3>

      {/* Selected Task Display */}
      {selectedTask ? (
        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg mb-4">
          <div className="flex items-center">
            <CheckSquare className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-3" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {selectedTask.title}
              </p>
              {selectedTask.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedTask.description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClearSelection}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
            aria-label="Clear task selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          No task selected. Select a task to track your focused work time.
        </p>
      )}

      {/* Task Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        {selectedTask ? 'Change Task' : 'Select Task'}
      </button>

      {/* Task Selection Modal/Dropdown */}
      {isOpen && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Task List */}
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : availableTasks.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                {searchTerm ? 'No tasks match your search.' : 'No active tasks available.'}
              </p>
            ) : (
              <div className="space-y-2">
                {availableTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => handleTaskSelect(task)}
                    className="w-full text-left p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <div className="flex items-start">
                      <CheckSquare className="w-4 h-4 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          {task.category && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                              {task.category}
                            </span>
                          )}
                          {task.priority && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                              High Priority
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}