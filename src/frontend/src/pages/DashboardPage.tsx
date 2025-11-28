import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { DashboardLayout } from '../components/DashboardLayout'
import { SongGenerator } from '../components/SongGenerator'
import { LocationModal } from '../components/LocationModal'

export function DashboardPage() {
  const { user } = useAuth()
  const [showLocationModal, setShowLocationModal] = useState(false)

  useEffect(() => {
    // Check if location is already set
    const savedLocation = localStorage.getItem('user_location')
    if (!savedLocation) {
      // Show modal if no location is set
      setShowLocationModal(true)
    }
  }, [])

  const handleLocationComplete = (location: { lat: number; lon: number; city: string }) => {
    localStorage.setItem('user_location', JSON.stringify(location))
    console.log('✅ Location saved:', location.city || `${location.lat}, ${location.lon}`)
    setShowLocationModal(false)
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-brand-primary mb-2">Welcome back!</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.email}
          </p>
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
