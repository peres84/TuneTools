import { useNavigate } from 'react-router-dom'
import { MusicalNoteIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline'

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
}

export function SongList({ songs, albumName }: SongListProps) {
  const navigate = useNavigate()

  const handleSongClick = (songId: string) => {
    navigate(`/song/${songId}`)
  }

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
      <div className="text-center py-12">
        <MusicalNoteIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          {albumName ? `No songs in ${albumName} yet` : 'No songs yet'}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {songs.map((song) => (
          <div
            key={song.id}
            onClick={() => handleSongClick(song.id)}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
          >
            {/* Song Card Header */}
            <div className="bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 dark:from-brand-primary/20 dark:to-brand-secondary/20 p-6 group-hover:from-brand-primary/20 group-hover:to-brand-secondary/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-brand-primary transition-colors">
                    {song.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {song.description}
                  </p>
                </div>
                <MusicalNoteIcon className="w-8 h-8 text-brand-primary flex-shrink-0 ml-2 group-hover:scale-110 transition-transform" />
              </div>

              {/* Genre Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {song.genre_tags.split(' ').slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary dark:text-brand-secondary rounded text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
                {song.genre_tags.split(' ').length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                    +{song.genre_tags.split(' ').length - 3}
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
    </div>
  )
}
