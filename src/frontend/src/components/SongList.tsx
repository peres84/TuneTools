import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { MusicalNoteIcon, ClockIcon, CalendarIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { OptionsMenu } from './OptionsMenu'
import { EditModal } from './EditModal'
import { ConfirmModal } from './ConfirmModal'
import { cacheManager, CACHE_KEYS } from '../utils/cacheManager'

interface Song {
  id: string
  title: string
  description: string
  audio_url: string
  created_at: string
  genre_tags: string
  lyrics: string
}

interface SongListProps {
  songs: Song[]
  albumName?: string
  onSongClick?: (songId: string) => void
}

export function SongList({ songs, albumName, onSongClick }: SongListProps) {
  const navigate = useNavigate()
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [deletingSong, setDeletingSong] = useState<Song | null>(null)

  console.log('🎵 [SongList] Render - editingSong:', editingSong?.id, 'deletingSong:', deletingSong?.id)

  const handleSongClick = (songId: string) => {
    console.log('🎯 [SongList] Song clicked:', songId)
    if (onSongClick) {
      onSongClick(songId)
    } else {
      navigate(`/song/${songId}`)
    }
  }

  // Update song mutation
  const updateSongMutation = useMutation({
    mutationFn: async ({ songId, title, description }: { songId: string; title?: string; description?: string }) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/songs/${songId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ title, description })
        }
      )
      if (!response.ok) throw new Error('Failed to update song')
      return response.json()
    },
    onSuccess: () => {
      setEditingSong(null) // Close modal on success
      queryClient.invalidateQueries({ queryKey: ['allSongs'] })
      queryClient.invalidateQueries({ queryKey: ['album'] })
    }
  })

  // Delete song mutation
  const deleteSongMutation = useMutation({
    mutationFn: async (songId: string) => {
      console.log('🗑️ [SongList] Deleting song:', songId)
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/songs/${songId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      )
      if (!response.ok) {
        console.error('❌ [SongList] Delete failed:', response.status, response.statusText)
        throw new Error('Failed to delete song')
      }
      const result = await response.json()
      console.log('✅ [SongList] Delete successful:', result)
      return result
    },
    onSuccess: () => {
      console.log('🎉 [SongList] Delete mutation success, closing modal')
      setDeletingSong(null) // Close modal on success
      
      // Clear cache to ensure UI updates
      cacheManager.remove(CACHE_KEYS.SONGS_LIST)
      cacheManager.remove(CACHE_KEYS.ALBUMS_LIST)
      
      queryClient.invalidateQueries({ queryKey: ['allSongs'] })
      queryClient.invalidateQueries({ queryKey: ['album'] })
      queryClient.invalidateQueries({ queryKey: ['albums'] })
    },
    onError: (error) => {
      console.error('💥 [SongList] Delete mutation error:', error)
    }
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (!songs || songs.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
        <MusicalNoteIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {albumName ? `No Songs in ${albumName}` : 'No Songs Yet'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {albumName ? 'This album is empty' : 'Generate your first song to get started!'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {albumName && (
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {albumName}
        </h2>
      )}

      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {songs.map((song) => (
          <div
            key={song.id}
            onClick={(e) => {
              console.log('🎵 [SongList] Song card clicked:', song.id, 'target:', e.target)
              handleSongClick(song.id)
            }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group active:scale-95 touch-manipulation relative"
          >
            {/* Song Card Header */}
            <div className="bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 dark:from-brand-primary/20 dark:to-brand-secondary/20 p-6 group-hover:from-brand-primary/20 group-hover:to-brand-secondary/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-brand-primary transition-colors">
                    {song.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {song.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <MusicalNoteIcon className="w-8 h-8 text-brand-primary group-hover:scale-110 transition-transform" />
                  <div 
                    onClick={(e) => {
                      console.log('🛑 [SongList] OptionsMenu wrapper clicked, stopping propagation')
                      e.stopPropagation()
                    }}
                    className="relative z-10"
                  >
                    <OptionsMenu
                      items={[
                        {
                          label: 'Rename Song',
                          icon: <PencilIcon className="w-5 h-5" />,
                          onClick: () => {
                            console.log('✏️ [SongList] Rename clicked for song:', song.id)
                            setEditingSong(song)
                          }
                        },
                        {
                          label: 'Delete Song',
                          icon: <TrashIcon className="w-5 h-5" />,
                          onClick: () => {
                            console.log('🗑️ [SongList] Delete clicked for song:', song.id)
                            setDeletingSong(song)
                          },
                          variant: 'danger'
                        }
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Genre Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {song.genre_tags.split(/[\s,]+/).filter(tag => tag.trim()).slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-brand-primary/20 text-brand-primary dark:text-brand-secondary rounded-full text-xs font-medium"
                  >
                    {tag.trim()}
                  </span>
                ))}
                {song.genre_tags.split(/[\s,]+/).filter(tag => tag.trim()).length > 3 && (
                  <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                    +{song.genre_tags.split(/[\s,]+/).filter(tag => tag.trim()).length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* Song Card Footer */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{formatDate(song.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>{formatTime(song.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Hover Effect Overlay */}
            <div className="absolute inset-0 bg-brand-primary/0 group-hover:bg-brand-primary/5 transition-colors pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Edit Song Modal */}
      <EditModal
        isOpen={!!editingSong}
        onClose={() => setEditingSong(null)}
        onSave={(title) => {
          if (editingSong) {
            updateSongMutation.mutate({ 
              songId: editingSong.id, 
              title,
              description: editingSong.description 
            })
          }
        }}
        title="Rename Song"
        label="Song Title"
        initialValue={editingSong?.title || ''}
        placeholder="Enter song title"
      />

      {/* Delete Song Confirmation */}
      <ConfirmModal
        isOpen={!!deletingSong}
        onClose={() => setDeletingSong(null)}
        onConfirm={() => {
          if (deletingSong) {
            deleteSongMutation.mutate(deletingSong.id)
          }
        }}
        title="Delete Song"
        message={`Are you sure you want to delete "${deletingSong?.title}"? This action cannot be undone.`}
        confirmText="Delete Song"
        confirmVariant="danger"
        isLoading={deleteSongMutation.isPending}
      />
    </div>
  )
}
