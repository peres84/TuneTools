import { useAuth } from '../contexts/AuthContext'
import { DashboardLayout } from '../components/DashboardLayout'
import { SongGenerator } from '../components/SongGenerator'

export function DashboardPage() {
  const { user } = useAuth()

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
    </DashboardLayout>
  )
}
