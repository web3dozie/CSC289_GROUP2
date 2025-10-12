import React, { useState, useRef } from 'react'
import { Plus, GripVertical, Archive } from 'lucide-react'
import { useKanbanTasks, useUpdateTask, useDeleteTask, useArchiveCompletedTasks } from '../../lib/hooks'
import { TaskItem, TaskModal, DeleteConfirmation, CompletionNotesModal } from '../tasks'
import type { Task } from '../../lib/api'

type ColumnType = 'todo' | 'in-progress' | 'done'

interface ColumnProps {
  title: string
  tasks: Task[]
  type: ColumnType
  onTaskUpdate: (taskId: number, updates: Partial<Task>) => void
  onTaskEdit: (task: Task) => void
  onTaskDelete: (task: Task) => void
  onDragStart: (e: React.DragEvent, task: Task) => void
  onDragEnd: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent, columnType: ColumnType) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, targetColumn: ColumnType) => void
  isDragOver: boolean
}

const Column: React.FC<ColumnProps> = ({
  title,
  tasks,
  type,
  onTaskUpdate,
  onTaskEdit,
  onTaskDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver
}) => {
  const getNextStatus = (currentType: ColumnType): ColumnType | null => {
    switch (currentType) {
      case 'todo': return 'in-progress'
      case 'in-progress': return 'done'
      case 'done': return null
      default: return null
    }
  }

  const getPrevStatus = (currentType: ColumnType): ColumnType | null => {
    switch (currentType) {
      case 'todo': return null
      case 'in-progress': return 'todo'
      case 'done': return 'in-progress'
      default: return null
    }
  }

  const handleMoveTask = (task: Task, direction: 'forward' | 'backward') => {
    const nextStatus = direction === 'forward' ? getNextStatus(type) : getPrevStatus(type)
    if (!nextStatus) return

    const statusMap = {
      'todo': { status_id: 1, done: false },
      'in-progress': { status_id: 2, done: false },
      'done': { status_id: 3, done: true }
    }

    onTaskUpdate(task.id, statusMap[nextStatus] as any)
  }

  const columnColors = {
    todo: 'border-blue-200 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20',
    'in-progress': 'border-yellow-200 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20',
    done: 'border-green-200 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
  }

  const headerColors = {
    todo: 'text-blue-800 bg-blue-100 dark:text-blue-200 dark:bg-blue-800/50',
    'in-progress': 'text-yellow-800 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-800/50',
    done: 'text-green-800 bg-green-100 dark:text-green-200 dark:bg-green-800/50'
  }

  return (
    <div
      data-tutorial={type === 'todo' ? 'board-column-todo' : undefined}
      className={`flex-1 min-w-80 border-2 rounded-lg transition-colors ${
        columnColors[type]
      } ${isDragOver ? 'ring-2 ring-purple-400 ring-opacity-50' : ''}`}
      onDragOver={(e) => onDragOver(e, type)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, type)}
    >
      {/* Column Header */}
      <div className={`p-4 border-b ${headerColors[type]} rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{title}</h3>
          <span className="bg-white dark:bg-gray-700 bg-opacity-50 dark:bg-opacity-50 px-2 py-1 rounded-full text-sm font-medium">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks */}
      <div className="p-4 space-y-3 min-h-96 relative">
        {isDragOver && (
          <div className="absolute inset-0 border-2 border-dashed border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/30 bg-opacity-50 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <div className="text-purple-600 dark:text-purple-300 font-medium">Drop here</div>
              <div className="text-sm text-purple-500 dark:text-purple-400">Move to {title}</div>
            </div>
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p>No tasks in {title.toLowerCase()}</p>
            {isDragOver && (
              <p className="text-sm text-purple-500 dark:text-purple-400 mt-2">Drop tasks here</p>
            )}
          </div>
        ) : (
          tasks.map((task, index) => (
            <div
              key={task.id}
              data-tutorial={index === 0 && type === 'todo' ? 'board-card' : undefined}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-600 group cursor-move"
              draggable
              onDragStart={(e) => onDragStart(e, task)}
              onDragEnd={onDragEnd}
            >
              {/* Drag handle */}
              <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-600">
                <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Drag to move
                </span>
              </div>

              <TaskItem
                task={task}
                onEdit={onTaskEdit}
                onDelete={onTaskDelete}
                onToggleComplete={(task) => onTaskUpdate(task.id, { done: !task.done })}
                showActions={true}
              />

              {/* Move buttons - keep for keyboard users */}
              <div className="px-4 pb-3 flex justify-between">
                <button
                  onClick={() => handleMoveTask(task, 'backward')}
                  disabled={!getPrevStatus(type)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded"
                >
                  ← Move Back
                </button>
                <button
                  onClick={() => handleMoveTask(task, 'forward')}
                  disabled={!getNextStatus(type)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded"
                >
                  Move Forward →
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export const TaskBoard: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)
  const [completingTask, setCompletingTask] = useState<Task | null>(null)
  const [liveMessage, setLiveMessage] = useState('')

  // Announce task movements to screen readers
  const announceTaskMovement = (taskTitle: string, fromColumn: string, toColumn: string) => {
    setLiveMessage(`Task "${taskTitle}" moved from ${fromColumn} to ${toColumn}`)
    setTimeout(() => setLiveMessage(''), 1000)
  }

  const announceTaskCompletion = (taskTitle: string) => {
    setLiveMessage(`Task "${taskTitle}" marked as completed`)
    setTimeout(() => setLiveMessage(''), 1000)
  }

  // Drag and drop state
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<ColumnType | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  const { data: kanbanData, isLoading, error } = useKanbanTasks()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const archiveCompletedTasks = useArchiveCompletedTasks()

  const handleTaskUpdate = async (taskId: number, updates: Partial<Task>) => {
    try {
      await updateTask.mutateAsync({ id: taskId, data: updates })
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task)
  }

  const handleTaskDelete = (task: Task) => {
    setDeletingTask(task)
  }

  const handleDeleteConfirm = async () => {
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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML)
    ;(e.currentTarget as HTMLElement).style.opacity = '0.5'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTask(null)
    setDragOverColumn(null)
    ;(e.currentTarget as HTMLElement).style.opacity = '1'
  }

  const handleDragOver = (e: React.DragEvent, columnType: ColumnType) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnType)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, targetColumn: ColumnType) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedTask) return

    // Determine current column based on task status_id
    let currentColumn: ColumnType
    if (!draggedTask.status) {
      currentColumn = 'todo' // Default fallback
    } else {
      switch (draggedTask.status.id) {
        case 1: currentColumn = 'todo'; break
        case 2: currentColumn = 'in-progress'; break  
        case 3: currentColumn = 'done'; break
        default: currentColumn = 'todo'; break
      }
    }

    // Don't do anything if dropping in the same column
    if (currentColumn === targetColumn) return

    // If moving to done column, show completion notes modal
    if (targetColumn === 'done' && !draggedTask.done) {
      setCompletingTask(draggedTask)
      return
    }

    // Map column types to task status updates
    const statusUpdates: Record<ColumnType, Partial<Task>> = {
      'todo': { status_id: 1, done: false },
      'in-progress': { status_id: 2, done: false },
      'done': { status_id: 3, done: true }
    }

    try {
      await updateTask.mutateAsync({
        id: draggedTask.id,
        data: statusUpdates[targetColumn]
      })
      // Announce the task movement
      announceTaskMovement(draggedTask.title, currentColumn, targetColumn)
    } catch (error) {
      console.error('Failed to move task:', error)
    }
  }

  const handleCompleteTask = async (_notes?: string, _createJournalEntry?: boolean) => {
    if (!completingTask) return

    try {
      await updateTask.mutateAsync({
        id: completingTask.id,
        data: { done: true, status_id: 3 }
      })
      announceTaskCompletion(completingTask.title)
      setCompletingTask(null)
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-1/4 mb-6"></div>
            <div className="flex space-x-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex-1">
                  <div className="h-12 bg-gray-200 dark:bg-gray-600 rounded mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(2)].map((_, j) => (
                      <div key={j} className="h-24 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    ))}
                  </div>
                </div>
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
            <p>Failed to load task board. Please try again.</p>
          </div>
        </div>
      </div>
    )
  }

  // Extract tasks from the kanban data structure
  const todoData = kanbanData?.todo
  const inProgressData = kanbanData?.in_progress
  const doneData = kanbanData?.done

  const todo = todoData?.tasks || []
  const inProgress = inProgressData?.tasks || []
  const done = doneData?.tasks || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ARIA Live Region for announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {liveMessage}
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Board</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {todo.length + inProgress.length + done.length} total tasks
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Drag tasks between columns or use the move buttons
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
      </div>

      {/* Board */}
      <div className="flex gap-6 overflow-x-auto pb-6" ref={boardRef}>
        <Column
          title="To Do"
          tasks={todo}
          type="todo"
          onTaskUpdate={handleTaskUpdate}
          onTaskEdit={handleTaskEdit}
          onTaskDelete={handleTaskDelete}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          isDragOver={dragOverColumn === 'todo'}
        />
        <Column
          title="In Progress"
          tasks={inProgress}
          type="in-progress"
          onTaskUpdate={handleTaskUpdate}
          onTaskEdit={handleTaskEdit}
          onTaskDelete={handleTaskDelete}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          isDragOver={dragOverColumn === 'in-progress'}
        />
        <Column
          title="Done"
          tasks={done}
          type="done"
          onTaskUpdate={handleTaskUpdate}
          onTaskEdit={handleTaskEdit}
          onTaskDelete={handleTaskDelete}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          isDragOver={dragOverColumn === 'done'}
        />
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
        onConfirm={handleDeleteConfirm}
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