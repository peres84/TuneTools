import { useState } from 'react'

interface OnboardingStep1Props {
  onNext: (preferences: PreferencesData) => void
}

export interface PreferencesData {
  categories: string[]
  musicGenres: string[]
  vocalPreference: string
  moodPreference: string
}

const CATEGORIES = [
  { id: 'technology', label: 'Technology', icon: '💻' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'science', label: 'Science', icon: '🔬' },
  { id: 'health', label: 'Health', icon: '🏥' },
  { id: 'politics', label: 'Politics', icon: '🏛️' },
  { id: 'art', label: 'Art & Culture', icon: '🎨' },
]

const MUSIC_GENRES = [
  { id: 'pop', label: 'Pop' },
  { id: 'rock', label: 'Rock' },
  { id: 'jazz', label: 'Jazz' },
  { id: 'classical', label: 'Classical' },
  { id: 'electronic', label: 'Electronic' },
  { id: 'indie', label: 'Indie' },
  { id: 'hiphop', label: 'Hip Hop' },
  { id: 'country', label: 'Country' },
]

const VOCAL_PREFERENCES = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'neutral', label: 'Neutral' },
]

const MOOD_PREFERENCES = [
  { id: 'uplifting', label: 'Uplifting', icon: '😊' },
  { id: 'calm', label: 'Calm', icon: '😌' },
  { id: 'energetic', label: 'Energetic', icon: '⚡' },
  { id: 'melancholic', label: 'Melancholic', icon: '😔' },
]

export function OnboardingStep1({ onNext }: OnboardingStep1Props) {
  const [categories, setCategories] = useState<string[]>([])
  const [musicGenres, setMusicGenres] = useState<string[]>([])
  const [vocalPreference, setVocalPreference] = useState<string>('neutral')
  const [moodPreference, setMoodPreference] = useState<string>('uplifting')
  const [error, setError] = useState<string | null>(null)

  const toggleCategory = (categoryId: string) => {
    setCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    )
  }

  const toggleGenre = (genreId: string) => {
    setMusicGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((g) => g !== genreId)
        : [...prev, genreId]
    )
  }

  const handleNext = () => {
    // Validation
    if (categories.length === 0) {
      setError('Please select at least one news category')
      return
    }
    if (musicGenres.length === 0) {
      setError('Please select at least one music genre')
      return
    }

    setError(null)
    onNext({
      categories,
      musicGenres,
      vocalPreference,
      moodPreference,
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Personalize Your Experience
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Tell us about your interests to create better daily songs
        </p>
      </div>

      {/* News Categories */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          News Categories (70% of your daily news)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Select categories you're interested in. We'll use these for 70% of your news, with 30% general news.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                categories.includes(category.id)
                  ? 'border-brand-primary bg-brand-primary text-white'
                  : 'border-gray-300 dark:border-gray-600 hover:border-brand-primary dark:hover:border-brand-primary'
              }`}
            >
              <div className="text-3xl mb-2">{category.icon}</div>
              <div className="font-medium">{category.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Music Genres */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Music Genres
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Choose your favorite music styles
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MUSIC_GENRES.map((genre) => (
            <button
              key={genre.id}
              onClick={() => toggleGenre(genre.id)}
              className={`p-3 rounded-lg border-2 transition-all ${
                musicGenres.includes(genre.id)
                  ? 'border-brand-secondary bg-brand-secondary text-white'
                  : 'border-gray-300 dark:border-gray-600 hover:border-brand-secondary dark:hover:border-brand-secondary'
              }`}
            >
              <div className="font-medium">{genre.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Vocal Preference */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Vocal Preference
        </h3>
        <div className="flex gap-3">
          {VOCAL_PREFERENCES.map((vocal) => (
            <button
              key={vocal.id}
              onClick={() => setVocalPreference(vocal.id)}
              className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                vocalPreference === vocal.id
                  ? 'border-brand-accent bg-brand-accent text-gray-900'
                  : 'border-gray-300 dark:border-gray-600 hover:border-brand-accent dark:hover:border-brand-accent'
              }`}
            >
              <div className="font-medium">{vocal.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Mood Preference */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Mood Preference
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MOOD_PREFERENCES.map((mood) => (
            <button
              key={mood.id}
              onClick={() => setMoodPreference(mood.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                moodPreference === mood.id
                  ? 'border-brand-primary bg-brand-primary text-white'
                  : 'border-gray-300 dark:border-gray-600 hover:border-brand-primary dark:hover:border-brand-primary'
              }`}
            >
              <div className="text-3xl mb-2">{mood.icon}</div>
              <div className="font-medium">{mood.label}</div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-brand-primary text-white rounded-lg font-semibold hover:bg-opacity-90 transition-all"
        >
          Next Step →
        </button>
      </div>
    </div>
  )
}
