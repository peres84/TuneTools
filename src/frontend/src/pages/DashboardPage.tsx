import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { DashboardLayout } from '../components/DashboardLayout'
import { SongGenerator } from '../components/SongGenerator'
import { LocationModal } from '../components/LocationModal'
import { MapPinIcon, PencilIcon } from '@heroicons/react/24/outline'

export function DashboardPage() {
  const { user } = useAuth()
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; city: string } | null>(null)

  useEffect(() => {
    // Check if location is already set
    const savedLocation = localStorage.getItem('user_location')
    if (!savedLocation) {
      // Show modal if no location is set
      setShowLocationModal(true)
    } else {
      try {
        setUserLocation(JSON.parse(savedLocation))
      } catch (e) {
        console.error('Failed to parse location')
      }
    }
  }, [])

  const handleLocationComplete = (location: { lat: number; lon: number; city: string }) => {
    localStorage.setItem('user_location', JSON.stringify(location))
    console.log('✅ Location saved:', location.city || `${location.lat}, ${location.lon}`)
    setUserLocation(location)
    setShowLocationModal(false)
  }

  const handleChangeLocation = () => {
    setShowLocationModal(true)
  }

  const getLocationDisplay = () => {
    if (!userLocation) return null
    if (userLocation.city) return userLocation.city
    if (userLocation.lat !== 0 && userLocation.lon !== 0) {
      return `${userLocation.lat.toFixed(4)}, ${userLocation.lon.toFixed(4)}`
    }
    return 'Location not set'
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-brand-primary mb-2">Welcome back!</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
            {userLocation && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <MapPinIcon className="w-5 h-5 text-brand-primary" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {getLocationDisplay()}
                </span>
                <button
                  onClick={handleChangeLocation}
                  className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Change location"
                >
                  <PencilIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <SongGenerator />
      </div>

      <LocationModal 
        isOpen={showLocationModal} 
        onComplete={handleLocationComplete}
      />
    </DashboardLayout>
  )
}
