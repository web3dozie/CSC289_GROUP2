import React, { useState } from 'react'
import { Plus, Search, SortAsc, SortDesc } from 'lucide-react'
import { useTasks, useUpdateTask, useDeleteTask } from '../../lib/hooks'
import { TaskItem, TaskModal, DeleteConfirmation } from '../tasks'
import type { Task } from '../../lib/api'

type SortField = 'created_at' | 'due_date' | 'priority' | 'title'
type SortOrder = 'asc' | 'desc'

export const TaskList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)

  const { data: tasks = [], isLoading, error } = useTasks()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  // Filter and sort tasks
  const filteredAndSortedTasks = React.useMemo(() => {
    let filtered = tasks.filter(task => {
      // Search filter
      const matchesSearch = !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category?.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'completed' && task.done) ||
        (statusFilter === 'pending' && !task.done)

      // Category filter
      const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter

      return matchesSearch && matchesStatus && matchesCategory
    })

    // Sort tasks
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Handle special cases
      if (sortField === 'due_date') {
        aValue = aValue ? new Date(aValue).getTime() : Infinity
        bValue = bValue ? new Date(bValue).getTime() : Infinity
      } else if (sortField === 'priority') {
        aValue = aValue ? 1 : 0
        bValue = bValue ? 1 : 0
      } else if (sortField === 'title') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [tasks, searchQuery, statusFilter, categoryFilter, sortField, sortOrder])

  // Get unique categories for filter dropdown
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set(tasks.map(task => task.category).filter(Boolean))
    return Array.from(uniqueCategories).sort()
  }, [tasks])

  const handleToggleComplete = async (task: Task) => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: { done: !task.done }
      })
    } catch (error) {
      console.error('Failed to toggle task completion:', error)
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
  }

  const handleDelete = (task: Task) => {
    setDeletingTask(task)
  }

  const confirmDelete = async () => {
    if (!deletingTask) return

    try {
      await deleteTask.mutateAsync(deletingTask.id)
      setDeletingTask(null)
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ?
      <SortAsc className="w-4 h-4" /> :
      <SortDesc className="w-4 h-4" />
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
            <p>Failed to load tasks. Please try again.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600 mt-1">
              {filteredAndSortedTasks.length} of {tasks.length} tasks
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span className="font-medium">Sort by:</span>
          <button
            onClick={() => handleSort('created_at')}
            className={`flex items-center space-x-1 hover:text-gray-900 transition-colors ${
              sortField === 'created_at' ? 'text-purple-600 font-medium' : ''
            }`}
          >
            <span>Created</span>
            {getSortIcon('created_at')}
          </button>
          <button
            onClick={() => handleSort('due_date')}
            className={`flex items-center space-x-1 hover:text-gray-900 transition-colors ${
              sortField === 'due_date' ? 'text-purple-600 font-medium' : ''
            }`}
          >
            <span>Due Date</span>
            {getSortIcon('due_date')}
          </button>
          <button
            onClick={() => handleSort('priority')}
            className={`flex items-center space-x-1 hover:text-gray-900 transition-colors ${
              sortField === 'priority' ? 'text-purple-600 font-medium' : ''
            }`}
          >
            <span>Priority</span>
            {getSortIcon('priority')}
          </button>
          <button
            onClick={() => handleSort('title')}
            className={`flex items-center space-x-1 hover:text-gray-900 transition-colors ${
              sortField === 'title' ? 'text-purple-600 font-medium' : ''
            }`}
          >
            <span>Title</span>
            {getSortIcon('title')}
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="text-gray-500 mb-4">
              {tasks.length === 0 ? (
                <>
                  <p className="text-lg font-medium mb-2">No tasks yet</p>
                  <p>Create your first task to get started!</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">No tasks match your filters</p>
                  <p>Try adjusting your search or filter criteria.</p>
                </>
              )}
            </div>
          </div>
        ) : (
          filteredAndSortedTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleComplete={handleToggleComplete}
            />
          ))
        )}
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
        onConfirm={confirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${deletingTask?.title}"? This action cannot be undone.`}
        isLoading={deleteTask.isPending}
      />
    </div>
  )
}