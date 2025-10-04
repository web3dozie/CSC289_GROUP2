import { useState, useEffect, useCallback, useRef } from 'react'

export type TimerSession = 'work' | 'break'
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed'

interface UsePomodoroTimerReturn {
  // State
  timeLeft: number
  totalTime: number
  session: TimerSession
  status: TimerStatus
  completedSessions: number

  // Actions
  start: () => void
  pause: () => void
  stop: () => void
  skip: () => void
  reset: () => void
}

const WORK_DURATION = 25 * 60 // 25 minutes in seconds
const BREAK_DURATION = 5 * 60 // 5 minutes in seconds

export const usePomodoroTimer = (): UsePomodoroTimerReturn => {
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION)
  const [totalTime, setTotalTime] = useState(WORK_DURATION)
  const [session, setSession] = useState<TimerSession>('work')
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [completedSessions, setCompletedSessions] = useState(0)

  const intervalRef = useRef<number | null>(null)

  // Timer tick function
  const tick = useCallback(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        // Session completed
        setStatus('completed')
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }

        // Switch to next session
        if (session === 'work') {
          setCompletedSessions(prev => prev + 1)
          setSession('break')
          setTotalTime(BREAK_DURATION)
          return BREAK_DURATION
        } else {
          setSession('work')
          setTotalTime(WORK_DURATION)
          return WORK_DURATION
        }
      }
      return prev - 1
    })
  }, [session])

  // Start timer
  const start = useCallback(() => {
    if (status === 'idle' || status === 'paused') {
      setStatus('running')
      intervalRef.current = setInterval(tick, 1000)
    }
  }, [status, tick])

  // Pause timer
  const pause = useCallback(() => {
    if (status === 'running') {
      setStatus('paused')
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [status])

  // Stop timer
  const stop = useCallback(() => {
    setStatus('idle')
    setSession('work')
    setTimeLeft(WORK_DURATION)
    setTotalTime(WORK_DURATION)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Skip to next session
  const skip = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (session === 'work') {
      setSession('break')
      setTimeLeft(BREAK_DURATION)
      setTotalTime(BREAK_DURATION)
      setCompletedSessions(prev => prev + 1)
    } else {
      setSession('work')
      setTimeLeft(WORK_DURATION)
      setTotalTime(WORK_DURATION)
    }

    setStatus('idle')
  }, [session])

  // Reset timer
  const reset = useCallback(() => {
    stop()
    setCompletedSessions(0)
  }, [stop])

  // Handle session completion
  useEffect(() => {
    if (status === 'completed') {
      // Auto-start next session after a brief delay
      const timeout = setTimeout(() => {
        setStatus('idle')
        // Don't auto-start, let user manually start
      }, 1000)

      return () => clearTimeout(timeout)
    }
  }, [status])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
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
  }
}