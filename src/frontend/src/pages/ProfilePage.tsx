import { DashboardLayout } from '../components/DashboardLayout'

export function ProfilePage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-brand-primary mb-8">Profile</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <p className="text-gray-600 dark:text-gray-400">
            Profile management will be implemented in a future task
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
