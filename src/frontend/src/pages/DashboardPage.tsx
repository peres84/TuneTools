import { useAuth } from '../contexts/AuthContext'

export function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-dark p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-brand-primary">Dashboard</h1>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
        
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
    </div>
  )
}
