import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingStep1, type PreferencesData } from '../components/OnboardingStep1'
import { OnboardingStep2 } from '../components/OnboardingStep2'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'

export function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [preferences, setPreferences] = useState<PreferencesData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleStep1Complete = (prefs: PreferencesData) => {
    setPreferences(prefs)
    setStep(2)
  }

  const handleStep2Complete = async (calendarEnabled: boolean) => {
    if (!preferences || !user) return

    setLoading(true)
    setError(null)

    try {
      console.log('💾 Saving preferences...', preferences)
      console.log('📅 Calendar enabled:', calendarEnabled)
      
      // Save preferences to backend (use POST for creation during onboarding)
      const response = await api.user.createPreferences({
        categories: preferences.categories,
        music_genres: preferences.musicGenres,
        vocal_preference: preferences.vocalPreference,
        mood_preference: preferences.moodPreference,
      })

      console.log('✅ Preferences saved successfully', response.data)

      // Onboarding_completed flag is set by the backend
      // Redirect to dashboard (location modal will show there)
      navigate('/dashboard')
    } catch (err: any) {
      console.error('❌ Failed to save preferences:', err)
      setError(err.response?.data?.detail || 'Failed to save preferences. Please try again.')
      setLoading(false)
    }
  }

  const handleBack = () => {
    setStep(1)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className={`flex items-center ${step >= 1 ? 'text-brand-primary' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 1 ? 'bg-brand-primary text-white' : 'bg-gray-300 dark:bg-gray-700'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Preferences</span>
            </div>
            <div className={`h-1 w-16 ${step >= 2 ? 'bg-brand-primary' : 'bg-gray-300 dark:bg-gray-700'}`} />
            <div className={`flex items-center ${step >= 2 ? 'text-brand-primary' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 2 ? 'bg-brand-primary text-white' : 'bg-gray-300 dark:bg-gray-700'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Calendar</span>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
              <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-900 dark:text-white font-medium">Saving your preferences...</p>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {step === 1 && <OnboardingStep1 onNext={handleStep1Complete} />}
          {step === 2 && <OnboardingStep2 onComplete={handleStep2Complete} onBack={handleBack} />}
        </div>

        {/* Error Display - Bottom */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-500">
            <div className="flex items-start">
              <svg className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">
                  Failed to save preferences
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Please try again or contact support if the issue persists.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
