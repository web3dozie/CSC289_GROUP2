import React from 'react'

export const TaskBoard: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Task Board</h2>
        <p className="text-gray-600 mb-4">
          Your Kanban board view will be implemented here. This will show tasks organized in columns (Todo, In Progress, Done) with drag-and-drop functionality.
        </p>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500">Task Board View - Coming Soon</p>
        </div>
      </div>
    </div>
  )
}