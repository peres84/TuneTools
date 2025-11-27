import { useAuth } from '../contexts/AuthContext'
import { DashboardLayout } from '../components/DashboardLayout'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-brand-primary mb-8">Dashboard</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Welcome back!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Email: {user?.email}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Dashboard features will be implemented in subsequent tasks
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
