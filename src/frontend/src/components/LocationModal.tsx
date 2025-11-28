import { useState } from 'react'
import { MapPinIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface LocationModalProps {
  isOpen: boolean
  onComplete: (location: { lat: number; lon: number; city: string }) => void
}

export function LocationModal({ isOpen, onComplete }: LocationModalProps) {
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle')
  const [showCityInput, setShowCityInput] = useState(false)
  const [city, setCity] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const requestLocation = () => {
    setLocationStatus('requesting')
    setError(null)

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setLocationStatus('denied')
      setShowCityInput(true)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocationStatus('granted')
        console.log('✅ Location granted:', position.coords)
        
        // Reverse geocode to get city name
        let cityName = ''
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10`
          )
          const data = await response.json()
          cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.county || ''
          console.log('🏙️ Reverse geocoded city:', cityName)
        } catch (error) {
          console.warn('⚠️ Failed to reverse geocode:', error)
        }
        
        onComplete({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          city: cityName
        })
      },
      (error) => {
        console.error('❌ Location denied:', error)
        setLocationStatus('denied')
        setShowCityInput(true)
        
        if (error.code === error.PERMISSION_DENIED) {
          setError('Location access denied. Please enter your city manually.')
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setError('Location information unavailable. Please enter your city manually.')
        } else {
          setError('Unable to get location. Please enter your city manually.')
        }
      }
    )
  }

  const handleCitySubmit = () => {
    if (!city.trim()) {
      setError('Please enter a city name')
      return
    }

    console.log('✅ City provided:', city)
    onComplete({
      lat: 0,
      lon: 0,
      city: city.trim()
    })
  }

  const handleUseCupertino = () => {
    console.log('✅ Using Cupertino as default')
    onComplete({
      lat: 37.3230,
      lon: -122.0322,
      city: 'Cupertino'
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 relative">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">📍</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Set Your Location
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We need your location for accurate weather in your daily songs
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 rounded-lg">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
            </div>
          </div>
        )}

        {!showCityInput ? (
          <div className="space-y-3">
            <button
              onClick={requestLocation}
              disabled={locationStatus === 'requesting'}
              className="w-full py-3 bg-brand-primary text-white rounded-lg font-semibold hover:bg-opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {locationStatus === 'requesting' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Requesting...</span>
                </>
              ) : (
                <>
                  <MapPinIcon className="w-5 h-5" />
                  <span>Allow Location Access</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => setShowCityInput(true)}
              className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-95 transition-all"
            >
              Enter City Manually
            </button>

            <button
              onClick={handleUseCupertino}
              className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Use Cupertino (Default)
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter Your City
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCitySubmit()}
                placeholder="e.g., New York, London, Tokyo"
                autoFocus
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-brand-primary focus:outline-none"
              />
            </div>
            
            <button
              onClick={handleCitySubmit}
              disabled={!city.trim()}
              className="w-full py-3 bg-brand-primary text-white rounded-lg font-semibold hover:bg-opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
            
            <button
              onClick={() => setShowCityInput(false)}
              className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
          🔒 Your location is only used for weather data
        </p>
      </div>
    </div>
  )
}
