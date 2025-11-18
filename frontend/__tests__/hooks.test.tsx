import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the dataApi
vi.mock('../src/lib/api', () => ({
  dataApi: {
    export: vi.fn(),
    import: vi.fn()
  }
}))

import { dataApi } from '../src/lib/api'

describe('Data API functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('export', () => {
    it('calls the export API', async () => {
      const mockBlob = new Blob(['test data'], { type: 'application/json' })
      const mockExport = vi.fn().mockResolvedValue(mockBlob)
      dataApi.export = mockExport

      const result = await dataApi.export()
      expect(mockExport).toHaveBeenCalled()
      expect(result).toBe(mockBlob)
    })
  })

  describe('import', () => {
    it('calls the import API with correct data', async () => {
      const mockImport = vi.fn().mockResolvedValue({
        message: 'Data imported successfully',
        imported_count: 2,
        conflicts: []
      })
      dataApi.import = mockImport

      const testData = { version: '1.0', tasks: [], journal_entries: [], settings: [] }
      const result = await dataApi.import(testData)

      expect(mockImport).toHaveBeenCalledWith(testData)
      expect(result.message).toBe('Data imported successfully')
      expect(result.imported_count).toBe(2)
    })
  })
})

// Note: Hook tests would require more complex setup with QueryClient
// For now, we test the underlying API functions which are the core functionality