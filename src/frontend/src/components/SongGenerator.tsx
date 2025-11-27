import { useState } from 'react'
import { MusicalNoteIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

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
  onGenerationComplete?: (song: Song) => void
}

export function SongGenerator({ onGenerationComplete }: SongGeneratorProps) {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [customTitle, setCustomTitle] = useState<string>('')
  const [customCover, setCustomCover] = useState<File | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Query to fetch today's song (cached)
  const { data: todaySong, isLoading: checkingToday } = useQuery({
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
        const song = await response.json()
        return song && song.id ? song : null
      }
      return null
    },
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false
  })

  // Mutation to generate a new song
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!session?.access_token) {
        throw new Error('You must be logged in to generate a song')
      }

      setStatusMessage('Gathering your daily context (news, weather, calendar)...')
      
      // Use FormData for file upload
      const formData = new FormData()
      if (customTitle) {
        formData.append('custom_title', customTitle)
      }
      if (customCover) {
        formData.append('custom_cover', customCover)
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
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorMessage
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      setStatusMessage('Generating lyrics and music tags...')
      const song = await response.json()
      return song
    },
    onSuccess: (song) => {
      setStatusMessage('Your song is ready!')
      // Invalidate and refetch today's song
      queryClient.invalidateQueries({ queryKey: ['todaySong'] })
      if (onGenerationComplete) {
        onGenerationComplete(song)
      }
    },
    onError: (err: Error) => {
      console.error('Song generation error:', err)
      setStatusMessage('')
    }
  })

  const handleGenerateSong = () => {
    if (todaySong) {
      // Song already exists for today
      return
    }
    setStatusMessage('Checking if you already have a song for today...')
    generateMutation.mutate()
  }

  return (
    <div className="space-y-6">
      {/* Today's Song Check */}
      {todaySong && (
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <MusicalNoteIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                You already have a song for today!
              </h3>
              <p className="text-green-800 dark:text-green-200 mb-4">
                <strong>{todaySong.title}</strong>
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                {todaySong.description}
              </p>
              <button
                onClick={() => window.location.href = `/song/${todaySong.id}`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Listen Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generation Button */}
      {!todaySong && !generateMutation.data && (
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
            </div>
          )}

          <div className="text-center">
            <button
              onClick={handleGenerateSong}
              disabled={generateMutation.isPending || checkingToday}
              className="px-8 py-4 bg-brand-primary text-white text-lg font-semibold rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-3"
            >
              {generateMutation.isPending || checkingToday ? (
                <>
                  <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {checkingToday ? 'Checking...' : 'Generating...'}
                </>
              ) : (
                <>
                  <MusicalNoteIcon className="w-6 h-6" />
                  Generate Song
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Loading State with Progress */}
      {generateMutation.isPending && statusMessage && (
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
                This may take a few minutes...
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
              {generateMutation.data.genre_tags.split(',').map((tag: string, index: number) => (
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
