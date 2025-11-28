import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { DashboardLayout } from '../components/DashboardLayout'
import { CalendarIcon, ClockIcon, LinkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { CalendarSkeleton } from '../components/LoadingSkeletons'
import { getUserFriendlyErrorMessage } from '../utils/errorMessages'

interface CalendarActivity {
  title: string
  start_time: string
  end_time: string
  description?: string
  location?: string
}

export function CalendarPage() {
  const { session } = useAuth()

  const { data: calendarData, isLoading, error } = useQuery({
    queryKey: ['userCalendar'],
    queryFn: async () => {
      if (!session?.access_token) return null

      // Check if user has calendar integration
      // For now, return empty data
      // In production, this would fetch from backend
      return {
        connected: false,
        activities: [] as CalendarActivity[]
      }
    },
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000
  })

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-brand-primary mb-2">Your Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Synced activities from your Google Calendar
          </p>
        </div>

        {isLoading && <CalendarSkeleton />}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-1">
                  Failed to Load Calendar
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400">
                  {getUserFriendlyErrorMessage(error)}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
            <p className="text-red-800 dark:text-red-200">
              Failed to load calendar: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        )}

        {calendarData && !calendarData.connected && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
            <CalendarIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Calendar Not Connected
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Connect your Google Calendar to see your activities here and include them in song generation.
            </p>
            <button className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 transition-colors font-semibold inline-flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Connect Google Calendar
            </button>
          </div>
        )}

        {calendarData && calendarData.connected && calendarData.activities.length === 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
            <CalendarIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Upcoming Activities
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your calendar is empty for today. Activities will appear here when scheduled.
            </p>
          </div>
        )}

        {calendarData && calendarData.activities.length > 0 && (
          <div className="space-y-4">
            {calendarData.activities.map((activity: CalendarActivity, index: number) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6 text-brand-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {activity.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>
                          {formatTime(activity.start_time)} - {formatTime(activity.end_time)}
                        </span>
                      </div>
                      <span>{formatDate(activity.start_time)}</span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {activity.description}
                      </p>
                    )}
                    {activity.location && (
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        📍 {activity.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
