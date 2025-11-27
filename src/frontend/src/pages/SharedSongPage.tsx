import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { SongPlayer } from '../components/SongPlayer'

interface Song {
  id: string
  title: string
  description: string
  audio_url: string
  created_at: string
  genre_tags: string
  lyrics: string
  album_id: string
}

interface SharedSongData {
  song: Song
  album: {
    id: string
    name: string
    vinyl_disk_url: string
    week_start: string
    week_end: string
  } | null
  branding: {
    message: string
    platform: string
  }
}

export function SharedSongPage() {
  const { shareToken } = useParams<{ shareToken: string }>()
  const [songData, setSongData] = useState<SharedSongData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSharedSong = async () => {
      if (!shareToken) {
        setError('Invalid share link')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/share/song/${shareToken}`
        )

        if (!response.ok) {
          if (response.status === 404) {
            setError('Song not found')
          } else {
            setError('Failed to load song')
          }
          setLoading(false)
          return
        }

        const data = await response.json()
        setSongData(data)
      } catch (err) {
        console.error('Error fetching shared song:', err)
        setError('Failed to load song')
      } finally {
        setLoading(false)
      }
    }

    fetchSharedSong()
  }, [shareToken])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 dark:from-brand-primary/20 dark:to-brand-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-16 w-16 mx-auto text-brand-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading song...</p>
        </div>
      </div>
    )
  }

  if (error || !songData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 dark:from-brand-primary/20 dark:to-brand-secondary/20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <svg className="w-24 h-24 mx-auto text-red-500 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Song Not Found'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            This song may have been removed or the link is invalid.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 transition-colors font-semibold"
          >
            Go to TuneTools
          </a>
        </div>
      </div>
    )
  }

  const { song, album, branding } = songData
  const vinylDiskUrl = album?.vinyl_disk_url || ''

  // Update document title and meta tags for social sharing
  useEffect(() => {
    const pageTitle = `${song.title} - ${branding.message}`
    const pageDescription = song.description || `Listen to "${song.title}" - a personalized daily song created with ${branding.platform}`
    const pageUrl = `${window.location.origin}/share/${shareToken}`
    const imageUrl = vinylDiskUrl || `${window.location.origin}/images/logo-disk.png`

    // Update title
    document.title = pageTitle

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = true) => {
      const attribute = isProperty ? 'property' : 'name'
      let meta = document.querySelector(`meta[${attribute}="${property}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute(attribute, property)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    // Basic meta tags
    updateMetaTag('description', pageDescription, false)
    
    // Open Graph tags
    updateMetaTag('og:type', 'music.song')
    updateMetaTag('og:url', pageUrl)
    updateMetaTag('og:title', pageTitle)
    updateMetaTag('og:description', pageDescription)
    updateMetaTag('og:image', imageUrl)
    updateMetaTag('og:image:width', '1200')
    updateMetaTag('og:image:height', '1200')
    updateMetaTag('og:site_name', 'TuneTools')
    
    // Twitter tags
    updateMetaTag('twitter:card', 'summary_large_image', false)
    updateMetaTag('twitter:url', pageUrl, false)
    updateMetaTag('twitter:title', pageTitle, false)
    updateMetaTag('twitter:description', pageDescription, false)
    updateMetaTag('twitter:image', imageUrl, false)
    
    // Music metadata
    updateMetaTag('music:musician', branding.platform + ' AI')
    updateMetaTag('music:release_date', song.created_at)
  }, [song, vinylDiskUrl, shareToken, branding])

  return (
    <>

      <div className="min-h-screen bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 dark:from-brand-primary/20 dark:to-brand-secondary/20">
        {/* Branding Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 py-4 px-6">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/images/logo-disk.png" 
                alt="TuneTools" 
                className="w-10 h-10"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {branding.message}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Powered by {branding.platform}
                </p>
              </div>
            </div>
            <a
              href="/"
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm font-semibold"
            >
              Create Your Own
            </a>
          </div>
        </div>

        {/* Song Player */}
        <div className="container mx-auto px-4 py-8">
          <SongPlayer
            song={{
              ...song,
              vinyl_disk_url: vinylDiskUrl
            }}
            album={album ? {
              id: album.id,
              name: album.name,
              vinyl_disk_url: album.vinyl_disk_url
            } : undefined}
            isSharedView={true}
          />
        </div>

        {/* Footer */}
        <div className="text-center py-8 px-4">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Want your own personalized daily songs?
          </p>
          <a
            href="/"
            className="inline-block px-8 py-3 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 transition-colors font-semibold text-lg"
          >
            Try {branding.platform} Free
          </a>
        </div>
      </div>
    </>
  )
}
