import React, { useState } from 'react'
import { BookOpen, TrendingUp, Calendar, Plus, Edit, X, BarChart3, Target, CheckCircle, Clock, AlertCircle, Archive } from 'lucide-react'
import {
  useJournal,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDailySummary,
  useWeeklySummary,
  useInsights,
  useArchivedTasks,
  useUpdateTask,
  useDeleteTask
} from '../../lib/hooks'
import type { JournalEntry, Task } from '../../lib/api'
import { DeleteConfirmation } from '../tasks'

// Simple Chart Components
interface BarChartProps {
  data: { label: string; value: number; color?: string }[]
  title?: string
}

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>}
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-24 text-sm text-gray-600 dark:text-gray-400 truncate">{item.label}</div>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className={`h-4 rounded-full ${item.color || 'bg-purple-500'}`}
                style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="w-8 text-sm text-gray-600 dark:text-gray-400 text-right">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: string
  change?: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, change }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {change && (
            <p className={`text-sm ${change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}

interface JournalEntryCardProps {
  entry: JournalEntry
  onEdit: (entry: JournalEntry) => void
}

const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ entry, onEdit }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
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
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>
      <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{entry.content}</p>
      {entry.updated_on && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
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
    <div className="bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {entry ? 'Edit Journal Entry' : 'New Journal Entry'}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="entry-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
          <label htmlFor="entry-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
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
  const [activeTab, setActiveTab] = useState<'journal' | 'daily' | 'weekly' | 'insights' | 'archived'>('journal')
  const [showJournalEditor, setShowJournalEditor] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [deletingArchivedTask, setDeletingArchivedTask] = useState<Task | null>(null)

  const { data: journal = [], isLoading: journalLoading } = useJournal()
  const { data: dailySummary, isLoading: dailyLoading } = useDailySummary()
  const { data: weeklySummary, isLoading: weeklyLoading } = useWeeklySummary()
  const { data: insights, isLoading: insightsLoading } = useInsights()
  const { data: archivedTasks = [], isLoading: archivedLoading } = useArchivedTasks()

  const createJournalEntry = useCreateJournalEntry()
  const updateJournalEntry = useUpdateJournalEntry()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

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

  const handleRestoreTask = async (task: Task) => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: { archived: false }
      })
    } catch (error) {
      console.error('Failed to restore task:', error)
    }
  }

  const handleDeleteArchivedTask = (task: Task) => {
    setDeletingArchivedTask(task)
  }

  const confirmDeleteArchivedTask = async () => {
    if (!deletingArchivedTask) return

    try {
      await deleteTask.mutateAsync(deletingArchivedTask.id)
      setDeletingArchivedTask(null)
    } catch (error) {
      console.error('Failed to delete archived task:', error)
    }
  }

  const tabs = [
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'daily', label: 'Daily Summary', icon: Calendar },
    { id: 'weekly', label: 'Weekly Summary', icon: BarChart3 },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
    { id: 'archived', label: 'Archived Tasks', icon: Archive }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Review & Reflect</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
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
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
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
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : journal.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No journal entries yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Start reflecting on your day by creating your first journal entry.</p>
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
            <div className="space-y-6">
              {dailyLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ))}
                  </div>
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ) : dailySummary ? (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                      title="Tasks Completed"
                      value={dailySummary.completed_tasks || 0}
                      icon={CheckCircle}
                      color="bg-green-500"
                      change={dailySummary.completed_change ? `+${dailySummary.completed_change}` : undefined}
                    />
                    <StatCard
                      title="Tasks Created"
                      value={dailySummary.created_tasks || 0}
                      icon={Plus}
                      color="bg-blue-500"
                    />
                    <StatCard
                      title="Overdue Tasks"
                      value={dailySummary.overdue_tasks || 0}
                      icon={AlertCircle}
                      color="bg-red-500"
                    />
                    <StatCard
                      title="Time Spent"
                      value={`${dailySummary.time_spent || 0}m`}
                      icon={Clock}
                      color="bg-purple-500"
                    />
                  </div>

                  {/* Productivity Chart */}
                  <BarChart
                    title="Daily Productivity"
                    data={[
                      { label: 'Completed', value: dailySummary.completed_tasks || 0, color: 'bg-green-500' },
                      { label: 'In Progress', value: dailySummary.in_progress_tasks || 0, color: 'bg-yellow-500' },
                      { label: 'Overdue', value: dailySummary.overdue_tasks || 0, color: 'bg-red-500' },
                    ]}
                  />

                  {/* Category Breakdown */}
                  {dailySummary.categories && Object.keys(dailySummary.categories).length > 0 && (
                    <BarChart
                      title="Tasks by Category"
                      data={Object.entries(dailySummary.categories).map(([category, count]) => ({
                        label: category,
                        value: count as number,
                        color: 'bg-purple-500'
                      }))}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No daily summary available</h3>
                  <p className="text-gray-500 dark:text-gray-400">Complete some tasks to see your daily productivity insights.</p>
                </div>
              )}
            </div>
          )}

          {/* Weekly Summary Tab */}
          {activeTab === 'weekly' && (
            <div className="space-y-6">
              {weeklyLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ))}
                  </div>
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ) : weeklySummary ? (
                <div className="space-y-6">
                  {/* Weekly Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                      title="Total Completed"
                      value={weeklySummary.total_completed || 0}
                      icon={CheckCircle}
                      color="bg-green-500"
                      change={weeklySummary.completion_trend ? `${weeklySummary.completion_trend > 0 ? '+' : ''}${weeklySummary.completion_trend}%` : undefined}
                    />
                    <StatCard
                      title="Average Daily"
                      value={weeklySummary.average_daily || 0}
                      icon={Target}
                      color="bg-blue-500"
                    />
                    <StatCard
                      title="Most Productive Day"
                      value={weeklySummary.most_productive_day || 'N/A'}
                      icon={TrendingUp}
                      color="bg-purple-500"
                    />
                    <StatCard
                      title="Total Time"
                      value={`${weeklySummary.total_time || 0}h`}
                      icon={Clock}
                      color="bg-indigo-500"
                    />
                  </div>

                  {/* Weekly Progress Chart */}
                  <BarChart
                    title="Tasks Completed by Day"
                    data={weeklySummary.daily_breakdown ? weeklySummary.daily_breakdown.map((dayData: any) => ({
                      label: dayData.day,
                      value: dayData.count,
                      color: 'bg-green-500'
                    })) : []}
                  />

                  {/* Productivity Trends */}
                  {weeklySummary.productivity_trend && (
                    <BarChart
                      title="Productivity Trend"
                      data={weeklySummary.productivity_trend.map((item: any, index: number) => ({
                        label: `Week ${index + 1}`,
                        value: item.value,
                        color: item.trend === 'up' ? 'bg-green-500' : item.trend === 'down' ? 'bg-red-500' : 'bg-gray-500'
                      }))}
                    />
                  )}

                  {/* Category Performance */}
                  {weeklySummary.category_performance && Object.keys(weeklySummary.category_performance).length > 0 && (
                    <BarChart
                      title="Performance by Category"
                      data={Object.entries(weeklySummary.category_performance).map(([category, performance]) => ({
                        label: category,
                        value: (performance as any).completed || 0,
                        color: 'bg-purple-500'
                      }))}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <BarChart3 className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No weekly summary available</h3>
                  <p className="text-gray-500 dark:text-gray-400">Complete tasks throughout the week to see your weekly analytics.</p>
                </div>
              )}
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              {insightsLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ))}
                  </div>
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ) : insights ? (
                <div className="space-y-6">
                  {/* Key Insights Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Productivity Score</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{insights.productivity_score || 0}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{insights.completion_rate || 0}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                          <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Task Time</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{insights.avg_task_time || 0}m</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Trends */}
                  {insights.performance_trends && (
                    <BarChart
                      title="Performance Trends"
                      data={insights.performance_trends.map((trend: any, _index: number) => ({
                        label: trend.period,
                        value: trend.score,
                        color: trend.score > 70 ? 'bg-green-500' : trend.score > 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }))}
                    />
                  )}

                  {/* Strengths & Areas for Improvement */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {insights.strengths && (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" />
                          Strengths
                        </h3>
                        <ul className="space-y-2">
                          {insights.strengths.map((strength: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {insights.improvements && (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                          <AlertCircle className="w-5 h-5 text-orange-500 dark:text-orange-400 mr-2" />
                          Areas for Improvement
                        </h3>
                        <ul className="space-y-2">
                          {insights.improvements.map((improvement: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <AlertCircle className="w-4 h-4 text-orange-500 dark:text-orange-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Recommendations */}
                  {insights.recommendations && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                        <Target className="w-5 h-5 text-purple-500 dark:text-purple-400 mr-2" />
                        Recommendations
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insights.recommendations.map((rec: any, index: number) => (
                          <div key={index} className="p-3 bg-purple-50 dark:bg-purple-900 rounded-lg border border-purple-200 dark:border-purple-700">
                            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1">{rec.title}</h4>
                            <p className="text-sm text-purple-700 dark:text-purple-300">{rec.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <TrendingUp className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No insights available</h3>
                  <p className="text-gray-500 dark:text-gray-400">Complete more tasks and use the journal to unlock productivity insights.</p>
                </div>
              )}
            </div>
          )}

          {/* Archived Tasks Tab */}
          {activeTab === 'archived' && (
            <div className="space-y-6">
              {archivedLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              ) : archivedTasks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Archive className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No archived tasks</h3>
                  <p className="text-gray-500 dark:text-gray-400">Completed tasks will appear here after you archive them.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Archived Tasks ({archivedTasks.length})
                    </h3>
                    <div className="space-y-3">
                      {archivedTasks.map(task => (
                        <div key={task.id} className="border border-gray-100 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">{task.title}</h4>
                              {task.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {task.category && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                                    {task.category}
                                  </span>
                                )}
                                {task.priority && <span>High Priority</span>}
                                {task.due_date && (
                                  <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                                )}
                                <span>Completed: {new Date(task.updated_on || task.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <button
                              onClick={() => handleRestoreTask(task)}
                              disabled={updateTask.isPending}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
                            >
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              Restore
                            </button>
                            <button
                              onClick={() => handleDeleteArchivedTask(task)}
                              disabled={deleteTask.isPending}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
                            >
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={!!deletingArchivedTask}
        onClose={() => setDeletingArchivedTask(null)}
        onConfirm={confirmDeleteArchivedTask}
        title="Permanently Delete Task"
        message={`This will PERMANENTLY delete "${deletingArchivedTask?.title}" from the database. This action CANNOT be undone.`}
        isLoading={deleteTask.isPending}
      />
    </div>
  )
}