import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SongPlayer } from '../components/SongPlayer'
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

interface Album {
  id: string
  name: string
  vinyl_disk_url: string
}

export function SongPlayerPage() {
  const { songId } = useParams<{ songId: string }>()
  const { session } = useAuth()
  const navigate = useNavigate()
  const [song, setSong] = useState<Song | null>(null)
  const [album, setAlbum] = useState<Album | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSong = async () => {
      if (!songId) {
        setError('No song ID provided')
        setLoading(false)
        return
      }

      try {
        // Try with authentication first if available
        let response
        if (session?.access_token) {
          const { fetchWithAuth } = await import('../utils/apiClient')
          response = await fetchWithAuth(
            `${import.meta.env.VITE_API_BASE_URL}/api/songs/${songId}`
          )
        } else {
          // Public access (for shared songs)
          response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/songs/${songId}`
          )
        }

        if (!response.ok) {
          throw new Error('Failed to fetch song')
        }

        const data = await response.json()
        setSong(data.song)
        setAlbum(data.album)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load song')
      } finally {
        setLoading(false)
      }
    }

    fetchSong()
  }, [songId, session])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-brand-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading song...</p>
        </div>
      </div>
    )
  }

  if (error || !song) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-brand-dark p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'Song not found'}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <SongPlayer song={song} album={album || undefined} />
}
