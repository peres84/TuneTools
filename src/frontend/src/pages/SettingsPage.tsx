import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { DashboardLayout } from '../components/DashboardLayout'
import { Cog6ToothIcon, ExclamationTriangleIcon, CheckCircleIcon, CalendarIcon, LinkIcon, TrashIcon } from '@heroicons/react/24/outline'
import { SettingsSkeleton } from '../components/LoadingSkeletons'
import { getUserFriendlyErrorMessage } from '../utils/errorMessages'
import { cacheManager, CACHE_KEYS } from '../utils/cacheManager'

const CATEGORIES = [
  { id: 'technology', label: 'Technology', icon: '💻' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'science', label: 'Science', icon: '🔬' },
  { id: 'health', label: 'Health', icon: '🏥' },
  { id: 'politics', label: 'Politics', icon: '🏛️' },
  { id: 'art', label: 'Art & Culture', icon: '🎨' },
]

const MUSIC_GENRES = ['pop', 'rock', 'jazz', 'classical', 'electronic', 'indie', 'hiphop', 'country']
const VOCAL_PREFERENCES = ['male', 'female', 'neutral']
const MOOD_PREFERENCES = [
  { id: 'uplifting', label: 'Uplifting', icon: '😊' },
  { id: 'calm', label: 'Calm', icon: '😌' },
  { id: 'energetic', label: 'Energetic', icon: '⚡' },
  { id: 'melancholic', label: 'Melancholic', icon: '😔' },
]

