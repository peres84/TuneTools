import { useState } from 'react'

interface OnboardingStep2Props {
  onComplete: (calendarEnabled: boolean) => void
  onBack: () => void
}

export function OnboardingStep2({ onComplete, onBack }: OnboardingStep2Props) {
  const [loading, setLoading] = useState(false)

  const handleGoogleCalendar = async () => {
    setLoading(true)
    
    // TODO: Implement Google Calendar OAuth flow
    // For now, we'll simulate the flow
    try {
      // In production, this would redirect to Google OAuth
      // const response = await api.user.connectCalendar()
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      onComplete(true)
    } catch (error) {
      console.error('Calendar connection failed:', error)
      setLoading(false)
    }
  }

  const handleSkip = () => {
    onComplete(false)
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

        <button
          onClick={handleGoogleCalendar}
          disabled={loading}
          className="w-full py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
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
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleSkip}
          className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
