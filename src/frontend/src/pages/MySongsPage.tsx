import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/DashboardLayout'
import { AlbumCollection } from '../components/AlbumCollection'

export function MySongsPage() {
  const navigate = useNavigate()

  const handleAlbumClick = (albumId: string) => {
    navigate(`/dashboard/album/${albumId}`)
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-brand-primary mb-2">My Songs</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse your weekly albums and songs
          </p>
        </div>
        
        <AlbumCollection onAlbumClick={handleAlbumClick} />
      </div>
    </DashboardLayout>
  )
}
