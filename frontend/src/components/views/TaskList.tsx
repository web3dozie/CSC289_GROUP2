import React, { useState, useRef, useCallback } from 'react'
import { Plus, Search, SortAsc, SortDesc, GripVertical, Archive } from 'lucide-react'
import { useTasks, useUpdateTask, useDeleteTask, useArchiveCompletedTasks } from '../../lib/hooks'
import { TaskItem, TaskModal, DeleteConfirmation, CompletionNotesModal } from '../tasks'
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
  const [completingTask, setCompletingTask] = useState<Task | null>(null)

  // Keyboard navigation state
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number>(-1)
  const [focusedElement, setFocusedElement] = useState<'search' | 'filters' | 'tasks'>('search')

  // Drag and drop state
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number>(-1)

  const taskListRef = useRef<HTMLDivElement>(null)

  const { data: tasks = [], isLoading, error } = useTasks()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const archiveCompletedTasks = useArchiveCompletedTasks()

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
    // If marking as complete, show completion notes modal
    if (!task.done) {
      setCompletingTask(task)
      return
    }

    // If unmarking as complete, just update directly
    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: { done: false }
      })
    } catch (error) {
      console.error('Failed to toggle task completion:', error)
    }
  }

  const handleCompleteTask = async (_notes?: string, _createJournalEntry?: boolean) => {
    if (!completingTask) return

    try {
      await updateTask.mutateAsync({
        id: completingTask.id,
        data: { done: true }
      })
      setCompletingTask(null)
    } catch (error) {
      console.error('Failed to complete task:', error)
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

  const handleArchiveCompleted = async () => {
    try {
      const result = await archiveCompletedTasks.mutateAsync()
      alert(`Successfully archived ${result.archived_count} completed tasks!`)
    } catch (error) {
      console.error('Failed to archive completed tasks:', error)
      alert('Failed to archive completed tasks. Please try again.')
    }
  }

  // Keyboard navigation handlers
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const maxIndex = filteredAndSortedTasks.length - 1

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedTaskIndex(prev => Math.min(prev + 1, maxIndex))
        setFocusedElement('tasks')
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedTaskIndex(prev => Math.max(prev - 1, 0))
        setFocusedElement('tasks')
        break
      case 'Enter':
        if (selectedTaskIndex >= 0 && selectedTaskIndex <= maxIndex) {
          e.preventDefault()
          handleEdit(filteredAndSortedTasks[selectedTaskIndex])
        }
        break
      case 'Delete':
      case 'Backspace':
        if (selectedTaskIndex >= 0 && selectedTaskIndex <= maxIndex) {
          e.preventDefault()
          handleDelete(filteredAndSortedTasks[selectedTaskIndex])
        }
        break
      case ' ':
        if (selectedTaskIndex >= 0 && selectedTaskIndex <= maxIndex) {
          e.preventDefault()
          handleToggleComplete(filteredAndSortedTasks[selectedTaskIndex])
        }
        break
      case 'Tab':
        // Handle tab navigation between sections
        if (e.shiftKey) {
          if (focusedElement === 'tasks') {
            setFocusedElement('filters')
            e.preventDefault()
          } else if (focusedElement === 'filters') {
            setFocusedElement('search')
            e.preventDefault()
          }
        } else {
          if (focusedElement === 'search') {
            setFocusedElement('filters')
            e.preventDefault()
          } else if (focusedElement === 'filters') {
            setFocusedElement('tasks')
            setSelectedTaskIndex(0)
            e.preventDefault()
          }
        }
        break
    }
  }, [filteredAndSortedTasks, selectedTaskIndex, focusedElement])

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task, _index: number) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML)
    ;(e.currentTarget as HTMLElement).style.opacity = '0.5'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTask(null)
    setDragOverIndex(-1)
    ;(e.currentTarget as HTMLElement).style.opacity = '1'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(-1)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    setDragOverIndex(-1)

    if (!draggedTask) return

    const draggedIndex = filteredAndSortedTasks.findIndex(task => task.id === draggedTask.id)
    if (draggedIndex === -1 || draggedIndex === dropIndex) return

    // Calculate new order values
    const tasks = [...filteredAndSortedTasks]
    const [removed] = tasks.splice(draggedIndex, 1)
    tasks.splice(dropIndex, 0, removed)

    // Update order for affected tasks
    const updates = tasks.map((task, index) => ({
      id: task.id,
      order: index
    }))

    try {
      // Update all affected tasks' order
      await Promise.all(
        updates.map(update =>
          updateTask.mutateAsync({ id: update.id, data: { order: update.order } })
        )
      )
    } catch (error) {
      console.error('Failed to reorder tasks:', error)
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
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="text-center text-red-600 dark:text-red-400">
            <p>Failed to load tasks. Please try again.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      ref={taskListRef}
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {filteredAndSortedTasks.length} of {tasks.length} tasks
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleArchiveCompleted}
              disabled={archiveCompletedTasks.isPending}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Archive className="w-4 h-4 mr-2" />
              {archiveCompletedTasks.isPending ? 'Archiving...' : 'Archive Completed'}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              id="task-search"
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setFocusedElement('search')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              aria-label="Search tasks"
            />
          </div>

          {/* Status Filter */}
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            onFocus={() => setFocusedElement('filters')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>

          {/* Category Filter */}
          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            onFocus={() => setFocusedElement('filters')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Sort by:</span>
            <button
              onClick={() => handleSort('created_at')}
              className={`flex items-center space-x-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${
                sortField === 'created_at' ? 'text-purple-600 dark:text-purple-400 font-medium' : ''
              }`}
            >
              <span>Created</span>
              {getSortIcon('created_at')}
            </button>
            <button
              onClick={() => handleSort('due_date')}
              className={`flex items-center space-x-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${
                sortField === 'due_date' ? 'text-purple-600 dark:text-purple-400 font-medium' : ''
              }`}
            >
              <span>Due Date</span>
              {getSortIcon('due_date')}
            </button>
            <button
              onClick={() => handleSort('priority')}
              className={`flex items-center space-x-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${
                sortField === 'priority' ? 'text-purple-600 dark:text-purple-400 font-medium' : ''
              }`}
            >
              <span>Priority</span>
              {getSortIcon('priority')}
            </button>
            <button
              onClick={() => handleSort('title')}
              className={`flex items-center space-x-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${
                sortField === 'title' ? 'text-purple-600 dark:text-purple-400 font-medium' : ''
              }`}
            >
              <span>Title</span>
              {getSortIcon('title')}
            </button>
          </div>

          {/* Keyboard shortcuts help */}
          <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
            <span className="font-medium">Keyboard:</span> ↑↓ navigate • Enter edit • Space toggle • Del delete • Tab switch sections
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4" role="list" aria-label="Task list">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
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
          filteredAndSortedTasks.map((task, index) => (
            <div
              key={task.id}
              className={`relative group ${
                selectedTaskIndex === index ? 'ring-2 ring-purple-500 ring-offset-2' : ''
              } ${dragOverIndex === index ? 'border-t-2 border-purple-500' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, task, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => {
                setSelectedTaskIndex(index)
                setFocusedElement('tasks')
              }}
              role="listitem"
              tabIndex={selectedTaskIndex === index ? 0 : -1}
              aria-selected={selectedTaskIndex === index}
            >
              {/* Drag handle */}
              <div className="absolute left-2 top-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>

              {/* Task item with left padding for drag handle */}
              <div className="pl-8">
                <TaskItem
                  task={task}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleComplete={handleToggleComplete}
                  showActions={true}
                />
              </div>
            </div>
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

      <CompletionNotesModal
        isOpen={!!completingTask}
        onClose={() => setCompletingTask(null)}
        task={completingTask!}
        onComplete={handleCompleteTask}
        isCompleting={updateTask.isPending}
      />
    </div>
  )
}