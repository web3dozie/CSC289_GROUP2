import React from 'react'
import { Upload, AlertTriangle, X, FileText, CheckCircle } from 'lucide-react'

interface ImportConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  fileName: string
  dataSummary?: {
    tasks?: number
    journalEntries?: number
    settings?: boolean
  }
  isLoading?: boolean
}

export const ImportConfirmation: React.FC<ImportConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  dataSummary,
  isLoading = false
}) => {
  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center text-blue-600">
            <Upload className="w-5 h-5 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Import Data</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start mb-4">
            <FileText className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">File: {fileName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This will replace your current data with the data from this file.
              </p>
            </div>
          </div>

          {/* Data Summary */}
          {dataSummary && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
              <div className="flex items-center mb-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Data to Import</span>
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                {dataSummary.tasks !== undefined && (
                  <div>• {dataSummary.tasks} task{dataSummary.tasks !== 1 ? 's' : ''}</div>
                )}
                {dataSummary.journalEntries !== undefined && (
                  <div>• {dataSummary.journalEntries} journal entr{dataSummary.journalEntries !== 1 ? 'ies' : 'y'}</div>
                )}
                {dataSummary.settings && (
                  <div>• Settings and preferences</div>
                )}
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
              <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Warning</span>
            </div>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              This action cannot be undone. Your current data will be permanently replaced.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {isLoading ? 'Importing...' : 'Import Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}