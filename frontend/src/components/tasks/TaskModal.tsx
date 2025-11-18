import React from 'react'
import { TaskForm } from './TaskForm'
import type { Task } from '../../lib/api'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  task?: Task
  onSuccess?: () => void
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  onSuccess
}) => {
  if (!isOpen) return null

  return (
    <TaskForm
      task={task}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}