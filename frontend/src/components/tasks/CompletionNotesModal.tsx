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
  const modalRef = React.useRef<HTMLDivElement>(null)
  const firstFocusableRef = React.useRef<HTMLButtonElement>(null)

  // Focus management
  React.useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      const previousFocus = document.activeElement as HTMLElement

      // Focus the first focusable element in the modal
      if (firstFocusableRef.current) {
        firstFocusableRef.current.focus()
      }

      // Restore focus when modal closes
      return () => {
        if (previousFocus && previousFocus.focus) {
          previousFocus.focus()
        }
      }
    }
  }, [isOpen])

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Trap focus within modal
  React.useEffect(() => {
    if (!isOpen) return

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const modal = modalRef.current
      if (!modal) return

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isOpen])

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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-modal-title"
      aria-describedby="completion-modal-description"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
        role="document"
      >
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-600 mr-3" aria-hidden="true" />
            <div>
              <h2
                id="completion-modal-title"
                className="text-lg font-semibold text-gray-900"
              >
                Task Completed!
              </h2>
              <p
                id="completion-modal-description"
                className="text-sm text-gray-600"
              >
                Great job on completing "{task.title}"
              </p>
            </div>
          </div>
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 p-1 rounded"
            aria-label="Close completion modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Completion Notes */}
          <div>
            <label
              htmlFor="completion-notes"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <MessageSquare className="w-4 h-4 inline mr-1" aria-hidden="true" />
              Completion Notes (Optional)
            </label>
            <textarea
              id="completion-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you learn? Any challenges? How did it go?"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              aria-describedby="notes-help"
            />
            <p
              id="notes-help"
              className="text-xs text-gray-500 mt-1"
            >
              These notes help you reflect on your progress and build better habits.
            </p>
          </div>

          {/* Journal Integration */}
          <fieldset className="flex items-start space-x-3">
            <legend className="sr-only">Journal Integration Options</legend>
            <input
              id="create-journal-entry"
              type="checkbox"
              checked={createJournalEntry}
              onChange={(e) => setCreateJournalEntry(e.target.checked)}
              className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              aria-describedby="journal-help"
            />
            <div className="flex-1">
              <label
                htmlFor="create-journal-entry"
                className="flex items-center text-sm font-medium text-gray-700 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 mr-1" aria-hidden="true" />
                Add to Journal
              </label>
              <p
                id="journal-help"
                className="text-xs text-gray-500 mt-1"
              >
                Create a journal entry with your completion notes for today's reflection.
              </p>
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md transition-colors"
              disabled={isSubmitting || isCompleting}
              aria-describedby="skip-help"
            >
              Skip Notes
            </button>
            <span id="skip-help" className="sr-only">
              Skip adding notes and complete the task immediately
            </span>
            <button
              type="submit"
              disabled={isSubmitting || isCompleting}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-md transition-colors flex items-center"
              aria-describedby="complete-help"
            >
              {isSubmitting || isCompleting ? (
                <>
                  <div
                    className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                    aria-hidden="true"
                  ></div>
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                  Complete Task
                </>
              )}
            </button>
            <span id="complete-help" className="sr-only">
              Complete the task with your notes and journal entry preferences
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}