import { useState, useRef, useEffect } from 'react'
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/solid'

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

interface SongPlayerProps {
  song: Song
  album?: Album
  isSharedView?: boolean
}

export function SongPlayer({ song, album, isSharedView = false }: SongPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [showCopyNotification, setShowCopyNotification] = useState(false)

  const vinylDiskUrl = album?.vinyl_disk_url || song.vinyl_disk_url

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => {
      setIsPlaying(false)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    audio.currentTime = percentage * duration
  }

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleDownload = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(`Download "${song.title}"?\n\nThis will download the song to your device.`)
    
    if (!confirmed) return
    
    try {
      // Fetch the audio file as blob to force download
      const response = await fetch(song.audio_url)
      const blob = await response.blob()
      
      // Create blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `${song.title.replace(/[^a-z0-9\s]/gi, '_').replace(/\s+/g, '_')}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up blob URL
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to download song. Please try again.')
    }
  }

  const handleShare = (platform: string) => {
    const shareUrl = window.location.href
    const shareText = `Check out this song: ${song.title} - ${song.description}`

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank',
          'width=600,height=400'
        )
        break
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          '_blank',
          'width=600,height=400'
        )
        break
      case 'whatsapp':
        window.open(
          `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
          '_blank'
        )
        break
      case 'copy':
        navigator.clipboard.writeText(shareUrl).then(() => {
          setShowCopyNotification(true)
          setTimeout(() => setShowCopyNotification(false), 3000)
        })
        break
    }
  }

  const genreTags = song.genre_tags.split(',').map(tag => tag.trim())

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Copy notification toast */}
      {showCopyNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slideInRight">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Link copied to clipboard!</span>
          </div>
        </div>
      )}

      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#ee7752] via-[#e73c7e] via-[#23a6d5] via-[#23d5ab] to-[#ee7752] bg-[length:400%_400%] animate-waterGradient" />
      
      {/* Wave overlay layer 1 */}
      <div className="absolute inset-0 opacity-30 animate-wave1" style={{
        background: `
          radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
          radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
          linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)
        `,
        backgroundSize: '200% 200%, 200% 200%, 300% 100%'
      }} />
      
      {/* Wave overlay layer 2 */}
      <div className="absolute inset-0 opacity-30 animate-wave2" style={{
        background: `
          radial-gradient(circle at 60% 30%, rgba(35, 166, 213, 0.3) 0%, transparent 40%),
          radial-gradient(circle at 40% 70%, rgba(238, 119, 82, 0.3) 0%, transparent 40%),
          linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.1), transparent)
        `,
        backgroundSize: '250% 250%, 250% 250%, 100% 300%'
      }} />

      {/* Player container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-12 max-w-2xl w-full mx-4">
          
          {/* Vinyl disk */}
          <div className="flex justify-center mb-6 md:mb-8">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-80 lg:h-80">
              <img
                src={vinylDiskUrl}
                alt={song.title}
                className={`w-full h-full rounded-full shadow-2xl object-cover transition-transform duration-300 ${
                  isPlaying ? 'animate-spin-slow' : ''
                }`}
              />
            </div>
          </div>

          {/* Song info */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3 px-2">
              {song.title}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-4 md:mb-6 px-2">
              {song.description}
            </p>
            
            {/* Genre tags */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {genreTags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Date */}
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {new Date(song.created_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div
              onClick={handleProgressClick}
              className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer overflow-hidden"
            >
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-100"
                style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 mb-6 md:mb-8">
            <button
              onClick={togglePlayPause}
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation"
            >
              {isPlaying ? (
                <PauseIcon className="w-10 h-10" />
              ) : (
                <PlayIcon className="w-10 h-10 ml-1" />
              )}
            </button>
          </div>

          {/* Volume control */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <SpeakerXMarkIcon className="w-6 h-6" />
              ) : (
                <SpeakerWaveIcon className="w-6 h-6" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume * 100}
              onChange={(e) => {
                const newVolume = parseInt(e.target.value) / 100
                setVolume(newVolume)
                if (newVolume > 0) setIsMuted(false)
              }}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-indigo-600 [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Download and Share buttons */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            {/* Download Button */}
            {!isSharedView && (
              <div className="mb-6 text-center">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary/90 hover:to-brand-secondary/90 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Song
                </button>
              </div>
            )}
            
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
              Share this song
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleShare('twitter')}
                className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-black to-gray-800 hover:from-gray-900 hover:to-black text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
                title="Share on X (Twitter)"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
                title="Share on Facebook"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 text-2xl"
                title="Share on WhatsApp"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
                title="Copy Link"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Branding for shared view */}
          {isSharedView && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Powered by <span className="font-bold text-brand-primary">TuneTools</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Audio element */}
      <audio 
        ref={audioRef} 
        src={song.audio_url} 
        preload="metadata"
        onError={(e) => {
          console.error('Audio loading error:', e)
          console.error('Audio URL:', song.audio_url)
        }}
        onLoadedMetadata={() => {
          console.log('Audio loaded successfully')
          console.log('Duration:', audioRef.current?.duration)
        }}
      />
    </div>
  )
}
