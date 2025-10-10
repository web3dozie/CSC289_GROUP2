import React, { useState } from 'react'
import { Settings as SettingsIcon, Palette, Lock, Timer, Cpu, Key, Save, Eye, EyeOff } from 'lucide-react'
import {
  useSettings,
  useUpdateSettings,
  useAuthChangePin
} from '../../lib/hooks'
import { useTheme } from '../../contexts/ThemeContext'
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

  // Local state for form inputs
  const [themeForm, setThemeForm] = useState(theme)
  const [autoLockMinutes, setAutoLockMinutes] = useState(settings?.auto_lock_minutes?.toString() || '30')
  const [notesEnabled, setNotesEnabled] = useState(settings?.notes_enabled || false)
  const [timerEnabled, setTimerEnabled] = useState(settings?.timer_enabled || false)
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

  // Update local state when settings load
  React.useEffect(() => {
    if (settings) {
      setThemeForm(settings.theme as 'light' | 'dark' | 'auto')
      setAutoLockMinutes(settings.auto_lock_minutes.toString())
      setNotesEnabled(settings.notes_enabled)
      setTimerEnabled(settings.timer_enabled)
      setAiApiUrl(settings.ai_api_url || '')
      setAiModel(settings.ai_model || '')
      setAiApiKey(settings.ai_api_key || '')
    }
  }, [settings])

  // Update form when theme context changes
  React.useEffect(() => {
    setThemeForm(theme)
  }, [theme])

  const handleSaveSettings = async () => {
    const updates: Partial<UserSettings> = {
      theme: themeForm,
      auto_lock_minutes: parseInt(autoLockMinutes),
      notes_enabled: notesEnabled,
      timer_enabled: timerEnabled,
      ai_api_url: aiApiUrl || undefined,
      ai_model: aiModel || undefined,
      ai_api_key: aiApiKey || undefined,
    }

    await updateSettings.mutateAsync(updates)
    // Update theme context immediately for UI feedback
    setThemeContext(themeForm)
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
                  <label key={option.value} className="relative">
                    <input
                      type="radio"
                      name="theme"
                      value={option.value}
                      checked={themeForm === option.value}
                      onChange={(e) => {
                        const newTheme = e.target.value as 'light' | 'dark' | 'auto'
                        setThemeForm(newTheme)
                        setThemeContext(newTheme) // Apply immediately
                      }}
                      className="sr-only"
                    />
                    <div className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      themeForm === option.value
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}>
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
          description="Manage your account security and privacy"
          icon={Lock}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Auto-lock (minutes)
              </label>
              <select
                value={autoLockMinutes}
                onChange={(e) => setAutoLockMinutes(e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="240">4 hours</option>
                <option value="0">Never</option>
              </select>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowPinChange(!showPinChange)}
                className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Key className="w-4 h-4 mr-2" />
                Change PIN
              </button>

              {showPinChange && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPin ? 'text' : 'password'}
                        value={currentPin}
                        onChange={(e) => setCurrentPin(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                      className="px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {changePin.isPending ? 'Changing...' : 'Change PIN'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SettingSection>

        {/* Features Settings */}
        <SettingSection
          title="Features"
          description="Enable or disable Task Line features"
          icon={Timer}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Task Notes</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Add detailed notes to your tasks</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notesEnabled}
                  onChange={(e) => setNotesEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Pomodoro Timer</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Use built-in timer for focused work sessions</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={timerEnabled}
                  onChange={(e) => setTimerEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </SettingSection>

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

        {/* Save Button */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={updateSettings.isPending}
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}