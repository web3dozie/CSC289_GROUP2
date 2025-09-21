import React, { useState } from 'react'
import { BookOpen, TrendingUp, Calendar, Plus, Edit, X } from 'lucide-react'
import {
  useJournal,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDailySummary,
  useWeeklySummary,
  useInsights
} from '../../lib/hooks'
import type { JournalEntry } from '../../lib/api'

interface JournalEntryCardProps {
  entry: JournalEntry
  onEdit: (entry: JournalEntry) => void
}

const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ entry, onEdit }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="w-4 h-4 mr-1" />
          {new Date(entry.entry_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
        <button
          onClick={() => onEdit(entry)}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>
      <p className="text-gray-900 whitespace-pre-wrap">{entry.content}</p>
      {entry.updated_on && (
        <p className="text-xs text-gray-400 mt-2">
          Updated {new Date(entry.updated_on).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}

interface JournalEditorProps {
  entry?: JournalEntry
  onSave: (date: string, content: string) => void
  onCancel: () => void
}

const JournalEditor: React.FC<JournalEditorProps> = ({ entry, onSave, onCancel }) => {
  const [date, setDate] = useState(
    entry ? entry.entry_date : new Date().toISOString().split('T')[0]
  )
  const [content, setContent] = useState(entry?.content || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (!content.trim()) return

    setIsLoading(true)
    try {
      await onSave(date, content.trim())
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {entry ? 'Edit Journal Entry' : 'New Journal Entry'}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="entry-date" className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            id="entry-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label htmlFor="entry-content" className="block text-sm font-medium text-gray-700 mb-1">
            Journal Entry
          </label>
          <textarea
            id="entry-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write about your day, accomplishments, challenges, or reflections..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim() || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>
    </div>
  )
}

export const TaskReview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'journal' | 'daily' | 'weekly' | 'insights'>('journal')
  const [showJournalEditor, setShowJournalEditor] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)

  const { data: journal = [], isLoading: journalLoading } = useJournal()
  const { data: dailySummary, isLoading: dailyLoading } = useDailySummary()
  const { data: weeklySummary, isLoading: weeklyLoading } = useWeeklySummary()
  const { data: insights, isLoading: insightsLoading } = useInsights()

  const createJournalEntry = useCreateJournalEntry()
  const updateJournalEntry = useUpdateJournalEntry()

  const handleCreateJournalEntry = async (date: string, content: string) => {
    await createJournalEntry.mutateAsync({ entry_date: date, content })
    setShowJournalEditor(false)
  }

  const handleUpdateJournalEntry = async (_date: string, content: string) => {
    if (!editingEntry) return
    await updateJournalEntry.mutateAsync({ id: editingEntry.id, data: { content } })
    setEditingEntry(null)
  }

  const handleEditJournalEntry = (entry: JournalEntry) => {
    setEditingEntry(entry)
  }

  const tabs = [
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'daily', label: 'Daily Summary', icon: Calendar },
    { id: 'weekly', label: 'Weekly Summary', icon: TrendingUp },
    { id: 'insights', label: 'Insights', icon: TrendingUp }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review & Reflect</h1>
            <p className="text-gray-600 mt-1">
              Track your progress, maintain your journal, and gain insights into your productivity
            </p>
          </div>
          {activeTab === 'journal' && (
            <button
              onClick={() => setShowJournalEditor(true)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Entry
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Journal Tab */}
          {activeTab === 'journal' && (
            <div className="space-y-6">
              {showJournalEditor && (
                <JournalEditor
                  onSave={handleCreateJournalEntry}
                  onCancel={() => setShowJournalEditor(false)}
                />
              )}

              {editingEntry && (
                <JournalEditor
                  entry={editingEntry}
                  onSave={handleUpdateJournalEntry}
                  onCancel={() => setEditingEntry(null)}
                />
              )}

              {journalLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : journal.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No journal entries yet</h3>
                  <p className="text-gray-500 mb-4">Start reflecting on your day by creating your first journal entry.</p>
                  <button
                    onClick={() => setShowJournalEditor(true)}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Write First Entry
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {journal.map(entry => (
                    <JournalEntryCard
                      key={entry.id}
                      entry={entry}
                      onEdit={handleEditJournalEntry}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Daily Summary Tab */}
          {activeTab === 'daily' && (
            <div>
              {dailyLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : dailySummary ? (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-900">
                    {typeof dailySummary === 'string' ? dailySummary : JSON.stringify(dailySummary, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No daily summary available</p>
              )}
            </div>
          )}

          {/* Weekly Summary Tab */}
          {activeTab === 'weekly' && (
            <div>
              {weeklyLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : weeklySummary ? (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-900">
                    {typeof weeklySummary === 'string' ? weeklySummary : JSON.stringify(weeklySummary, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No weekly summary available</p>
              )}
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div>
              {insightsLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : insights ? (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-900">
                    {typeof insights === 'string' ? insights : JSON.stringify(insights, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No insights available</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}