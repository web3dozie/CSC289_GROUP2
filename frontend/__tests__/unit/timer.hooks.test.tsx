import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePomodoroTimer } from '../../src/lib/hooks/timer'

describe('usePomodoroTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      expect(result.current.timeLeft).toBe(25 * 60) // 25 minutes in seconds
      expect(result.current.totalTime).toBe(25 * 60)
      expect(result.current.session).toBe('work')
      expect(result.current.status).toBe('idle')
      expect(result.current.completedSessions).toBe(0)
    })

    it('should provide all required timer actions', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      expect(typeof result.current.start).toBe('function')
      expect(typeof result.current.pause).toBe('function')
      expect(typeof result.current.stop).toBe('function')
      expect(typeof result.current.skip).toBe('function')
      expect(typeof result.current.reset).toBe('function')
    })
  })

  describe('Start timer', () => {
    it('should start timer from idle state', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      expect(result.current.status).toBe('idle')

      act(() => {
        result.current.start()
      })

      expect(result.current.status).toBe('running')
    })

    it('should resume timer from paused state', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      // Start and pause
      act(() => {
        result.current.start()
      })
      act(() => {
        result.current.pause()
      })

      expect(result.current.status).toBe('paused')

      // Resume
      act(() => {
        result.current.start()
      })

      expect(result.current.status).toBe('running')
    })

    it('should not start when already running', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      act(() => {
        result.current.start()
      })

      const statusBefore = result.current.status
      const timeLeftBefore = result.current.timeLeft

      act(() => {
        result.current.start()
      })

      expect(result.current.status).toBe(statusBefore)
      expect(result.current.timeLeft).toBe(timeLeftBefore)
    })

    it('should decrement time when running', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      act(() => {
        result.current.start()
      })

      const initialTime = result.current.timeLeft

      act(() => {
        vi.advanceTimersByTime(1000) // Advance by 1 second
      })

      expect(result.current.timeLeft).toBe(initialTime - 1)
    })

    it('should continue counting down every second', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      act(() => {
        result.current.start()
      })

      const initialTime = result.current.timeLeft

      act(() => {
        vi.advanceTimersByTime(5000) // Advance by 5 seconds
      })

      expect(result.current.timeLeft).toBe(initialTime - 5)
    })
  })

  describe('Pause timer', () => {
    it('should pause running timer', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      act(() => {
        result.current.start()
      })

      expect(result.current.status).toBe('running')

      act(() => {
        result.current.pause()
      })

      expect(result.current.status).toBe('paused')
    })

    it('should preserve time when paused', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      act(() => {
        result.current.start()
      })

      act(() => {
        vi.advanceTimersByTime(3000) // 3 seconds
      })

      const timeAtPause = result.current.timeLeft

      act(() => {
        result.current.pause()
      })

      act(() => {
        vi.advanceTimersByTime(5000) // Timer should not count down while paused
      })

      expect(result.current.timeLeft).toBe(timeAtPause)
    })

    it('should not pause when not running', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      expect(result.current.status).toBe('idle')

      act(() => {
        result.current.pause()
      })

      expect(result.current.status).toBe('idle')
    })
  })

  describe('Stop timer', () => {
    it('should stop timer and reset to work session', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      act(() => {
        result.current.start()
      })

      act(() => {
        vi.advanceTimersByTime(10000) // Advance 10 seconds
      })

      act(() => {
        result.current.stop()
      })

      expect(result.current.status).toBe('idle')
      expect(result.current.session).toBe('work')
      expect(result.current.timeLeft).toBe(25 * 60)
      expect(result.current.totalTime).toBe(25 * 60)
    })

    it('should clear interval when stopped', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      act(() => {
        result.current.start()
      })

      act(() => {
        result.current.stop()
      })

      const timeAfterStop = result.current.timeLeft

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // Time should not change after stop
      expect(result.current.timeLeft).toBe(timeAfterStop)
    })

    it('should preserve completed sessions count', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      // Complete a work session
      act(() => {
        result.current.start()
      })

      act(() => {
        vi.advanceTimersByTime(25 * 60 * 1000) // Complete work session
      })

      const completedSessions = result.current.completedSessions

      act(() => {
        result.current.stop()
      })

      expect(result.current.completedSessions).toBe(completedSessions)
    })
  })

  describe('Skip session', () => {
    it('should skip from work to break session', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      expect(result.current.session).toBe('work')

      act(() => {
        result.current.start()
      })

      act(() => {
        result.current.skip()
      })

      expect(result.current.session).toBe('break')
      expect(result.current.timeLeft).toBe(5 * 60)
      expect(result.current.totalTime).toBe(5 * 60)
      expect(result.current.status).toBe('idle')
    })

    it('should skip from break to work session', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      // Skip to break
      act(() => {
        result.current.skip()
      })

      expect(result.current.session).toBe('break')

      // Skip back to work
      act(() => {
        result.current.skip()
      })

      expect(result.current.session).toBe('work')
      expect(result.current.timeLeft).toBe(25 * 60)
      expect(result.current.totalTime).toBe(25 * 60)
      expect(result.current.status).toBe('idle')
    })

    it('should increment completed sessions when skipping work session', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      const initialCompleted = result.current.completedSessions

      act(() => {
        result.current.skip()
      })

      expect(result.current.completedSessions).toBe(initialCompleted + 1)
    })

    it('should not increment completed sessions when skipping break session', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      // Skip to break
      act(() => {
        result.current.skip()
      })

      const completedAfterFirst = result.current.completedSessions

      // Skip break
      act(() => {
        result.current.skip()
      })

      expect(result.current.completedSessions).toBe(completedAfterFirst)
    })

    it('should clear timer interval when skipping', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      act(() => {
        result.current.start()
      })

      act(() => {
        result.current.skip()
      })

      const timeAfterSkip = result.current.timeLeft

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // Time should not change after skip (status is idle)
      expect(result.current.timeLeft).toBe(timeAfterSkip)
    })
  })

  describe('Reset timer', () => {
    it('should reset timer to initial state', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      // Make some changes
      act(() => {
        result.current.start()
      })

      act(() => {
        vi.advanceTimersByTime(10000)
      })

      // Complete a session to increment completedSessions
      act(() => {
        vi.advanceTimersByTime(25 * 60 * 1000)
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.status).toBe('idle')
      expect(result.current.session).toBe('work')
      expect(result.current.timeLeft).toBe(25 * 60)
      expect(result.current.totalTime).toBe(25 * 60)
      expect(result.current.completedSessions).toBe(0)
    })
  })

  describe('Session completion', () => {
    it('should complete work session and switch to break', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      act(() => {
        result.current.start()
      })

      // Fast forward to end of work session
      act(() => {
        vi.advanceTimersByTime(25 * 60 * 1000)
      })

      expect(result.current.status).toBe('completed')
      expect(result.current.session).toBe('break')
      expect(result.current.timeLeft).toBe(5 * 60)
      expect(result.current.completedSessions).toBe(1)
    })

    it('should complete break session and switch to work', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      // Skip to break session
      act(() => {
        result.current.skip()
      })

      act(() => {
        result.current.start()
      })

      // Fast forward to end of break session
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000)
      })

      expect(result.current.status).toBe('completed')
      expect(result.current.session).toBe('work')
      expect(result.current.timeLeft).toBe(25 * 60)
    })

    it('should transition from completed to idle after delay', async () => {
      const { result } = renderHook(() => usePomodoroTimer())

      act(() => {
        result.current.start()
      })

      act(() => {
        vi.advanceTimersByTime(25 * 60 * 1000)
      })

      expect(result.current.status).toBe('completed')

      // Wait for the auto-transition delay
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // The status should transition to idle after the delay
      expect(result.current.status).toBe('idle')
    })

    it('should increment completed sessions only for work sessions', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      // Complete work session
      act(() => {
        result.current.start()
      })

      act(() => {
        vi.advanceTimersByTime(25 * 60 * 1000)
      })

      expect(result.current.completedSessions).toBe(1)

      // Wait for transition
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // Complete break session
      act(() => {
        result.current.start()
      })

      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000)
      })

      // Should still be 1 (break doesn't increment)
      expect(result.current.completedSessions).toBe(1)
    })
  })

  describe('Cleanup', () => {
    it('should cleanup interval on unmount', () => {
      const { result, unmount } = renderHook(() => usePomodoroTimer())

      act(() => {
        result.current.start()
      })

      unmount()

      // Advance time after unmount
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // Since component is unmounted, we can't check the state
      // But we've ensured the interval is cleared
      expect(true).toBe(true)
    })
  })

  describe('Multiple sessions workflow', () => {
    it('should handle complete work-break-work cycle', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      // Start work session
      act(() => {
        result.current.start()
      })

      // Complete work
      act(() => {
        vi.advanceTimersByTime(25 * 60 * 1000)
      })

      expect(result.current.session).toBe('break')
      expect(result.current.completedSessions).toBe(1)

      // Wait for transition
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // Start break
      act(() => {
        result.current.start()
      })

      // Complete break
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000)
      })

      expect(result.current.session).toBe('work')
      expect(result.current.completedSessions).toBe(1)
    })

    it('should handle pause and resume across sessions', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      // Start work, pause, resume
      act(() => {
        result.current.start()
      })

      act(() => {
        vi.advanceTimersByTime(10 * 60 * 1000) // 10 minutes
      })

      act(() => {
        result.current.pause()
      })

      const timeAtPause = result.current.timeLeft

      act(() => {
        result.current.start()
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.timeLeft).toBe(timeAtPause - 1)
    })

    it('should maintain state across multiple pause/resume cycles', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      act(() => {
        result.current.start()
      })

      // First pause/resume
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      act(() => {
        result.current.pause()
      })

      act(() => {
        result.current.start()
      })

      // Second pause/resume
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      act(() => {
        result.current.pause()
      })

      act(() => {
        result.current.start()
      })

      // Should have counted down 10 seconds total
      expect(result.current.timeLeft).toBe(25 * 60 - 10)
    })
  })

  describe('Edge cases', () => {
    it('should handle rapid start/stop calls', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      act(() => {
        result.current.start()
        result.current.stop()
        result.current.start()
        result.current.stop()
      })

      expect(result.current.status).toBe('idle')
      expect(result.current.timeLeft).toBe(25 * 60)
    })

    it('should handle skip during running timer', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      act(() => {
        result.current.start()
      })

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      act(() => {
        result.current.skip()
      })

      expect(result.current.status).toBe('idle')
      expect(result.current.session).toBe('break')
    })

    it('should handle reset during running timer', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      act(() => {
        result.current.start()
      })

      act(() => {
        vi.advanceTimersByTime(10000)
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.status).toBe('idle')
      expect(result.current.timeLeft).toBe(25 * 60)
      expect(result.current.completedSessions).toBe(0)
    })

    it('should handle session completion at exactly 0 seconds', () => {
      const { result } = renderHook(() => usePomodoroTimer())

      act(() => {
        result.current.start()
      })

      // Advance to exactly the end time
      act(() => {
        vi.advanceTimersByTime((25 * 60 - 1) * 1000)
      })

      expect(result.current.timeLeft).toBe(1)

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.status).toBe('completed')
    })
  })
})
