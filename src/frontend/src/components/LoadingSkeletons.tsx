// Loading Skeleton Components

export function AlbumSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-300 dark:bg-gray-700" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </div>
  )
}

export function SongSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="flex items-center gap-4 p-4">
        <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}

export function NewsSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-300 dark:bg-gray-700" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/6" />
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-gray-300 dark:bg-gray-700 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-20 bg-gray-300 dark:bg-gray-700 rounded-lg" />
          <div className="h-20 bg-gray-300 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-300 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function SongPlayerSkeleton() {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full animate-pulse">
        <div className="flex justify-center mb-6">
          <div className="w-48 h-48 sm:w-64 sm:h-64 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="space-y-4 mb-6">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mx-auto" />
          <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mx-auto" />
        </div>
        <div className="flex justify-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full" />
          <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full" />
          <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded-full" />
      </div>
    </div>
  )
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
