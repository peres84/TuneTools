import { useOfflineDetection } from '../hooks/useOfflineDetection'

export function OfflineBanner() {
  const { isOnline, wasOffline } = useOfflineDetection()

  if (isOnline && !wasOffline) {
    return null
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isOnline
          ? 'bg-green-500'
          : 'bg-yellow-500'
      }`}
    >
      <div className="container mx-auto px-4 py-2 text-center">
        <p className="text-sm sm:text-base font-medium text-white">
          {isOnline ? (
            <>
              <span className="inline-block mr-2">✓</span>
              Connection restored
            </>
          ) : (
            <>
              <span className="inline-block mr-2">⚠</span>
              You are offline. Some features may not be available.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
