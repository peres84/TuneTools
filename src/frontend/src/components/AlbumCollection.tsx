import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { MusicalNoteIcon, CalendarIcon, PencilIcon, TrashIcon, PhotoIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { OptionsMenu } from './OptionsMenu'
import { EditModal } from './EditModal'
import { ConfirmModal } from './ConfirmModal'
import { AlbumSkeleton } from './LoadingSkeletons'
import { getUserFriendlyErrorMessage } from '../utils/errorMessages'
import { cacheManager, CACHE_KEYS } from '../utils/cacheManager'
import fallbackAlbumCover from '../assets/logo-disk.png'

interface Album {
  id: string
  name: string
  vinyl_disk_url: string
  week_start: string
  week_end: string
  song_count: number
  created_at: string
}

interface AlbumCollectionProps {
  onAlbumClick?: (albumId: string) => void
}

export function AlbumCollection({ onAlbumClick }: AlbumCollectionProps) {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null)
  const [deletingAlbum, setDeletingAlbum] = useState<Album | null>(null)
  const [loadingAlbumId, setLoadingAlbumId] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const { data: albums, isLoading, error } = useQuery({
    queryKey: ['albums'],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      // Try localStorage cache first
      const cached = cacheManager.get<Album[]>(CACHE_KEYS.ALBUMS_LIST, 30)
      if (cached) {
        return cached
      }

      // Fetch from API
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/albums/list`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch albums')
      }

      const data = await response.json() as Album[]
      
      // Cache the response
      cacheManager.set(CACHE_KEYS.ALBUMS_LIST, data, 30)

      return data
    },
    enabled: !!session?.access_token,
    staleTime: Infinity, // Data never becomes stale automatically
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: false // Don't refetch on reconnect
  })

  // Update album name mutation
  const updateAlbumMutation = useMutation({
    mutationFn: async ({ albumId, name }: { albumId: string; name: string }) => {
      setLoadingAlbumId(albumId)
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/albums/${albumId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ name })
        }
      )
      if (!response.ok) throw new Error('Failed to update album')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] })
      setLoadingAlbumId(null)
    },
    onError: () => {
      setLoadingAlbumId(null)
    }
  })

  // Delete album mutation
  const deleteAlbumMutation = useMutation({
    mutationFn: async (albumId: string) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/albums/${albumId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      )
      if (!response.ok) throw new Error('Failed to delete album')
      return response.json()
    },
    onSuccess: () => {
      // Clear cache to ensure UI updates
      cacheManager.remove(CACHE_KEYS.ALBUMS_LIST)
      cacheManager.remove(CACHE_KEYS.SONGS_LIST)
      
      queryClient.invalidateQueries({ queryKey: ['albums'] })
      queryClient.invalidateQueries({ queryKey: ['allSongs'] })
    }
  })

  // Update vinyl disk mutation
  const updateVinylDiskMutation = useMutation({
    mutationFn: async ({ albumId, file }: { albumId: string; file: File }) => {
      setLoadingAlbumId(albumId)
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/albums/${albumId}/vinyl-disk`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: formData
        }
      )
      if (!response.ok) throw new Error('Failed to update vinyl disk')
      return { albumId, data: await response.json() }
    },
    onSuccess: ({ albumId }) => {
      // Clear error state for this album since we successfully updated the image
      setImageErrors(prev => {
        const newSet = new Set(prev)
        newSet.delete(albumId)
        return newSet
      })
      
      queryClient.invalidateQueries({ queryKey: ['albums'] })
      setLoadingAlbumId(null)
    },
    onError: () => {
      setLoadingAlbumId(null)
    }
  })

  const handleFileSelect = (albumId: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        updateVinylDiskMutation.mutate({ albumId, file })
      }
    }
    input.click()
  }

  const formatDateRange = (weekStart: string, weekEnd: string) => {
    const start = new Date(weekStart)
    const end = new Date(weekEnd)
    
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    
    return `${startStr} - ${endStr}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading albums...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">
          Failed to load albums: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <AlbumSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-1">
              Failed to Load Albums
            </h3>
            <p className="text-sm text-red-700 dark:text-red-400">
              {getUserFriendlyErrorMessage(error)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!albums || albums.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 sm:p-12 text-center">
        <MusicalNoteIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Albums Yet
        </h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Generate your first song to create an album!
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {albums.map((album) => {
        const isLoading = loadingAlbumId === album.id
        return (
        <div
          key={album.id}
          onClick={() => !isLoading && onAlbumClick?.(album.id)}
          className={`group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:scale-105 active:scale-95 touch-manipulation ${
            isLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          {/* Album artwork */}
          <div className="relative aspect-square overflow-hidden bg-gray-200 dark:bg-gray-700">
            <img
              src={imageErrors.has(album.id) ? fallbackAlbumCover : album.vinyl_disk_url}
              alt={album.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={() => {
                console.log(`⚠️ [AlbumCollection] Failed to load image for album ${album.id}, using fallback`)
                setImageErrors(prev => new Set(prev).add(album.id))
              }}
              loading="lazy"
              key={album.vinyl_disk_url}
            />
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-white text-sm font-medium">Updating...</p>
                </div>
              </div>
            )}
            {/* Overlay on hover */}
            {!isLoading && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/90 dark:bg-gray-900/90 rounded-full p-4">
                    <MusicalNoteIcon className="w-8 h-8 text-brand-primary" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Album info */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate flex-1">
                {album.name}
              </h3>
              <div onClick={(e) => e.stopPropagation()} className="relative z-10">
                {!isLoading && (
                  <OptionsMenu
                    items={[
                      {
                        label: 'Rename Album',
                        icon: <PencilIcon className="w-5 h-5" />,
                        onClick: () => {}, // Disabled - no action
                        disabled: true
                      },
                      {
                        label: 'Change Cover',
                        icon: <PhotoIcon className="w-5 h-5" />,
                        onClick: () => handleFileSelect(album.id)
                      },
                      {
                        label: 'Delete Album',
                        icon: <TrashIcon className="w-5 h-5" />,
                        onClick: () => setDeletingAlbum(album),
                        variant: 'danger'
                      }
                    ]}
                  />
                )}
              </div>
            </div>
            
            {/* Date range */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <CalendarIcon className="w-4 h-4" />
              <span>{formatDateRange(album.week_start, album.week_end)}</span>
            </div>

            {/* Song count */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-medium text-brand-primary">
                  <MusicalNoteIcon className="w-4 h-4" />
                  <span>{album.song_count} {album.song_count === 1 ? 'song' : 'songs'}</span>
                </div>
              </div>
              
              {/* Progress indicator */}
              <div className="flex gap-1">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i < album.song_count
                        ? 'bg-brand-primary'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )})}

      {/* Edit Album Modal */}
      <EditModal
        isOpen={!!editingAlbum}
        onClose={() => setEditingAlbum(null)}
        onSave={(name) => {
          if (editingAlbum) {
            updateAlbumMutation.mutate({ albumId: editingAlbum.id, name })
          }
        }}
        title="Rename Album"
        label="Album Name"
        initialValue={editingAlbum?.name || ''}
        placeholder="Enter album name"
      />

      {/* Delete Album Confirmation */}
      <ConfirmModal
        isOpen={!!deletingAlbum}
        onClose={() => setDeletingAlbum(null)}
        onConfirm={() => {
          if (deletingAlbum) {
            deleteAlbumMutation.mutate(deletingAlbum.id)
          }
        }}
        title="Delete Album"
        message={`Are you sure you want to delete "${deletingAlbum?.name}"? This will also delete all ${deletingAlbum?.song_count} song(s) in this album. This action cannot be undone.`}
        confirmText="Delete Album"
        confirmVariant="danger"
      />
    </div>
  )
}
