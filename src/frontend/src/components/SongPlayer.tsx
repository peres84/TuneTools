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
          alert('Link copied to clipboard!')
        })
        break
    }
  }

  const genreTags = song.genre_tags.split(',').map(tag => tag.trim())

  return (
    <div className="min-h-screen relative overflow-hidden">
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
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl w-full">
          
          {/* Vinyl disk */}
          <div className="flex justify-center mb-8">
            <div className="relative w-64 h-64 md:w-80 md:h-80">
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              {song.title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
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
          <div className="flex items-center justify-center gap-6 mb-6">
            <button
              onClick={togglePlayPause}
              className="w-20 h-20 flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
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

          {/* Share buttons */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
              Share this song
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleShare('twitter')}
                className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
                title="Share on Twitter"
              >
                𝕏
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 text-xl font-bold"
                title="Share on Facebook"
              >
                f
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 text-2xl"
                title="Share on WhatsApp"
              >
                ⋮
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
                title="Copy Link"
              >
                🔗
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
      <audio ref={audioRef} src={song.audio_url} preload="metadata" />
    </div>
  )
}
