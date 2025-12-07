import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { DashboardLayout } from '../components/DashboardLayout'
import { UserCircleIcon, EnvelopeIcon, CalendarIcon, MusicalNoteIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { ProfileSkeleton } from '../components/LoadingSkeletons'
import { getUserFriendlyErrorMessage } from '../utils/errorMessages'
import { ConfirmModal } from '../components/ConfirmModal'
import { cacheManager, CACHE_KEYS } from '../utils/cacheManager'

export function ProfilePage() {
  const { user, session, signOut } = useAuth()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      if (!session?.access_token) return null

      // Check cache first
      const cached = cacheManager.get(CACHE_KEYS.USER_PROFILE, 30)
      if (cached) {
        console.log('👤 Using cached profile')
        return cached
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/profile`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch profile')
      const data = await response.json()
      
      // Cache the profile
      cacheManager.set(CACHE_KEYS.USER_PROFILE, data, 30)
      
      return data
    },
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000
  })

  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      if (!session?.access_token) return { songs_count: 0, albums_count: 0 }

      // Check cache first
      const cached = cacheManager.get<{ songs_count: number; albums_count: number }>(CACHE_KEYS.USER_STATS, 30)
      if (cached) {
        console.log('📊 Using cached stats')
        return cached
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/stats`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) return { songs_count: 0, albums_count: 0 }
      const data = await response.json()
      
      // Cache the stats
      cacheManager.set(CACHE_KEYS.USER_STATS, data, 30)
      
      return data
    },
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000
  })

  // Change password mutation
  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (!session?.access_token) throw new Error('Not authenticated')
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/change-password`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
          })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to change password')
      }

      return response.json()
    },
    onSuccess: () => {
      setPasswordSuccess('Password changed successfully!')
      setPasswordError('')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setShowPasswordModal(false)
        setPasswordSuccess('')
      }, 2000)
    },
    onError: (error: Error) => {
      setPasswordError(error.message)
      setPasswordSuccess('')
    }
  })

  // Export data mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      if (!session?.access_token) throw new Error('Not authenticated')
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/export-data`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to export data')
      return response.json()
    },
    onSuccess: (data) => {
      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tunetools-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  })

  // Delete account mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!session?.access_token) throw new Error('Not authenticated')
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/account`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to delete account')
      return response.json()
    },
    onSuccess: () => {
      // Sign out and redirect
      signOut()
    }
  })

  const handleChangePassword = () => {
    setPasswordError('')
    setPasswordSuccess('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }

    passwordMutation.mutate()
  }

  const handleExportData = () => {
    exportMutation.mutate()
  }

  const handleDeleteAccount = () => {
    deleteMutation.mutate()
  }

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
          <ProfileSkeleton />
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-1">
                  Failed to Load Profile
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400">
                  {getUserFriendlyErrorMessage(error)}
                </p>
              </div>
            </div>
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
                    {userStats?.songs_count || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Songs Generated
                  </p>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-brand-secondary/10 to-brand-accent/10 rounded-lg">
                  <CalendarIcon className="w-12 h-12 mx-auto text-brand-secondary mb-3" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {userStats?.albums_count || 0}
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
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <p className="font-medium text-gray-900 dark:text-white">Change Password</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Update your account password</p>
                </button>
                <button 
                  onClick={handleExportData}
                  disabled={exportMutation.isPending}
                  className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <p className="font-medium text-gray-900 dark:text-white">
                    {exportMutation.isPending ? 'Exporting...' : 'Export Data'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Download all your data</p>
                </button>
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full text-left px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <p className="font-medium text-red-600 dark:text-red-400">Delete Account</p>
                  <p className="text-sm text-red-600/80 dark:text-red-400/80">Permanently delete your account and all data</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Change Password
            </h3>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-500 rounded-lg text-sm text-red-700 dark:text-red-400">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-500 rounded-lg text-sm text-green-700 dark:text-green-400">
                {passwordSuccess}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordError('')
                  setPasswordSuccess('')
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={passwordMutation.isPending}
                className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to permanently delete your account? This action cannot be undone. All your songs, albums, and data will be permanently deleted."
        confirmText={deleteMutation.isPending ? 'Deleting...' : 'Delete Account'}
        confirmVariant="danger"
      />
    </DashboardLayout>
  )
}
