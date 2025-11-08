import { describe, it, expect } from 'vitest'
import * as lib from '../../src/lib/index'

describe('lib/index exports', () => {
  it('should export queryClient', () => {
    expect(lib.queryClient).toBeDefined()
  })

  it('should export queryKeys', () => {
    expect(lib.queryKeys).toBeDefined()
    expect(lib.queryKeys.tasks).toEqual(['tasks'])
    expect(lib.queryKeys.health).toEqual(['health'])
    expect(lib.queryKeys.settings).toEqual(['settings'])
    expect(lib.queryKeys.journal).toEqual(['review', 'journal'])
    expect(lib.queryKeys.task(1)).toEqual(['tasks', 1])
  })

  it('should export hook utilities', () => {
    expect(lib.useHealthCheck).toBeDefined()
    expect(lib.useAuthSetup).toBeDefined()
    expect(lib.useAuthLogin).toBeDefined()
    expect(lib.useAuthLogout).toBeDefined()
    expect(lib.useTasks).toBeDefined()
    expect(lib.useSettings).toBeDefined()
    expect(lib.useCreateTask).toBeDefined()
    expect(lib.useUpdateTask).toBeDefined()
    expect(lib.useDeleteTask).toBeDefined()
  })

  it('should export review hooks', () => {
    expect(lib.useJournal).toBeDefined()
    expect(lib.useDailySummary).toBeDefined()
    expect(lib.useWeeklySummary).toBeDefined()
    expect(lib.useInsights).toBeDefined()
  })

  it('should export data management hooks', () => {
    expect(lib.useExportData).toBeDefined()
    expect(lib.useImportData).toBeDefined()
  })
})
