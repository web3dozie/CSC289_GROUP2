import React from 'react'
import { Play, Pause, Square, SkipForward } from 'lucide-react'

interface TimerControlsProps {
  isRunning: boolean
  isPaused: boolean
  onStart: () => void
  onPause: () => void
  onStop: () => void
  onSkip: () => void
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  isPaused,
  onStart,
  onPause,
  onStop,
  onSkip
}) => {
  return (
    <div className="flex items-center justify-center space-x-4">
      {/* Start/Pause Button */}
      {!isRunning || isPaused ? (
        <button
          onClick={onStart}
          className="flex items-center justify-center w-16 h-16 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          aria-label="Start timer"
        >
          <Play className="w-8 h-8 ml-1" />
        </button>
      ) : (
        <button
          onClick={onPause}
          className="flex items-center justify-center w-16 h-16 bg-yellow-600 hover:bg-yellow-700 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
          aria-label="Pause timer"
        >
          <Pause className="w-8 h-8" />
        </button>
      )}

      {/* Stop Button */}
      <button
        onClick={onStop}
        className="flex items-center justify-center w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        aria-label="Stop timer"
      >
        <Square className="w-6 h-6" />
      </button>

      {/* Skip Button */}
      <button
        onClick={onSkip}
        className="flex items-center justify-center w-12 h-12 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        aria-label="Skip to next session"
      >
        <SkipForward className="w-6 h-6" />
      </button>
    </div>
  )
}