export function SettingsPage() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [hasChanges, setHasChanges] = useState(false)

  const [categories, setCategories] = useState<string[]>([])
  const [musicGenres, setMusicGenres] = useState<string[]>([])
  const [vocalPreference, setVocalPreference] = useState<string>('neutral')
  const [moodPreference, setMoodPreference] = useState<string>('uplifting')
  
  // Store original values to detect changes
  const [originalPreferences, setOriginalPreferences] = useState({
    categories: [] as string[],
    musicGenres: [] as string[],
    vocalPreference: 'neutral',
    moodPreference: 'uplifting'
  })

  const { isLoading, error } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      if (!session?.access_token) return null

      // Try to get from localStorage cache first
      const cached = cacheManager.get<any>(CACHE_KEYS.USER_PREFERENCES, 30)
      if (cached) {
        const cats = cached.categories || []
        const genres = cached.music_genres || []
        const vocal = cached.vocal_preference || 'neutral'
        const mood = cached.mood_preference || 'uplifting'
        
        setCategories(cats)
        setMusicGenres(genres)
        setVocalPreference(vocal)
        setMoodPreference(mood)
        
        // Store original values
        setOriginalPreferences({
          categories: cats,
          musicGenres: genres,
          vocalPreference: vocal,
          moodPreference: mood
        })
        
        return cached
      }

      // Fetch from API if not cached
      const { fetchWithAuth } = await import('../utils/apiClient')
      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/preferences`
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.detail || 'Failed to fetch preferences'
        const error: any = new Error(errorMessage)
        error.status = response.status
        throw error
      }
      const prefs = await response.json()

      // Save to localStorage cache
      cacheManager.set(CACHE_KEYS.USER_PREFERENCES, prefs, 30)

      const cats = prefs.categories || []
      const genres = prefs.music_genres || []
      const vocal = prefs.vocal_preference || 'neutral'
      const mood = prefs.mood_preference || 'uplifting'

      setCategories(cats)
      setMusicGenres(genres)
      setVocalPreference(vocal)
      setMoodPreference(mood)
      
      // Store original values
      setOriginalPreferences({
        categories: cats,
        musicGenres: genres,
        vocalPreference: vocal,
        moodPreference: mood
      })

      return prefs
    },
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { fetchWithAuth } = await import('../utils/apiClient')
      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/preferences`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            categories,
            music_genres: musicGenres,
            vocal_preference: vocalPreference,
            mood_preference: moodPreference
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to update preferences')
      }
      return response.json()
    },
    onSuccess: async () => {
      // Refetch preferences from API to get the latest saved data
      const { fetchWithAuth } = await import('../utils/apiClient')
      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/preferences`
      )
      
      if (response.ok) {
        const freshPrefs = await response.json()
        
        // Update localStorage cache with fresh data
        cacheManager.set(CACHE_KEYS.USER_PREFERENCES, freshPrefs, 30)
        
        // Update original preferences to match saved state
        setOriginalPreferences({
          categories: freshPrefs.categories || [],
          musicGenres: freshPrefs.music_genres || [],
          vocalPreference: freshPrefs.vocal_preference || 'neutral',
          moodPreference: freshPrefs.mood_preference || 'uplifting'
        })
      }
      
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] })
      setHasChanges(false)
    },
    onError: (err: Error) => {
      console.error('Failed to save settings:', err)
    }
  })

  // Check if current state differs from original
  const checkForChanges = (
    newCategories?: string[],
    newGenres?: string[],
    newVocal?: string,
    newMood?: string
  ) => {
    const cats = newCategories ?? categories
    const genres = newGenres ?? musicGenres
    const vocal = newVocal ?? vocalPreference
    const mood = newMood ?? moodPreference

    const categoriesChanged = JSON.stringify(cats.sort()) !== JSON.stringify(originalPreferences.categories.sort())
    const genresChanged = JSON.stringify(genres.sort()) !== JSON.stringify(originalPreferences.musicGenres.sort())
    const vocalChanged = vocal !== originalPreferences.vocalPreference
    const moodChanged = mood !== originalPreferences.moodPreference

    const hasAnyChanges = categoriesChanged || genresChanged || vocalChanged || moodChanged
    setHasChanges(hasAnyChanges)
    
    if (hasAnyChanges) {
      console.log('📝 Changes detected:', { categoriesChanged, genresChanged, vocalChanged, moodChanged })
    }
  }

  const toggleCategory = (categoryId: string) => {
    const newCategories = categories.includes(categoryId) 
      ? categories.filter(c => c !== categoryId) 
      : [...categories, categoryId]
    setCategories(newCategories)
    checkForChanges(newCategories)
  }

  const toggleGenre = (genreId: string) => {
    const newGenres = musicGenres.includes(genreId)
      ? musicGenres.filter(g => g !== genreId)
      : [...musicGenres, genreId]
    setMusicGenres(newGenres)
    checkForChanges(undefined, newGenres)
  }

  const handleVocalChange = (vocal: string) => {
    setVocalPreference(vocal)
    checkForChanges(undefined, undefined, vocal)
  }

  const handleMoodChange = (mood: string) => {
    setMoodPreference(mood)
    checkForChanges(undefined, undefined, undefined, mood)
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-brand-primary mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your music and news preferences
          </p>
        </div>

        {isLoading ? (
          <SettingsSkeleton />
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-1">
                  Failed to Load Settings
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                  {getUserFriendlyErrorMessage(error)}
                </p>
                {/* Check if it's a 404 error (missing preferences) */}
                {(error as any)?.status === 404 && (
                  <a
                    href="/onboarding"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Complete Onboarding
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* News Categories */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                News Categories
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select categories for your personalized news (70% of daily news)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      categories.includes(category.id)
                        ? 'border-brand-primary bg-brand-primary text-white'
                        : 'border-gray-300 dark:border-gray-600 hover:border-brand-primary'
                    }`}
                  >
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <div className="font-medium text-sm">{category.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Music Preferences */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Music Preferences
              </h2>
              
              {/* Genres */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Favorite Genres
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {MUSIC_GENRES.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`p-3 rounded-lg border-2 transition-all capitalize ${
                        musicGenres.includes(genre)
                          ? 'border-brand-secondary bg-brand-secondary text-white'
                          : 'border-gray-300 dark:border-gray-600 hover:border-brand-secondary'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vocal Preference */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Vocal Preference
                </h3>
                <div className="flex gap-3">
                  {VOCAL_PREFERENCES.map((vocal) => (
                    <button
                      key={vocal}
                      onClick={() => handleVocalChange(vocal)}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all capitalize ${
                        vocalPreference === vocal
                          ? 'border-brand-accent bg-brand-accent text-gray-900'
                          : 'border-gray-300 dark:border-gray-600 hover:border-brand-accent'
                      }`}
                    >
                      {vocal}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood Preference */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Mood Preference
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {MOOD_PREFERENCES.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => handleMoodChange(mood.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        moodPreference === mood.id
                          ? 'border-brand-primary bg-brand-primary text-white'
                          : 'border-gray-300 dark:border-gray-600 hover:border-brand-primary'
                      }`}
                    >
                      <div className="text-3xl mb-2">{mood.icon}</div>
                      <div className="font-medium text-sm">{mood.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Google Calendar Integration */}
            <CalendarIntegration />

            {/* Save Button - Always visible */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <p className={`text-sm sm:text-base ${hasChanges ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-500 dark:text-gray-500'}`}>
                  {hasChanges ? '⚠️ You have unsaved changes' : 'No changes to save'}
                </p>
                <button
                  onClick={() => updateMutation.mutate()}
                  disabled={!hasChanges || updateMutation.isPending}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold inline-flex items-center gap-2 transition-all touch-manipulation ${
                    hasChanges && !updateMutation.isPending
                      ? 'bg-brand-primary text-white hover:bg-opacity-90 active:scale-95 cursor-pointer'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span className="hidden sm:inline">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Cog6ToothIcon className="w-5 h-5" />
                      <span className="hidden sm:inline">Save Changes</span>
                      <span className="sm:hidden">Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {updateMutation.isSuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    Preferences saved successfully!
                  </p>
                </div>
              </div>
            )}

            {updateMutation.isError && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800 dark:text-red-200 font-medium mb-1">
                      Failed to save preferences
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {getUserFriendlyErrorMessage(updateMutation.error)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}


// Calendar Integration Component
function CalendarIntegration() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Check URL params for OAuth callback status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const calendarStatus = params.get('calendar')
    const errorMessage = params.get('message')

    if (calendarStatus === 'success') {
      setStatusMessage({ type: 'success', message: 'Google Calendar connected successfully!' })
      // Clean up URL
      window.history.replaceState({}, '', '/settings')
      // Refetch status
      queryClient.invalidateQueries({ queryKey: ['calendarStatus'] })
    } else if (calendarStatus === 'error') {
      setStatusMessage({ type: 'error', message: errorMessage || 'Failed to connect calendar' })
      // Clean up URL
      window.history.replaceState({}, '', '/settings')
    }
  }, [queryClient])

  // Fetch calendar connection status
  const { data: calendarStatus, isLoading } = useQuery({
    queryKey: ['calendarStatus'],
    queryFn: async () => {
      if (!session?.access_token) return null

      const { fetchWithAuth } = await import('../utils/apiClient')
      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_BASE_URL}/api/calendar/status`
      )

      if (!response.ok) throw new Error('Failed to fetch calendar status')
      return response.json()
    },
    enabled: !!session?.access_token,
    staleTime: 0, // Always refetch when component mounts
    refetchOnMount: 'always', // Force refetch on mount
  })

  // Listen for OAuth completion from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return
      
      if (event.data?.type === 'calendar-oauth-complete') {
        console.log('📅 [Settings] OAuth complete, refreshing calendar status')
        
        // Refetch calendar status
        queryClient.invalidateQueries({ queryKey: ['calendarStatus'] })
        
        // Show success/error message
        if (event.data.status === 'success') {
          setStatusMessage({ type: 'success', message: 'Google Calendar connected successfully!' })
        } else if (event.data.status === 'error') {
          setStatusMessage({ type: 'error', message: event.data.message || 'Failed to connect calendar' })
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [queryClient])

  // Connect calendar mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
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
      
      const popup = window.open(
        data.authorization_url,
        'Google Calendar Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      )
      
      // Poll to detect when popup closes (fallback if postMessage doesn't work)
      if (popup) {
        const pollTimer = setInterval(() => {
          if (popup.closed) {
            clearInterval(pollTimer)
            console.log('📅 [Settings] Popup closed, refreshing calendar status')
            // Wait a moment for the callback to complete, then refresh
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['calendarStatus'] })
            }, 500)
          }
        }, 500)
      }
    },
    onError: (err: Error) => {
      setStatusMessage({ type: 'error', message: getUserFriendlyErrorMessage(err) })
    }
  })

  // Disconnect calendar mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { fetchWithAuth } = await import('../utils/apiClient')
      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_BASE_URL}/api/calendar/revoke`,
        {
          method: 'DELETE'
        }
      )

      if (!response.ok) throw new Error('Failed to disconnect calendar')
      return response.json()
    },
    onSuccess: () => {
      setStatusMessage({ type: 'success', message: 'Calendar disconnected successfully' })
      queryClient.invalidateQueries({ queryKey: ['calendarStatus'] })
    },
    onError: (err: Error) => {
      setStatusMessage({ type: 'error', message: getUserFriendlyErrorMessage(err) })
    }
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <CalendarIcon className="w-8 h-8 text-brand-primary" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Google Calendar
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Connect your calendar to include daily activities in your songs
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className={`mb-4 p-4 rounded-lg border-2 ${
          statusMessage.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
            : 'bg-red-50 dark:bg-red-900/20 border-red-500'
        }`}>
          <div className="flex items-center gap-3">
            {statusMessage.type === 'success' ? (
              <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            ) : (
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
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

      {isLoading ? (
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-primary"></div>
          <span>Checking connection status...</span>
        </div>
      ) : calendarStatus?.connected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <p className="font-medium text-green-800 dark:text-green-200">
                Connected to Google Calendar
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Connected on {new Date(calendarStatus.connected_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {disconnectMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Disconnecting...</span>
              </>
            ) : (
              <>
                <TrashIcon className="w-5 h-5" />
                <span>Disconnect Calendar</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <button
          onClick={() => connectMutation.mutate()}
          disabled={connectMutation.isPending}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {connectMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <LinkIcon className="w-5 h-5" />
              <span>Connect Google Calendar</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}
