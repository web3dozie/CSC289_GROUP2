import React, { useState } from 'react'
import { Settings as SettingsIcon, Palette, Lock, Cpu, Key, Save, Eye, EyeOff, HelpCircle, Download, Upload, ShieldAlert, AlertTriangle } from 'lucide-react'
import {
  useSettings,
  useUpdateSettings,
  useAuthChangePin,
  useExportData,
  useImportData,
  useAccountDeletionPreview,
  useDeleteAccount
} from '../../lib/hooks'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useTutorial } from '../../contexts/TutorialContext'
import { ImportConfirmation } from '../tasks'
import { CategoriesManagement } from '../settings/CategoriesManagement'
import type { UserSettings } from '../../lib/api'

interface SettingSectionProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, description, icon: Icon, children }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
    <div className="flex items-start mb-4">
      <Icon className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-3 mt-0.5" />
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
      </div>
    </div>
    <div className="ml-9">
      {children}
    </div>
  </div>
)

export const Settings: React.FC = () => {
  const { data: settings, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()
  const changePin = useAuthChangePin()
  const { theme, setTheme: setThemeContext } = useTheme()
  const { startTutorial } = useTutorial()
  const { lock, user, changeUsername } = useAuth()
  const exportData = useExportData()
  const importData = useImportData()
  const { refetch: fetchDeletionPreview } = useAccountDeletionPreview()
  const deleteAccount = useDeleteAccount()

  // Local state for form inputs
  const [themeForm, setThemeForm] = useState(theme)
  const [autoLockMinutes, setAutoLockMinutes] = useState(settings?.auto_lock_minutes?.toString() || '30')
  // Feature toggles (removed from UI): notes_enabled and timer_enabled are managed server-side but UI removed per user request
  const [aiApiUrl, setAiApiUrl] = useState(settings?.ai_api_url || '')
  const [aiModel, setAiModel] = useState(settings?.ai_model || '')
  const [aiApiKey, setAiApiKey] = useState(settings?.ai_api_key || '')

  // PIN change state
  const [showPinChange, setShowPinChange] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [showCurrentPin, setShowCurrentPin] = useState(false)
  const [showNewPin, setShowNewPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)

  // Username change state
  const [showUsernameChange, setShowUsernameChange] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [usernameVerifyPin, setUsernameVerifyPin] = useState('')
  const [showUsernameVerifyPin, setShowUsernameVerifyPin] = useState(false)

  // Import state
  const [showImportConfirmation, setShowImportConfirmation] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importDataSummary, setImportDataSummary] = useState<any>(null)

  // Account deletion state
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deletePin, setDeletePin] = useState('')
  const [deleteAgreed, setDeleteAgreed] = useState(false)
  const [deletionPreview, setDeletionPreview] = useState<any>(null)

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Update local state when settings load
  React.useEffect(() => {
    if (settings) {
      setThemeForm(settings.theme as 'light' | 'dark' | 'auto')
      setAutoLockMinutes(settings.auto_lock_minutes.toString())
      // Feature toggles updated from backend (no UI)
      setAiApiUrl(settings.ai_api_url || '')
      setAiModel(settings.ai_model || '')
      setAiApiKey(settings.ai_api_key || '')
    }
  }, [settings])

  // Track if settings have unsaved changes
  React.useEffect(() => {
    if (settings) {
      const hasChanges = 
        themeForm !== settings.theme ||
        autoLockMinutes !== settings.auto_lock_minutes.toString() ||
        false ||
        aiApiUrl !== (settings.ai_api_url || '') ||
        aiModel !== (settings.ai_model || '') ||
        aiApiKey !== (settings.ai_api_key || '')
      
      setHasUnsavedChanges(hasChanges)
    }
  }, [themeForm, autoLockMinutes, aiApiUrl, aiModel, aiApiKey, settings])

  const handleSaveSettings = async () => {
    const updates: Partial<UserSettings> = {
      theme: themeForm,
      auto_lock_minutes: parseInt(autoLockMinutes),
      // notes_enabled and timer_enabled intentionally omitted from UI updates
      ai_api_url: aiApiUrl || undefined,
      ai_model: aiModel || undefined,
      ai_api_key: aiApiKey || undefined,
    }

    console.log('Settings: Saving settings with theme:', themeForm)

    try {
      const result = await updateSettings.mutateAsync(updates)
      console.log('Settings: Save result:', result)

      // Ensure theme context is synced after save
      setThemeContext(themeForm)
      console.log('Settings: Called setThemeContext with:', themeForm)
      
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings. Please try again.')
    }
  }
  const handleChangePin = async () => {
    if (newPin !== confirmPin) {
      alert('New PINs do not match')
      return
    }

    if (newPin.length < 4) {
      alert('PIN must be at least 4 characters')
      return
    }

    try {
      await changePin.mutateAsync({ current_pin: currentPin, new_pin: newPin })
      setShowPinChange(false)
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
      alert('PIN changed successfully')
    } catch (error) {
      alert('Failed to change PIN. Please check your current PIN.')
    }
  }

  const handleChangeUsername = async () => {
    if (!newUsername.trim()) {
      alert('Username cannot be empty')
      return
    }

    if (newUsername.length > 20) {
      alert('Username must be 20 characters or less')
      return
    }

    if (!usernameVerifyPin) {
      alert('Please enter your PIN to verify')
      return
    }

    try {
      await changeUsername({ newUsername: newUsername.trim(), pin: usernameVerifyPin })
      setShowUsernameChange(false)
      setNewUsername('')
      setUsernameVerifyPin('')
      alert('Username changed successfully')
    } catch (error) {
      alert('Failed to change username. Please check your PIN and try again.')
    }
  }

  const handleExportData = async () => {
    try {
      await exportData.mutateAsync()
      // No success message - browser download manager provides feedback
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  const handleImportFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      alert('Please select a valid JSON file.')
      return
    }

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Validate the data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid file format')
      }

      // Extract summary information
      const summary = {
        tasks: data.tasks?.length || 0,
        journalEntries: data.journal_entries?.length || 0,
        settings: !!data.settings
      }

      setImportFile(file)
      setImportDataSummary(summary)
      setShowImportConfirmation(true)
    } catch (error) {
      console.error('Error reading file:', error)
      alert('Invalid file format. Please select a valid TaskLine export file.')
    }

    // Reset the input
    event.target.value = ''
  }

  const handleImportConfirm = async () => {
    if (!importFile) return

    try {
      const text = await importFile.text()
      const data = JSON.parse(text)

      await importData.mutateAsync(data)
      
      setShowImportConfirmation(false)
      setImportFile(null)
      setImportDataSummary(null)
      
      alert('Data imported successfully!')
    } catch (error) {
      console.error('Import failed:', error)
      alert('Failed to import data. Please check the file and try again.')
    }
  }

  const handleShowDeleteAccount = async () => {
    if (!showDeleteAccount) {
      // Fetch preview when opening the section
      try {
        const result = await fetchDeletionPreview()
        if (result.data) {
          setDeletionPreview(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch deletion preview:', error)
      }
    }
    setShowDeleteAccount(!showDeleteAccount)
    // Reset form
    setDeleteConfirmation('')
    setDeletePin('')
    setDeleteAgreed(false)
  }

  const handleDeleteAccount = async () => {
    // Validate inputs
    if (deleteConfirmation !== 'DELETE') {
      alert('Please type DELETE to confirm')
      return
    }

    if (!deletePin) {
      alert('Please enter your PIN')
      return
    }

    if (!deleteAgreed) {
      alert('Please check the agreement checkbox')
      return
    }

    // Final confirmation
    if (!confirm('Are you absolutely sure? This action CANNOT be undone. All your data will be permanently deleted.')) {
      return
    }

    try {
      await deleteAccount.mutateAsync({
        pin: deletePin,
        confirmation: deleteConfirmation
      })
      
      alert('Your account has been successfully deleted.')
      
      // Redirect to login/setup page
      window.location.href = '/'
    } catch (error: any) {
      console.error('Account deletion failed:', error)
      const message = error?.message || 'Failed to delete account. Please check your PIN and try again.'
      alert(message)
    }
  }

  const themeOptions = [
    { value: 'light', label: 'Light', description: 'Clean and bright interface' },
    { value: 'dark', label: 'Dark', description: 'Easy on the eyes in low light' },
    { value: 'auto', label: 'Auto', description: 'Follows system preference' }
  ]

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="animate-pulse space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="flex items-center">
          <SettingsIcon className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Customize your Task Line experience
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Appearance Settings */}
        <SettingSection
          title="Appearance"
          description="Customize how Task Line looks and feels"
          icon={Palette}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map(option => (
                  <label key={option.value} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value={option.value}
                      checked={themeForm === option.value}
                      onChange={(e) => {
                        console.log('Radio onChange triggered:', e.target.value)
                        const newTheme = e.target.value as 'light' | 'dark' | 'auto'
                        setThemeForm(newTheme)
                        setThemeContext(newTheme) // Apply immediately
                      }}
                      className="sr-only"
                    />
                    <div 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        themeForm === option.value
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                      onClick={() => {
                        console.log('Div clicked:', option.value)
                        const newTheme = option.value as 'light' | 'dark' | 'auto'
                        console.log('Setting theme to:', newTheme)
                        setThemeForm(newTheme)
                        setThemeContext(newTheme) // Apply immediately
                      }}
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{option.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </SettingSection>

        {/* Security Settings */}
        <SettingSection
          title="Security"
          description="Manage your account security and login settings"
          icon={Lock}
        >
          <div className="space-y-4">
            {/* Current Username Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Username
              </label>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <span className="text-gray-900 dark:text-gray-100 font-medium">{user?.username}</span>
              </div>
            </div>

            {/* Change Username and PIN Section */}
            <div className="pt-2 space-y-3">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => setShowUsernameChange(!showUsernameChange)}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Change Username
                </button>

                <button
                  onClick={() => setShowPinChange(!showPinChange)}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Change PIN
                </button>
              </div>

              {showUsernameChange && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      New Username
                    </label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Enter new username"
                      maxLength={20}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Maximum 20 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Verify with PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showUsernameVerifyPin ? 'text' : 'password'}
                        value={usernameVerifyPin}
                        onChange={(e) => setUsernameVerifyPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        placeholder="Enter your PIN"
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowUsernameVerifyPin(!showUsernameVerifyPin)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showUsernameVerifyPin ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowUsernameChange(false)
                        setNewUsername('')
                        setUsernameVerifyPin('')
                      }}
                      className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChangeUsername}
                      disabled={!newUsername.trim() || !usernameVerifyPin}
                      className="px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Change Username
                    </button>
                  </div>
                </div>
              )}

              {showPinChange && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPin ? 'text' : 'password'}
                        value={currentPin}
                        onChange={(e) => setCurrentPin(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPin(!showCurrentPin)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showCurrentPin ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      New PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPin ? 'text' : 'password'}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPin(!showNewPin)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showNewPin ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirm New PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPin ? 'text' : 'password'}
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPin(!showConfirmPin)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPin ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowPinChange(false)
                        setCurrentPin('')
                        setNewPin('')
                        setConfirmPin('')
                      }}
                      className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChangePin}
                      disabled={!currentPin || !newPin || !confirmPin || changePin.isPending}
                      className="px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {changePin.isPending ? 'Changing...' : 'Change PIN'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Auto-lock Settings */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Auto-lock (minutes)
                </label>
                <select
                  value={autoLockMinutes}
                  onChange={(e) => setAutoLockMinutes(e.target.value)}
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="5">5 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="240">4 hours</option>
                  <option value="0">Never</option>
                </select>
              </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={lock}
                className="inline-flex items-center px-4 py-2 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-sm font-medium rounded-md hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
              >
                <ShieldAlert className="w-4 h-4 mr-2" />
                Test Lock Now
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Use "Test Lock Now" to immediately lock the app and test the auto-lock feature
              </p>
            </div>
            </div>
          </div>
        </SettingSection>

        {/* Features section removed as per request */}

        {/* Categories Management */}
        <SettingSection
          title="Task Categories"
          description="Create and manage categories to organize your tasks"
          icon={Palette}
        >
          <CategoriesManagement />
        </SettingSection>

        {/* AI Integration Settings */}
        {/* AI Integration Settings */}
        <SettingSection
          title="AI Integration"
          description="Configure AI assistant (OpenAI-compatible API)"
          icon={Cpu}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API URL
              </label>
              <input
                type="url"
                value={aiApiUrl}
                onChange={(e) => setAiApiUrl(e.target.value)}
                placeholder="https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                OpenAI-compatible chat completions endpoint (e.g., Gemini, OpenAI, Anthropic, etc.)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Model Name
              </label>
              <input
                type="text"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                placeholder="gemini-2.0-flash"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Model identifier (e.g., gemini-2.0-flash, gpt-4o-mini, claude-3-5-sonnet-20241022)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                placeholder="Your API key"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Your API key for authentication
              </p>
            </div>
          </div>
        </SettingSection>

        {/* Tutorial & Help */}
        <SettingSection
          title="Tutorial & Help"
          description="Learn how to use Task Line effectively"
          icon={HelpCircle}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Interactive Tutorial</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Learn the basics of creating, managing, and viewing tasks across all views
                </div>
              </div>
              <button
                onClick={startTutorial}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Start Tutorial
              </button>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-2">
                The tutorial will guide you through:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Creating and managing tasks in the List view</li>
                <li>Using the Kanban Board to track workflow</li>
                <li>Organizing tasks by due date in the Calendar</li>
                <li>Drag & drop functionality across views</li>
              </ul>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <a
                href="/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium"
              >
                View Full Documentation →
              </a>
            </div>
          </div>
        </SettingSection>

        {/* Data Management */}
        <SettingSection
          title="Data Management"
          description="Export and import your Task Line data"
          icon={Download}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Export Data</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Download all your tasks, journal entries, and settings as a JSON file
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportData}
                  disabled={exportData.isPending}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exportData.isPending ? 'Downloading...' : 'Download JSON'}
                </button>
                {/* Minimal addition: direct Markdown export */}
                <a
                  href="/api/export.md"
                  download="taskline_export.md"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Markdown
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Import Data</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Restore your data from a previously exported JSON file
                </div>
              </div>
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFileSelect}
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload JSON
                </label>
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-2">
                <strong>Important:</strong> Importing data will replace all your current data. Make sure to export first if you want to keep a backup.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Export creates a timestamped JSON file with all your data</li>
                <li>Import validates the file format before proceeding</li>
                <li>You'll see a confirmation dialog showing what will be imported</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>
          </div>
        </SettingSection>

        {/* Danger Zone - Account Deletion */}
        <SettingSection
          title="Danger Zone"
          description="Permanently delete your account and all data"
          icon={AlertTriangle}
        >
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-700">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">Delete Account</h4>
                  <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                    Once you delete your account, there is no going back. This action is permanent and cannot be undone.
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                    Before deleting, we recommend exporting your data using the "Data Management" section above.
                  </p>
                </div>
              </div>

              <button
                onClick={handleShowDeleteAccount}
                className="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                {showDeleteAccount ? 'Cancel Account Deletion' : 'Delete My Account'}
              </button>

              {showDeleteAccount && (
                <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-300 dark:border-red-600 space-y-4">
                  {deletionPreview && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        What will be deleted:
                      </h5>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <li>• Account: <strong>{deletionPreview.username}</strong></li>
                        <li>• Tasks: <strong>{deletionPreview.data_summary.tasks}</strong></li>
                        <li>• Journal Entries: <strong>{deletionPreview.data_summary.journal_entries}</strong></li>
                        <li>• Conversations: <strong>{deletionPreview.data_summary.conversations}</strong></li>
                        <li>• All settings and preferences</li>
                      </ul>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-3 font-medium">
                        {deletionPreview.warning}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">DELETE</span> to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="DELETE"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Enter your PIN
                    </label>
                    <input
                      type="password"
                      value={deletePin}
                      onChange={(e) => setDeletePin(e.target.value)}
                      placeholder="Enter your PIN"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  <div 
                    onClick={() => setDeleteAgreed(!deleteAgreed)}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center justify-center mt-0.5 h-5 w-5 min-w-5 border-2 border-gray-400 dark:border-gray-500 rounded cursor-pointer">
                      {deleteAgreed && (
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 select-none">
                      I understand that this action is permanent and cannot be undone. All my data will be deleted.
                    </span>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => {
                        setShowDeleteAccount(false)
                        setDeleteConfirmation('')
                        setDeletePin('')
                        setDeleteAgreed(false)
                      }}
                      className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmation !== 'DELETE' || !deletePin || !deleteAgreed || deleteAccount.isPending}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {deleteAccount.isPending ? 'Deleting Account...' : 'Permanently Delete Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SettingSection>

        {/* Save Button */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={updateSettings.isPending}
              className={`inline-flex items-center px-6 py-3 text-white text-sm font-medium rounded-md transition-colors ${
                hasUnsavedChanges 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              } disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateSettings.isPending ? 'Saving...' : hasUnsavedChanges ? 'Save Settings' : 'Settings Saved'}
            </button>
          </div>
        </div>
      </div>

      {/* Import Confirmation Modal */}
      <ImportConfirmation
        isOpen={showImportConfirmation}
        onClose={() => {
          setShowImportConfirmation(false)
          setImportFile(null)
          setImportDataSummary(null)
        }}
        onConfirm={handleImportConfirm}
        fileName={importFile?.name || ''}
        dataSummary={importDataSummary}
        isLoading={importData.isPending}
      />
    </div>
  )
}
