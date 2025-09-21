import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { useKanbanTasks, useUpdateTask, useDeleteTask } from '../../lib/hooks'
import { TaskItem, TaskModal, DeleteConfirmation } from '../tasks'
import type { Task } from '../../lib/api'

type ColumnType = 'todo' | 'in-progress' | 'done'

interface ColumnProps {
  title: string
  tasks: Task[]
  type: ColumnType
  onTaskUpdate: (taskId: number, updates: Partial<Task>) => void
  onTaskEdit: (task: Task) => void
  onTaskDelete: (task: Task) => void
}

const Column: React.FC<ColumnProps> = ({
  title,
  tasks,
  type,
  onTaskUpdate,
  onTaskEdit,
  onTaskDelete
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
      'todo': false,
      'in-progress': false,
      'done': true
    }

    onTaskUpdate(task.id, { done: statusMap[nextStatus] })
  }

  const columnColors = {
    todo: 'border-blue-200 bg-blue-50',
    'in-progress': 'border-yellow-200 bg-yellow-50',
    done: 'border-green-200 bg-green-50'
  }

  const headerColors = {
    todo: 'text-blue-800 bg-blue-100',
    'in-progress': 'text-yellow-800 bg-yellow-100',
    done: 'text-green-800 bg-green-100'
  }

  return (
    <div className={`flex-1 min-w-80 border-2 rounded-lg ${columnColors[type]}`}>
      {/* Column Header */}
      <div className={`p-4 border-b ${headerColors[type]} rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{title}</h3>
          <span className="bg-white bg-opacity-50 px-2 py-1 rounded-full text-sm font-medium">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks */}
      <div className="p-4 space-y-3 min-h-96">
        {tasks.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No tasks in {title.toLowerCase()}</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="bg-white rounded-lg shadow-sm border">
              <TaskItem
                task={task}
                onEdit={onTaskEdit}
                onDelete={onTaskDelete}
                onToggleComplete={(task) => onTaskUpdate(task.id, { done: !task.done })}
                showActions={true}
              />

              {/* Move buttons */}
              <div className="px-4 pb-3 flex justify-between">
                <button
                  onClick={() => handleMoveTask(task, 'backward')}
                  disabled={!getPrevStatus(type)}
                  className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded"
                >
                  ← Move Back
                </button>
                <button
                  onClick={() => handleMoveTask(task, 'forward')}
                  disabled={!getNextStatus(type)}
                  className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded"
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

  const { data: kanbanData, isLoading, error } = useKanbanTasks()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="flex space-x-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex-1">
                  <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(2)].map((_, j) => (
                      <div key={j} className="h-24 bg-gray-200 rounded"></div>
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
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center text-red-600">
            <p>Failed to load task board. Please try again.</p>
          </div>
        </div>
      </div>
    )
  }

  const { todo = [], 'in-progress': inProgress = [], done = [] } = kanbanData || {}

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
            <p className="text-gray-600 mt-1">
              {todo.length + inProgress.length + done.length} total tasks
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
      </div>

      {/* Board */}
      <div className="flex gap-6 overflow-x-auto pb-6">
        <Column
          title="To Do"
          tasks={todo}
          type="todo"
          onTaskUpdate={handleTaskUpdate}
          onTaskEdit={handleTaskEdit}
          onTaskDelete={handleTaskDelete}
        />
        <Column
          title="In Progress"
          tasks={inProgress}
          type="in-progress"
          onTaskUpdate={handleTaskUpdate}
          onTaskEdit={handleTaskEdit}
          onTaskDelete={handleTaskDelete}
        />
        <Column
          title="Done"
          tasks={done}
          type="done"
          onTaskUpdate={handleTaskUpdate}
          onTaskEdit={handleTaskEdit}
          onTaskDelete={handleTaskDelete}
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
    </div>
  )
}