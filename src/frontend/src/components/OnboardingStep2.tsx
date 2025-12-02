import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'

interface OnboardingStep2Props {
  onComplete: (calendarEnabled: boolean) => void
  onBack: () => void
}

export function OnboardingStep2({ onComplete, onBack }: OnboardingStep2Props) {
  const { session } = useAuth()
  const [isConnecting, setIsConnecting] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const queryClient = useQueryClient()

  // Fetch calendar connection status
  const { data: calendarStatus, refetch } = useQuery({
    queryKey: ['calendarStatus'],
    queryFn: async () => {
      if (!session?.access_token) return null

      const { fetchWithAuth } = await import('../utils/apiClient')
      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_BASE_URL}/api/calendar/status`
      )

      if (!response.ok) return null
      return response.json()
    },
    enabled: !!session?.access_token,
    staleTime: 0, // Always consider data stale
    retry: false,
  })

  // Check URL params for OAuth callback status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const calendarStatusParam = params.get('calendar')
    const errorMessage = params.get('message')

    if (calendarStatusParam === 'success') {
      setStatusMessage({ type: 'success', message: 'Google Calendar connected successfully!' })
      setIsConnecting(true)
      // Clean up URL
      window.history.replaceState({}, '', '/onboarding')
      // Invalidate and refetch calendar status
      queryClient.invalidateQueries({ queryKey: ['calendarStatus'] })
      // Force immediate refetch
      refetch()
    } else if (calendarStatusParam === 'error') {
      setStatusMessage({ type: 'error', message: errorMessage || 'Failed to connect calendar' })
      setIsConnecting(false)
      // Clean up URL
      window.history.replaceState({}, '', '/onboarding')
    }
  }, [queryClient, refetch])

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!session?.access_token) throw new Error('Not authenticated')

      const { fetchWithAuth } = await import('../utils/apiClient')
      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_BASE_URL}/api/calendar/authorize`
      )

      if (!response.ok) throw new Error('Failed to get authorization URL')
      const data = await response.json()
      
      // Open OAuth URL in popup
      const width = 600
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2
      
      window.open(
        data.authorization_url,
        'Google Calendar Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      )
      
      setIsConnecting(true)
    },
    onError: (err: Error) => {
      console.error('Calendar connection error:', err)
      setStatusMessage({ type: 'error', message: err.message || 'Failed to connect calendar' })
    }
  })

  const handleGoogleCalendar = () => {
    connectMutation.mutate()
  }

  const handleSkip = () => {
    setShowWarning(true)
  }

  const handleConfirmSkip = () => {
    onComplete(false)
  }

  const handleContinue = () => {
    onComplete(true)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Connect Your Calendar
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Let us know about your daily activities to create more personalized songs
        </p>
      </div>

      {statusMessage && (
        <div className={`mb-6 p-4 rounded-lg border-2 ${
          statusMessage.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
            : 'bg-red-50 dark:bg-red-900/20 border-red-500'
        }`}>
          <div className="flex items-center gap-3">
            {statusMessage.type === 'success' ? (
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p className={`font-medium ${
              statusMessage.type === 'success'
                ? 'text-green-800 dark:text-green-200'
                : 'text-red-800 dark:text-red-200'
            }`}>
              {statusMessage.message}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Google Calendar Integration
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            We'll use your calendar events to understand your daily context and create songs that reflect your activities.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✅</div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Secure & Private</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your calendar data is encrypted and never shared with third parties
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-2xl">🎵</div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Better Songs</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Songs that reflect your meetings, events, and daily schedule
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚙️</div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Easy to Manage</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You can disconnect at any time from your settings
              </p>
            </div>
          </div>
        </div>

        {calendarStatus?.connected ? (
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-medium text-green-800 dark:text-green-200">
                  Connected to Google Calendar
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your calendar is ready to use!
                </p>
              </div>
            </div>
          </div>
        ) : !isConnecting ? (
          <button
            onClick={handleGoogleCalendar}
            disabled={connectMutation.isPending}
            className="w-full py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connectMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 dark:border-white"></div>
                <span>Opening authorization...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Connect Google Calendar
              </>
            )}
          </button>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg p-4">
            <p className="text-center text-blue-800 dark:text-blue-200 font-medium mb-2">
              ✓ Authorization window opened
            </p>
            <p className="text-center text-sm text-blue-700 dark:text-blue-300">
              Complete the authorization in the popup window, then click Continue below.
            </p>
          </div>
        )}
      </div>

      {showWarning && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                Calendar Features Won't Work
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                Without connecting your Google Calendar, the Calendar section will be empty and your daily songs won't include your activities. You can always connect it later in Settings.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmSkip}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 active:scale-95 transition-all text-sm font-semibold"
                >
                  Skip Anyway
                </button>
                <button
                  onClick={() => setShowWarning(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-95 transition-all text-sm font-semibold"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Back
        </button>
        <div className="flex gap-3">
          {!showWarning && !calendarStatus?.connected && (
            <button
              onClick={handleSkip}
              className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Skip for now
            </button>
          )}
          {(isConnecting || calendarStatus?.connected) && (
            <button
              onClick={handleContinue}
              className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 active:scale-95 transition-all font-semibold"
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
