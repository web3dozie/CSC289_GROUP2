import React from 'react'

interface TimerDisplayProps {
  timeLeft: number // in seconds
  totalTime: number // in seconds
  isWorkSession: boolean
  isRunning: boolean
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeLeft,
  totalTime,
  isWorkSession,
  isRunning
}) => {
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = ((totalTime - timeLeft) / totalTime) * 100

  // Calculate the stroke dash array for the circular progress
  const radius = 120
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Circular Progress */}
      <div className="relative w-64 h-64 mb-6">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 256 256">
          <circle
            cx="128"
            cy="128"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="128"
            cy="128"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-linear ${
              isWorkSession
                ? 'text-red-500 dark:text-red-400'
                : 'text-green-500 dark:text-green-400'
            }`}
          />
        </svg>

        {/* Time display in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-5xl font-bold mb-2 ${
              isWorkSession
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
            }`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className={`text-lg font-medium ${
              isRunning
                ? 'text-gray-900 dark:text-gray-100'
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {isWorkSession ? 'Work Session' : 'Break Time'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}