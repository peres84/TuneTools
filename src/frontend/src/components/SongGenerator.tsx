import { useState } from 'react'
import { MusicalNoteIcon, SparklesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserFriendlyErrorMessage, logError } from '../utils/errorMessages'
import { withRetry } from '../utils/retryMechanism'

interface Song {
  id: string
  title: string
  description: string
  audio_url: string
  vinyl_disk_url: string
  created_at: string
  genre_tags: string
  lyrics: string
}

interface SongGeneratorProps {
  onGenerationStart?: () => void
  onGenerationComplete?: (song?: Song) => void
}

const MUSIC_GENRES = ['pop', 'rock', 'jazz', 'classical', 'electronic', 'indie', 'hiphop', 'country']
const VOCAL_PREFERENCES = ['male', 'female', 'neutral']
const MOOD_PREFERENCES = ['uplifting', 'calm', 'energetic', 'melancholic']

export function SongGenerator({ onGenerationStart, onGenerationComplete }: SongGeneratorProps) {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [retryCount, setRetryCount] = useState<number>(0)
  const [customTitle, setCustomTitle] = useState<string>('')
  const [customCover, setCustomCover] = useState<File | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isGeneratingPersistent, setIsGeneratingPersistent] = useState(false)
  
  // Preference overrides (temporary, only for this generation)
  const [overrideGenres, setOverrideGenres] = useState<string[]>([])
  const [overrideVocal, setOverrideVocal] = useState<string>('')
  const [overrideMood, setOverrideMood] = useState<string>('')
  
  // Check for ongoing generation on mount
  useState(() => {
    const generationState = localStorage.getItem('song_generation_state')
    if (generationState) {
      try {
        const state = JSON.parse(generationState)
        const now = Date.now()
        // If generation started less than 15 minutes ago, consider it still ongoing
        if (now - state.startTime < 15 * 60 * 1000) {
          setIsGeneratingPersistent(true)
          setStatusMessage(state.statusMessage || 'Generating your song...')
          if (onGenerationStart) {
            onGenerationStart()
          }
        } else {
          // Clear stale state
          localStorage.removeItem('song_generation_state')
        }
      } catch (e) {
        console.error('Failed to parse generation state')
        localStorage.removeItem('song_generation_state')
      }
    }
  })

  // Query to fetch today's songs and limit info (cached)
  const { data: todayData, isLoading: checkingToday } = useQuery({
    queryKey: ['todaySong'],
    queryFn: async () => {
      if (!session?.access_token) return null

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/songs/today`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        
        // Check if generation completed while we were away
        const generationState = localStorage.getItem('song_generation_state')
        if (generationState && data.songs && data.songs.length > 0) {
          try {
            const state = JSON.parse(generationState)
            const latestSong = data.songs[0]
            // If there's a new song created after generation started, clear the state
            if (new Date(latestSong.created_at).getTime() > state.startTime) {
              localStorage.removeItem('song_generation_state')
              setIsGeneratingPersistent(false)
              setStatusMessage('Your song is ready!')
              if (onGenerationComplete) {
                onGenerationComplete(latestSong)
              }
            }
          } catch (e) {
            console.error('Failed to check generation completion')
          }
        }
        
        return data
      }
      return null
    },
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchInterval: isGeneratingPersistent ? 10000 : false, // Poll every 10s while generating
  })

  const todaySongs = todayData?.songs || []
  const songsCount = todayData?.count || 0
  const dailyLimit = todayData?.daily_limit || 3
  const limitReached = todayData?.limit_reached || false
  const hoursUntilReset = todayData?.hours_until_reset || 0
  const minutesUntilReset = todayData?.minutes_until_reset || 0

  // Mutation to generate a new song
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!session?.access_token) {
        throw new Error('You must be logged in to generate a song')
      }

      // Notify parent that generation started
      if (onGenerationStart) {
        onGenerationStart()
      }

      setErrorMessage('')
      const initialStatus = 'Gathering your daily context (news, weather, calendar)...'
      setStatusMessage(initialStatus)
      setIsGeneratingPersistent(true)
      
      // Save generation state to localStorage
      localStorage.setItem('song_generation_state', JSON.stringify({
        startTime: Date.now(),
        statusMessage: initialStatus
      }))
      
      // Use retry mechanism for the API call
      return await withRetry(
        async () => {
          // Get location from localStorage
          const savedLocation = localStorage.getItem('user_location')
          let locationParam = 'Cupertino' // Default fallback
          
          if (savedLocation) {
            try {
              const location = JSON.parse(savedLocation)
              // If city is provided, use it; otherwise use coordinates
              locationParam = location.city || `${location.lat},${location.lon}`
              console.log('📍 Using location for song generation:', locationParam)
            } catch (e) {
              console.warn('Failed to parse saved location, using default')
            }
          }
          
          // Use FormData for file upload
          const formData = new FormData()
          formData.append('location', locationParam)
          
          if (customTitle) {
            formData.append('custom_title', customTitle)
          }
          if (customCover) {
            formData.append('custom_cover', customCover)
          }
          // Add preference overrides if provided
          if (overrideGenres.length > 0) {
            formData.append('override_genres', JSON.stringify(overrideGenres))
          }
          if (overrideVocal) {
            formData.append('override_vocal', overrideVocal)
          }
          if (overrideMood) {
            formData.append('override_mood', overrideMood)
          }
          
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/songs/generate`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`
              },
              body: formData
            }
          )

          if (!response.ok) {
            let errorMessage = 'Failed to generate song'
            let errorCode = ''
            try {
              const errorData = await response.json()
              // Handle the detail object from backend
              if (typeof errorData.detail === 'object') {
                errorMessage = errorData.detail.message || errorMessage
                errorCode = errorData.detail.code || ''
              } else {
                errorMessage = errorData.detail || errorMessage
                errorCode = errorData.code || ''
              }
            } catch {
              errorMessage = `Server error: ${response.status} ${response.statusText}`
            }
            const error = new Error(errorMessage) as Error & { status?: number; code?: string }
            error.status = response.status
            error.code = errorCode
            throw error
          }

          setStatusMessage('Generating lyrics and music tags...')
          const song = await response.json()
          
          // Debug: Log the received song data
          console.log('🎵 [SongGenerator] Received song data:', {
            title: song.title,
            description: song.description,
            genre_tags: song.genre_tags,
            lyrics_length: song.lyrics?.length || 0,
            lyrics_preview: song.lyrics?.substring(0, 200) || 'No lyrics',
            has_verse: song.lyrics?.toLowerCase().includes('[verse]'),
            has_chorus: song.lyrics?.toLowerCase().includes('[chorus]'),
            audio_url: song.audio_url
          })
          
          // Debug: Log full lyrics to verify completeness
          if (song.lyrics) {
            console.log('📝 [SongGenerator] Full lyrics:\n', song.lyrics)
            const verseCount = (song.lyrics.toLowerCase().match(/\[verse\]/g) || []).length
            const chorusCount = (song.lyrics.toLowerCase().match(/\[chorus\]/g) || []).length
            console.log(`📊 [SongGenerator] Section counts - Verse: ${verseCount}, Chorus: ${chorusCount}`)
          }
          
          return song
        },
        {
          maxRetries: 2,
          delayMs: 2000,
          backoff: true,
          onRetry: (attempt) => {
            setRetryCount(attempt)
            setStatusMessage(`Retrying... (Attempt ${attempt}/2)`)
          }
        }
      )
    },
    onSuccess: (song) => {
      setStatusMessage('Your song is ready!')
      setErrorMessage('')
      setRetryCount(0)
      setIsGeneratingPersistent(false)
      // Clear generation state from localStorage
      localStorage.removeItem('song_generation_state')
      // Invalidate and refetch today's songs data
      queryClient.invalidateQueries({ queryKey: ['todaySong'] })
      queryClient.invalidateQueries({ queryKey: ['allSongs'] })
      // Notify parent that generation completed
      if (onGenerationComplete) {
        onGenerationComplete(song)
      }
    },
    onError: (err: Error) => {
      logError(err, 'SongGenerator')
      const friendlyMessage = getUserFriendlyErrorMessage(err)
      setErrorMessage(friendlyMessage)
      setStatusMessage('')
      setRetryCount(0)
      setIsGeneratingPersistent(false)
      // Clear generation state from localStorage
      localStorage.removeItem('song_generation_state')
      // Notify parent that generation completed (with error)
      if (onGenerationComplete) {
        onGenerationComplete()
      }
    }
  })

  const handleGenerateSong = () => {
    if (limitReached) {
      // Daily limit reached
      return
    }
    setStatusMessage('Starting song generation...')
    generateMutation.mutate()
  }

  return (
    <div className="space-y-6">
      {/* Daily Limit Status */}
      {limitReached && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-500 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-2">
                Daily Limit Reached
              </h3>
              <p className="text-orange-800 dark:text-orange-200 mb-2">
                You've generated <strong>{songsCount} out of {dailyLimit}</strong> songs today.
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Your limit will reset in <strong>{hoursUntilReset}h {minutesUntilReset}m</strong> at midnight.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Songs List */}
      {todaySongs.length > 0 && !limitReached && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <MusicalNoteIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Songs Generated Today ({songsCount}/{dailyLimit})
              </h3>
              <div className="space-y-2">
                {todaySongs.map((song: any) => (
                  <div key={song.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{song.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{song.description}</p>
                    </div>
                    <button
                      onClick={() => window.location.href = `/song/${song.id}`}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Listen
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generation Button */}
      {!generateMutation.data && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <SparklesIcon className="w-16 h-16 mx-auto text-brand-primary mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Generate Your Daily Song
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Create a personalized song based on today's news, weather, and your calendar
            </p>
          </div>

          {/* Advanced Options Toggle */}
          <div className="mb-6 text-center">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              disabled={generateMutation.isPending || checkingToday}
              className="text-brand-primary hover:text-brand-primary/80 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showAdvanced ? '▼ Hide' : '▶ Show'} Advanced Options (Optional)
            </button>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="mb-6 space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Song Title (Optional)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  disabled={generateMutation.isPending || checkingToday}
                  placeholder="Leave empty for AI-generated title"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Album Cover (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCustomCover(e.target.files?.[0] || null)}
                  disabled={generateMutation.isPending || checkingToday}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-primary file:text-white hover:file:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {customCover && (
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Selected: {customCover.name}
                    </p>
                    <button
                      onClick={() => setCustomCover(null)}
                      disabled={generateMutation.isPending || checkingToday}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              
              {/* Preference Overrides */}
              <div className="pt-4 border-t border-gray-300 dark:border-gray-600">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Override Preferences (Just for this song)
                </h4>
                
                {/* Music Genres */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Music Genres
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {MUSIC_GENRES.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => setOverrideGenres(prev => 
                          prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
                        )}
                        disabled={generateMutation.isPending || checkingToday}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          overrideGenres.includes(genre)
                            ? 'bg-brand-secondary text-white border-brand-secondary'
                            : 'border-gray-300 dark:border-gray-600 hover:border-brand-secondary'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Vocal Preference */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Vocal Preference
                  </label>
                  <div className="flex gap-2">
                    {VOCAL_PREFERENCES.map((vocal) => (
                      <button
                        key={vocal}
                        onClick={() => setOverrideVocal(overrideVocal === vocal ? '' : vocal)}
                        disabled={generateMutation.isPending || checkingToday}
                        className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          overrideVocal === vocal
                            ? 'bg-brand-accent text-gray-900 border-brand-accent'
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
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Mood Preference
                  </label>
                  <div className="flex gap-2">
                    {MOOD_PREFERENCES.map((mood) => (
                      <button
                        key={mood}
                        onClick={() => setOverrideMood(overrideMood === mood ? '' : mood)}
                        disabled={generateMutation.isPending || checkingToday}
                        className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          overrideMood === mood
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'border-gray-300 dark:border-gray-600 hover:border-brand-primary'
                        }`}
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {errorMessage && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                    Generation Failed
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {errorMessage}
                  </p>
                  {retryCount > 0 && (
                    <p className="text-xs text-red-600 dark:text-red-500 mt-2">
                      Attempted {retryCount} {retryCount === 1 ? 'retry' : 'retries'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={handleGenerateSong}
              disabled={generateMutation.isPending || checkingToday || limitReached}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-brand-primary text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-3 touch-manipulation"
            >
              {generateMutation.isPending || checkingToday ? (
                <>
                  <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {checkingToday ? 'Checking...' : 'Generating...'}
                </>
              ) : limitReached ? (
                <>
                  <ExclamationTriangleIcon className="w-6 h-6" />
                  Daily Limit Reached
                </>
              ) : (
                <>
                  <MusicalNoteIcon className="w-6 h-6" />
                  Generate Song {songsCount > 0 && `(${songsCount}/${dailyLimit})`}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Loading State with Progress */}
      {(generateMutation.isPending || isGeneratingPersistent) && statusMessage && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div>
              <p className="text-blue-900 dark:text-blue-100 font-medium">
                {statusMessage}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                This may take a few minutes... {isGeneratingPersistent && !generateMutation.isPending && '(Checking for completion...)'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {generateMutation.isError && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <svg className="h-6 w-6 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-red-900 dark:text-red-100 font-semibold mb-1">
                Generation Failed
              </h3>
              <p className="text-red-800 dark:text-red-200 text-sm">
                {generateMutation.error?.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={() => generateMutation.mutate()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Generation Warning */}
      {generateMutation.data?.image_generation_failed && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> There was an issue with image generation. Using default artwork.
            </p>
          </div>
        </div>
      )}

      {/* Generated Song Display */}
      {generateMutation.data && (
        <div className="bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 dark:from-brand-primary/20 dark:to-brand-secondary/20 border-2 border-brand-primary rounded-lg p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary rounded-full mb-4">
              <MusicalNoteIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {generateMutation.data.title}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {generateMutation.data.description}
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {generateMutation.data.genre_tags && generateMutation.data.genre_tags.split(/[\s,]+/).filter((tag: string) => tag.trim()).map((tag: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-brand-primary/20 text-brand-primary dark:text-brand-secondary rounded-full text-sm font-medium"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.href = `/song/${generateMutation.data.id}`}
              className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 transition-colors font-semibold"
            >
              Listen Now
            </button>
            <button
              onClick={() => generateMutation.reset()}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
