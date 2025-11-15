import React, { useState } from 'react'
import { Tag, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react'
import {
  useCategoriesFull,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCategoryUsage
} from '../../lib/hooks'
import type { Category } from '../../lib/api'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  const colors = [
    { hex: 'EF4444', name: 'Red' },
    { hex: 'F97316', name: 'Orange' },
    { hex: 'EAB308', name: 'Yellow' },
    { hex: '22C55E', name: 'Green' },
    { hex: '06B6D4', name: 'Cyan' },
    { hex: '3B82F6', name: 'Blue' },
    { hex: '8B5CF6', name: 'Violet' },
    { hex: 'EC4899', name: 'Pink' },
    { hex: '6B7280', name: 'Gray' },
    { hex: '000000', name: 'Black' },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {colors.map(color => (
        <button
          key={color.hex}
          type="button"
          onClick={() => onChange(color.hex)}
          className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
            value?.toUpperCase() === color.hex
              ? 'border-purple-600 dark:border-purple-400 scale-110 ring-2 ring-purple-200 dark:ring-purple-800'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          style={{ backgroundColor: `#${color.hex}` }}
          title={color.name}
          aria-label={`Select ${color.name} color`}
        />
      ))}
    </div>
  )
}

interface CategoryFormProps {
  category?: Category
  onSave: (data: { name: string; description: string; color_hex: string }) => void
  onCancel: () => void
  isLoading: boolean
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSave, onCancel, isLoading }) => {
  const [name, setName] = useState(category?.name || '')
  const [description, setDescription] = useState(category?.description || '')
  const [colorHex, setColorHex] = useState(category?.color_hex || '3B82F6')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onSave({
      name: name.trim(),
      description: description.trim(),
      color_hex: colorHex
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Category Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter category name"
          maxLength={140}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          required
          autoFocus
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Maximum 140 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          maxLength={140}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Maximum 140 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Color *
        </label>
        <ColorPicker value={colorHex} onChange={setColorHex} />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim() || isLoading}
          className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
        </button>
      </div>
    </form>
  )
}

interface DeleteConfirmationProps {
  category: Category
  taskCount: number
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  category,
  taskCount,
  onConfirm,
  onCancel,
  isLoading
}) => {
  return (
    <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
            Delete Category
          </h4>
          <p className="text-sm text-red-800 dark:text-red-200 mb-3">
            Are you sure you want to delete the category "{category.name}"?
          </p>
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-red-300 dark:border-red-600">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Tasks using this category:</strong> {taskCount}
            </p>
            {taskCount > 0 && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                Deleting this category will remove it from {taskCount} task{taskCount !== 1 ? 's' : ''}.
                Tasks will not be deleted, but will lose their category assignment.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Deleting...' : 'Delete Category'}
        </button>
      </div>
    </div>
  )
}

export const CategoriesManagement: React.FC = () => {
  const { data: categories = [], isLoading } = useCategoriesFull()
  const { data: usageData = [] } = useCategoryUsage()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  const getUsageCount = (categoryId: number) => {
    const usage = usageData.find(u => u.id === categoryId)
    return usage?.task_count || 0
  }

  const handleCreateCategory = async (data: { name: string; description: string; color_hex: string }) => {
    try {
      await createCategory.mutateAsync(data)
      setShowCreateForm(false)
    } catch (error: any) {
      console.error('Failed to create category:', error)
      alert(error?.message || 'Failed to create category. Please try again.')
    }
  }

  const handleUpdateCategory = async (data: { name: string; description: string; color_hex: string }) => {
    if (!editingCategory) return

    try {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        data
      })
      setEditingCategory(null)
    } catch (error: any) {
      console.error('Failed to update category:', error)
      alert(error?.message || 'Failed to update category. Please try again.')
    }
  }

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return

    try {
      await deleteCategory.mutateAsync(deletingCategory.id)
      setDeletingCategory(null)
    } catch (error: any) {
      console.error('Failed to delete category:', error)
      alert(error?.message || 'Failed to delete category. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Categories ({categories.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Organize your tasks with custom categories and colors
          </p>
        </div>
        {!showCreateForm && !editingCategory && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Category
          </button>
        )}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
            <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">
              Create New Category
            </h4>
          </div>
          <CategoryForm
            onSave={handleCreateCategory}
            onCancel={() => setShowCreateForm(false)}
            isLoading={createCategory.isPending}
          />
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingCategory && (
        <DeleteConfirmation
          category={deletingCategory}
          taskCount={getUsageCount(deletingCategory.id)}
          onConfirm={handleDeleteCategory}
          onCancel={() => setDeletingCategory(null)}
          isLoading={deleteCategory.isPending}
        />
      )}

      {/* Categories List */}
      <div className="space-y-3">
        {categories.length === 0 && !showCreateForm ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No categories yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first category to start organizing your tasks.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Category
            </button>
          </div>
        ) : (
          categories.map(category => (
            <div key={category.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              {editingCategory?.id === category.id ? (
                // Edit Form
                <div>
                  <div className="flex items-center mb-4">
                    <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                    <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                      Edit Category
                    </h4>
                  </div>
                  <CategoryForm
                    category={category}
                    onSave={handleUpdateCategory}
                    onCancel={() => setEditingCategory(null)}
                    isLoading={updateCategory.isPending}
                  />
                </div>
              ) : (
                // Category Display
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"
                      style={{ backgroundColor: `#${category.color_hex}` }}
                      aria-label="Category color"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {category.name}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({getUsageCount(category.id)} tasks)
                        </span>
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      title="Edit category"
                      aria-label="Edit category"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingCategory(category)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete category"
                      aria-label="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
