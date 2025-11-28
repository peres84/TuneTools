import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { DashboardLayout } from '../components/DashboardLayout'
import { UserCircleIcon, EnvelopeIcon, CalendarIcon, MusicalNoteIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export function ProfilePage() {
  const { user, session } = useAuth()

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      if (!session?.access_token) return null

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/profile`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch profile')
      return response.json()
    },
    enabled: !!session?.access_token
  })

  const { data: songsCount } = useQuery({
    queryKey: ['songsCount'],
    queryFn: async () => {
      if (!session?.access_token) return 0

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/songs/list?limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) return 0
      const data = await response.json()
      return data.total || 0
    },
    enabled: !!session?.access_token
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-brand-primary mb-2">Your Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Account information and statistics
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-24 h-24 bg-brand-primary rounded-full flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {user?.email}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <span>Email Verified</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <EnvelopeIcon className="w-6 h-6 text-brand-primary" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-brand-primary" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Member Since</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {profileData?.created_at ? formatDate(profileData.created_at) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Your Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 rounded-lg">
                  <MusicalNoteIcon className="w-12 h-12 mx-auto text-brand-primary mb-3" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {songsCount || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Songs Generated
                  </p>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-brand-secondary/10 to-brand-accent/10 rounded-lg">
                  <CalendarIcon className="w-12 h-12 mx-auto text-brand-secondary mb-3" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {Math.ceil((songsCount || 0) / 7)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Albums Created
                  </p>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-brand-accent/10 to-brand-primary/10 rounded-lg">
                  <UserCircleIcon className="w-12 h-12 mx-auto text-brand-accent mb-3" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {profileData?.onboarding_completed ? 'Complete' : 'Incomplete'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Profile Status
                  </p>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Account Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <p className="font-medium text-gray-900 dark:text-white">Change Password</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Update your account password</p>
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <p className="font-medium text-gray-900 dark:text-white">Export Data</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Download all your songs and data</p>
                </button>
                <button className="w-full text-left px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                  <p className="font-medium text-red-600 dark:text-red-400">Delete Account</p>
                  <p className="text-sm text-red-600/80 dark:text-red-400/80">Permanently delete your account and all data</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
