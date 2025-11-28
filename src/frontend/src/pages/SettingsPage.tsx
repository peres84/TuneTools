import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { DashboardLayout } from '../components/DashboardLayout'
import { Cog6ToothIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { SettingsSkeleton } from '../components/LoadingSkeletons'
import { getUserFriendlyErrorMessage } from '../utils/errorMessages'

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

  const { isLoading, error } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      if (!session?.access_token) return null

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/preferences`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch preferences')
      const prefs = await response.json()

      setCategories(prefs.categories || [])
      setMusicGenres(prefs.music_genres || [])
      setVocalPreference(prefs.vocal_preference || 'neutral')
      setMoodPreference(prefs.mood_preference || 'uplifting')

      return prefs
    },
    enabled: !!session?.access_token
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/preferences`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] })
      setHasChanges(false)
    },
    onError: (err: Error) => {
      console.error('Failed to save settings:', err)
    }
  })

  const toggleCategory = (categoryId: string) => {
    setCategories(prev => 
      prev.includes(categoryId) ? prev.filter(c => c !== categoryId) : [...prev, categoryId]
    )
    setHasChanges(true)
  }

  const toggleGenre = (genreId: string) => {
    setMusicGenres(prev => 
      prev.includes(genreId) ? prev.filter(g => g !== genreId) : [...prev, genreId]
    )
    setHasChanges(true)
  }

  const handleVocalChange = (vocal: string) => {
    setVocalPreference(vocal)
    setHasChanges(true)
  }

  const handleMoodChange = (mood: string) => {
    setMoodPreference(mood)
    setHasChanges(true)
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
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-1">
                  Failed to Load Settings
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400">
                  {getUserFriendlyErrorMessage(error)}
                </p>
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

            {/* Save Button */}
            {hasChanges && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <p className="text-gray-600 dark:text-gray-400">
                    You have unsaved changes
                  </p>
                  <button
                    onClick={() => updateMutation.mutate()}
                    disabled={updateMutation.isPending}
                    className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Cog6ToothIcon className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

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
