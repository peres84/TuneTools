import { useState } from 'react'
import { MusicalNoteIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [generatedSong, setGeneratedSong] = useState<Song | null>(null)
  const [todaySong, setTodaySong] = useState<Song | null>(null)
  const [checkingToday, setCheckingToday] = useState(false)

  const checkTodaySong = async () => {
    if (!session?.access_token) {
      console.error('No access token available')
      return false
    }

    setCheckingToday(true)
    try {
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
        // Check if song is null (no song for today)
        if (song && song.id) {
          setTodaySong(song)
          return true
        }
        // No song for today - this is normal
        setTodaySong(null)
        return false
      }
      return false
    } catch (err) {
      console.error('Error checking today song:', err)
      return false
    } finally {
      setCheckingToday(false)
    }
  }

  const generateSong = async () => {
    if (!session?.access_token) {
      setError('You must be logged in to generate a song')
      return
    }

    setLoading(true)
    setError(null)
    setStatusMessage('Checking if you already have a song for today...')
    setGeneratedSong(null)

    try {
      // Check if song already exists for today
      const hasTodaySong = await checkTodaySong()
      if (hasTodaySong) {
        setStatusMessage('')
        setLoading(false)
        return
      }

      setStatusMessage('Gathering your daily context (news, weather, calendar)...')
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/songs/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({})
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
      
      setGeneratedSong(song)
      setStatusMessage('Your song is ready!')
      
      if (onGenerationComplete) {
        onGenerationComplete(song)
      }

    } catch (err) {
      console.error('Song generation error:', err)
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      setStatusMessage('')
    } finally {
      setLoading(false)
    }
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
      {!todaySong && !generatedSong && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <SparklesIcon className="w-16 h-16 mx-auto text-brand-primary mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Generate Your Daily Song
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Create a personalized song based on today's news, weather, and your calendar
            </p>
          </div>

          <button
            onClick={generateSong}
            disabled={loading || checkingToday}
            className="px-8 py-4 bg-brand-primary text-white text-lg font-semibold rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
          >
            {loading || checkingToday ? (
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
      )}

      {/* Loading State with Progress */}
      {loading && statusMessage && (
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
      {error && (
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
                {error}
              </p>
              <button
                onClick={generateSong}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Song Display */}
      {generatedSong && (
        <div className="bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 dark:from-brand-primary/20 dark:to-brand-secondary/20 border-2 border-brand-primary rounded-lg p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary rounded-full mb-4">
              <MusicalNoteIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {generatedSong.title}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {generatedSong.description}
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {generatedSong.genre_tags.split(',').map((tag, index) => (
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
              onClick={() => window.location.href = `/song/${generatedSong.id}`}
              className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 transition-colors font-semibold"
            >
              Listen Now
            </button>
            <button
              onClick={() => setGeneratedSong(null)}
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
