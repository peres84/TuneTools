import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { DashboardLayout } from '../components/DashboardLayout'
import { SongList } from '../components/SongList'
import { AlbumCollection } from '../components/AlbumCollection'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { SongSkeleton } from '../components/LoadingSkeletons'
import { cacheManager, CACHE_KEYS } from '../utils/cacheManager'

export function MySongsPage() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch all songs with caching
  const { data: songsData, isLoading: songsLoading } = useQuery({
    queryKey: ['allSongs'],
    queryFn: async () => {
      if (!session?.access_token) return { songs: [], total: 0 }

      // Try localStorage cache first
      const cached = cacheManager.get(CACHE_KEYS.SONGS_LIST, 30)
      if (cached) {
        return cached
      }

      // Fetch from API
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/songs/list?limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch songs')
      const data = await response.json()
      
      // Cache the response
      cacheManager.set(CACHE_KEYS.SONGS_LIST, data, 30)
      
      return data
    },
    enabled: !!session?.access_token,
    staleTime: Infinity, // Data never becomes stale automatically
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: false // Don't refetch on reconnect
  })

  // Fetch songs for selected album with caching
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
    enabled: !!session?.access_token && !!selectedAlbumId,
    staleTime: Infinity, // Data never becomes stale automatically
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: false // Don't refetch on reconnect
  })

  const handleAlbumClick = (albumId: string) => {
    setSelectedAlbumId(albumId)
  }

  const handleSongClick = (songId: string) => {
    // Navigate to dedicated song page for sharing
    window.location.href = `/song/${songId}`
  }

  const handleBackToOverview = () => {
    setSelectedAlbumId(null)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    
    // Clear cache first
    cacheManager.remove(CACHE_KEYS.SONGS_LIST)
    cacheManager.remove(CACHE_KEYS.ALBUMS_LIST)
    
    // Then invalidate queries to refetch
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['albums'] }),
      queryClient.invalidateQueries({ queryKey: ['allSongs'] }),
      queryClient.invalidateQueries({ queryKey: ['album', selectedAlbumId] })
    ])
    
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // If an album is selected, show only that album's songs
  if (selectedAlbumId) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <button
            onClick={handleBackToOverview}
            className="mb-6 flex items-center gap-2 text-brand-primary hover:text-brand-primary/80 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Music
          </button>

          {albumSongsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <SongSkeleton key={i} />
              ))}
            </div>
          ) : (
            <SongList
              songs={albumWithSongs?.songs || []}
              albumName={albumWithSongs?.name}
              onSongClick={handleSongClick}
            />
          )}
        </div>
      </DashboardLayout>
    )
  }

  // Default view: show both albums and all songs
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-brand-primary mb-2">
              My Music
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your personalized songs organized into weekly albums
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Albums Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-brand-primary mb-6 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Albums
          </h2>
          <AlbumCollection onAlbumClick={handleAlbumClick} />
        </div>

        {/* Songs Section */}
        <div>
          <h2 className="text-2xl font-bold text-brand-primary mb-6 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            All Songs
          </h2>
          
          {songsLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <SongSkeleton key={i} />
              ))}
            </div>
          ) : (
            <SongList songs={songsData?.songs || []} onSongClick={handleSongClick} />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
