import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { DashboardLayout } from '../components/DashboardLayout'
import { CalendarIcon, ClockIcon, LinkIcon, ExclamationTriangleIcon, ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { CalendarSkeleton } from '../components/LoadingSkeletons'
import { getUserFriendlyErrorMessage } from '../utils/errorMessages'
import { cacheManager, CACHE_KEYS } from '../utils/cacheManager'

interface CalendarActivity {
  title: string
  start_time: string
  end_time: string
  description?: string
  location?: string
  is_all_day: boolean
}

interface CalendarData {
  connected: boolean
  activities: { [date: string]: CalendarActivity[] }
  total_count: number
}

export function CalendarPage() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data: calendarData, isLoading, error } = useQuery({
    queryKey: ['userCalendar', viewMode],
    queryFn: async () => {
      if (!session?.access_token) return null

      // Try cache first
      const cacheKey = `${CACHE_KEYS.CALENDAR_ACTIVITIES}_${viewMode}`
      const cached = cacheManager.get<CalendarData>(cacheKey, 5)
      if (cached) {
        return cached
      }

      // Check calendar connection status
      const statusResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/calendar/status`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!statusResponse.ok) {
        throw new Error('Failed to fetch calendar status')
      }

      const status = await statusResponse.json()

      // If not connected, return early
      if (!status.connected) {
        return {
          connected: false,
          activities: {},
          total_count: 0
        }
      }

      // Fetch calendar activities (1 day or 7 days)
      const daysAhead = viewMode === 'day' ? 1 : 7
      const activitiesResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/calendar/activities?days_ahead=${daysAhead}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!activitiesResponse.ok) {
        throw new Error('Failed to fetch calendar activities')
      }

      const activitiesData = await activitiesResponse.json()

      const result = {
        connected: true,
        activities: activitiesData.activities || {},
        total_count: activitiesData.total_count || 0
      }

      // Cache the result
      cacheManager.set(cacheKey, result, 5)

      return result
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

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const getWeekDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  const getTodayKey = () => {
    return new Date().toISOString().split('T')[0]
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    
    // Clear cache
    const cacheKey = `${CACHE_KEYS.CALENDAR_ACTIVITIES}_${viewMode}`
    cacheManager.remove(cacheKey)
    
    // Refetch data
    await queryClient.invalidateQueries({ queryKey: ['userCalendar', viewMode] })
    
    setTimeout(() => setIsRefreshing(false), 500)
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
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 sm:p-12 text-center">
            <CalendarIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Calendar Not Connected
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
              Connect your Google Calendar to see your activities here and include them in song generation.
            </p>
            <a
              href="/settings"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 active:scale-95 transition-all font-semibold"
            >
              <LinkIcon className="w-5 h-5" />
              Connect in Settings
            </a>
          </div>
        )}

        {calendarData && calendarData.connected && (
          <>
            {/* View Mode Toggle */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    viewMode === 'day'
                      ? 'bg-brand-primary text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    viewMode === 'week'
                      ? 'bg-brand-primary text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  This Week
                </button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {calendarData.total_count} {calendarData.total_count === 1 ? 'event' : 'events'}
              </div>
            </div>

            {/* Calendar View */}
            {calendarData.total_count === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
                <CalendarIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Upcoming Activities
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your calendar is empty for {viewMode === 'day' ? 'today' : 'this week'}. Activities will appear here when scheduled.
                </p>
              </div>
            ) : viewMode === 'day' ? (
              /* Day View */
              <div className="space-y-4">
                {Object.entries(calendarData.activities)
                  .filter(([date]) => date === getTodayKey())
                  .map(([date, activities]) => (
                    <div key={date}>
                      {(activities as CalendarActivity[]).map((activity, index) => (
                        <div
                          key={index}
                          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow mb-4"
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
                                {activity.is_all_day ? (
                                  <span className="font-medium">All Day</span>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <ClockIcon className="w-4 h-4" />
                                    <span>
                                      {formatTime(activity.start_time)} - {formatTime(activity.end_time)}
                                    </span>
                                  </div>
                                )}
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
                  ))}
              </div>
            ) : (
              /* Week View */
              <div className="space-y-6">
                {getWeekDates().map((dateKey) => {
                  const dayActivities = (calendarData.activities[dateKey] || []) as CalendarActivity[]
                  const isToday = dateKey === getTodayKey()
                  
                  return (
                    <div key={dateKey} className={`${isToday ? 'ring-2 ring-brand-primary rounded-lg' : ''}`}>
                      <div className={`p-4 rounded-t-lg ${isToday ? 'bg-brand-primary text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        <h3 className="font-bold text-lg">
                          {formatDateShort(dateKey)}
                          {isToday && <span className="ml-2 text-sm font-normal">(Today)</span>}
                        </h3>
                      </div>
                      {dayActivities.length === 0 ? (
                        <div className="p-6 bg-white dark:bg-gray-800 rounded-b-lg text-center text-gray-500 dark:text-gray-400 text-sm">
                          No events scheduled
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-b-lg divide-y divide-gray-200 dark:divide-gray-700">
                          {dayActivities.map((activity, index) => (
                            <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                  <CalendarIcon className="w-5 h-5 text-brand-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    {activity.title}
                                  </h4>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {activity.is_all_day ? (
                                      <span className="font-medium">All Day</span>
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <ClockIcon className="w-4 h-4" />
                                        <span>
                                          {formatTime(activity.start_time)} - {formatTime(activity.end_time)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {activity.location && (
                                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
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
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
