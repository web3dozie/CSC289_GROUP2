import React, { useState, useEffect } from 'react'
import { TimerDisplay } from '../timer/TimerDisplay'
import { TimerControls } from '../timer/TimerControls'
import { TaskSelector } from '../timer/TaskSelector'
import { usePomodoroTimer } from '../../lib/hooks/timer'
import { useSettings } from '../../lib/hooks'
import { useAuth } from '../../contexts/AuthContext'

export const PomodoroTimer: React.FC = () => {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [showCompletionAlert, setShowCompletionAlert] = useState(false)

  const { isAuthenticated } = useAuth()
  const { data: settings } = useSettings(isAuthenticated)
  const {
    timeLeft,
    totalTime,
    session,
    status,
    completedSessions,
    start,
    pause,
    stop,
    skip,
    reset
  } = usePomodoroTimer()

  // Handle session completion
  useEffect(() => {
    if (status === 'completed') {
      // Show visual alert
      setShowCompletionAlert(true)

      // Play audio alert if supported
      if ('Audio' in window) {
        try {
          const audio = new Audio('/notification.mp3') // You might want to add a notification sound file
          audio.play().catch(() => {
            // Fallback: use browser notification or just visual
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(session === 'work' ? 'Work Session Complete!' : 'Break Time Over!', {
                body: session === 'work' ? 'Time for a break!' : 'Back to work!',
                icon: '/taskline-icon.svg'
              })
            }
          })
        } catch {
          // Audio not supported or file not found
        }
      }

      // Request notification permission if needed
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }

      // Auto-hide alert after 5 seconds
      const timeout = setTimeout(() => {
        setShowCompletionAlert(false)
      }, 5000)

      return () => clearTimeout(timeout)
    }
  }, [status, session])

  // Check if timer is enabled in settings
  if (settings && !settings.timer_enabled) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Timer Disabled
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The Pomodoro timer is currently disabled in your settings.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enable it in Settings to start using the timer.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pomodoro Timer</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Focus on your tasks with timed work sessions and breaks
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed Sessions</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {completedSessions}
            </p>
          </div>
        </div>
      </div>

      {/* Completion Alert */}
      {showCompletionAlert && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                {session === 'work' ? 'Work Session Complete!' : 'Break Time Over!'}
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                {session === 'work' ? 'Great job! Take a well-deserved break.' : 'Time to get back to work!'}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setShowCompletionAlert(false)}
                className="inline-flex rounded-md bg-green-50 dark:bg-green-900/20 p-1.5 text-green-500 hover:bg-green-100 dark:hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <TimerDisplay
              timeLeft={timeLeft}
              totalTime={totalTime}
              isWorkSession={session === 'work'}
              isRunning={status === 'running'}
            />

            <div className="mt-6">
              <TimerControls
                isRunning={status === 'running'}
                isPaused={status === 'paused'}
                onStart={start}
                onPause={pause}
                onStop={stop}
                onSkip={skip}
              />
            </div>

            {/* Status and Actions */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Status: <span className="font-medium capitalize">{status}</span>
              </div>
              <button
                onClick={reset}
                className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
              >
                Reset Counter
              </button>
            </div>
          </div>
        </div>

        {/* Task Selection Section */}
        <div className="lg:col-span-1">
          <TaskSelector
            selectedTaskId={selectedTaskId}
            onTaskSelect={setSelectedTaskId}
          />

          {/* Session Info */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Session Info
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Current Session:</span>
                <span className={`font-medium ${session === 'work' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {session === 'work' ? 'Work (25 min)' : 'Break (5 min)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Completed Today:</span>
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  {completedSessions} sessions
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Focus Time:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {Math.floor(completedSessions * 25)} minutes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}