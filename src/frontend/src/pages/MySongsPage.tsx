import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { SongList } from '../components/SongList'
import { AlbumCollection } from '../components/AlbumCollection'

export function MySongsPage() {
  const { session } = useAuth()
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)

  // Fetch songs for selected album
  const { data: albumWithSongs, isLoading: songsLoading } = useQuery({
    queryKey: ['album', selectedAlbumId],
    queryFn: async () => {
      if (!session?.access_token || !selectedAlbumId) return null

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/albums/${selectedAlbumId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch album songs')
      return response.json()
    },
    enabled: !!session?.access_token && !!selectedAlbumId
  })

  const handleAlbumClick = (albumId: string) => {
    setSelectedAlbumId(albumId)
  }

  const handleBackToAlbums = () => {
    setSelectedAlbumId(null)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {!selectedAlbumId ? (
        <>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            My Songs
          </h1>
          <AlbumCollection onAlbumClick={handleAlbumClick} />
        </>
      ) : (
        <>
          <button
            onClick={handleBackToAlbums}
            className="mb-6 flex items-center gap-2 text-brand-primary hover:text-brand-primary/80 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Albums
          </button>

          {songsLoading ? (
            <div className="text-center py-12">
              <svg className="animate-spin h-12 w-12 mx-auto text-brand-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 dark:text-gray-400">Loading songs...</p>
            </div>
          ) : (
            <SongList
              songs={albumWithSongs?.songs || []}
              albumName={albumWithSongs?.name}
            />
          )}
        </>
      )}
    </div>
  )
}
