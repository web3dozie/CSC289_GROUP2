import React, { useState } from 'react'
import { X, CheckCircle, BookOpen, MessageSquare } from 'lucide-react'
import { useCreateJournalEntry } from '../../lib/hooks'
import type { Task } from '../../lib/api'

interface CompletionNotesModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task
  onComplete: (notes?: string, createJournalEntry?: boolean) => void
  isCompleting?: boolean
}

export const CompletionNotesModal: React.FC<CompletionNotesModalProps> = ({
  isOpen,
  onClose,
  task,
  onComplete,
  isCompleting = false
}) => {
  const [notes, setNotes] = useState('')
  const [createJournalEntry, setCreateJournalEntry] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createJournalEntryMutation = useCreateJournalEntry()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // If user wants to create a journal entry and has notes
      if (createJournalEntry && notes.trim()) {
        const today = new Date().toISOString().split('T')[0]
        const journalContent = `Completed task: "${task.title}"\n\n${notes.trim()}`

        await createJournalEntryMutation.mutateAsync({
          entry_date: today,
          content: journalContent
        })
      }

      // Complete the task
      onComplete(notes.trim() || undefined, createJournalEntry)
      onClose()
    } catch (error) {
      console.error('Failed to complete task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    onComplete()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Task Completed!</h2>
              <p className="text-sm text-gray-600">Great job on completing "{task.title}"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Completion Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Completion Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you learn? Any challenges? How did it go?"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              These notes help you reflect on your progress and build better habits.
            </p>
          </div>

          {/* Journal Integration */}
          <div className="flex items-start space-x-3">
            <input
              id="createJournalEntry"
              type="checkbox"
              checked={createJournalEntry}
              onChange={(e) => setCreateJournalEntry(e.target.checked)}
              className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <div className="flex-1">
              <label htmlFor="createJournalEntry" className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                <BookOpen className="w-4 h-4 mr-1" />
                Add to Journal
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Create a journal entry with your completion notes for today's reflection.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={isSubmitting || isCompleting}
            >
              Skip Notes
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompleting}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors flex items-center"
            >
              {isSubmitting || isCompleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}