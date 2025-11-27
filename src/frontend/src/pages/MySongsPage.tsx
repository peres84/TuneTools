import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { DashboardLayout } from '../components/DashboardLayout'
import { SongList } from '../components/SongList'
import { AlbumCollection } from '../components/AlbumCollection'

export function MySongsPage() {
  const { session } = useAuth()
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)

  // Fetch all songs
  const { data: songsData, isLoading: songsLoading } = useQuery({
    queryKey: ['allSongs'],
    queryFn: async () => {
      if (!session?.access_token) return { songs: [], total: 0 }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/songs/list?limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch songs')
      return response.json()
    },
    enabled: !!session?.access_token
  })

  // Fetch songs for selected album
  const { data: albumWithSongs, isLoading: albumSongsLoading } = useQuery({
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

  const handleBackToOverview = () => {
    setSelectedAlbumId(null)
  }

  // If an album is selected, show only that album's songs
  if (selectedAlbumId) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={handleBackToOverview}
            className="mb-6 flex items-center gap-2 text-brand-primary hover:text-brand-primary/80 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Music
          </button>

          {albumSongsLoading ? (
            <div className="text-center py-12">
              <svg className="animate-spin h-12 w-12 mx-auto text-brand-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 dark:text-gray-400">Loading album songs...</p>
            </div>
          ) : (
            <SongList
              songs={albumWithSongs?.songs || []}
              albumName={albumWithSongs?.name}
            />
          )}
        </div>
      </DashboardLayout>
    )
  }

  // Default view: show both albums and all songs
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Music
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your personalized songs organized into weekly albums
          </p>
        </div>

        {/* Albums Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Albums
          </h2>
          <AlbumCollection onAlbumClick={handleAlbumClick} />
        </div>

        {/* Songs Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            All Songs
          </h2>
          
          {songsLoading ? (
            <div className="text-center py-12">
              <svg className="animate-spin h-12 w-12 mx-auto text-brand-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 dark:text-gray-400">Loading songs...</p>
            </div>
          ) : (
            <SongList songs={songsData?.songs || []} />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
