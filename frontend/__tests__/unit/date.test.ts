import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
// `process` is available in NodeJS tests, but TypeScript's DOM types don't include it here
declare const process: any
import { formatLocalDate } from '../../src/lib/date'

describe('formatLocalDate', () => {
  const originalTZ = process.env.TZ

  beforeEach(() => {
    // Use fake timers for consistent Date.now behavior
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    process.env.TZ = originalTZ
  })

  it('returns YYYY-MM-DD using local timezone', () => {
    // Set to a UTC time where the local date would still be the previous day
    process.env.TZ = 'America/Los_Angeles'
    // 2025-11-17T01:00:00Z is 2025-11-16T17:00:00-08:00
    const ts = new Date('2025-11-17T01:00:00Z').getTime()
    vi.setSystemTime(ts)
    expect(formatLocalDate()).toBe('2025-11-16')
  })

  it('formats passed Date object using local timezone', () => {
    process.env.TZ = 'America/Los_Angeles'
    const d = new Date('2025-11-17T01:00:00Z')
    expect(formatLocalDate(d)).toBe('2025-11-16')
  })
})
