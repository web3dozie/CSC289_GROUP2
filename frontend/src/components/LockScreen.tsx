import React, { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export const LockScreen: React.FC = () => {
  const { unlock, error, clearError } = useAuth()
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin.trim()) return

    setIsUnlocking(true)
    clearError()

    try {
      await unlock(pin)
      setPin('')
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setIsUnlocking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Lock icon */}
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-full">
            <Lock className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Task Line</h1>
          <p className="text-purple-200">Enter your PIN to unlock</p>
        </div>

        {/* Unlock form */}
        <form onSubmit={handleUnlock} className="space-y-6">
          <div>
            <label htmlFor="pin" className="sr-only">
              PIN
            </label>
            <div className="relative">
              <input
                id="pin"
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your PIN"
                className="w-full px-4 py-3 pr-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
                autoFocus
                disabled={isUnlocking}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-200 hover:text-white transition-colors"
                disabled={isUnlocking}
              >
                {showPin ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-200 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Unlock button */}
          <button
            type="submit"
            disabled={!pin.trim() || isUnlocking}
            className="w-full py-3 px-4 bg-white text-purple-900 font-semibold rounded-lg hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-900 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            {isUnlocking ? 'Unlocking...' : 'Unlock'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-purple-300">
            Task Line has been locked due to inactivity
          </p>
        </div>
      </div>
    </div>
  )
}