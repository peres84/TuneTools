import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const status = searchParams.get('calendar')
  const message = searchParams.get('message')

  useEffect(() => {
    // Auto-close after 3 seconds on success
    if (status === 'success') {
      const timer = setTimeout(() => {
        window.close()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [status])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        {status === 'success' ? (
          <>
            <CheckCircleIcon className="w-20 h-20 mx-auto text-green-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Calendar Connected!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your Google Calendar has been successfully connected to TuneTools.
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                ✓ You can close this window now
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                This window will close automatically in 3 seconds
              </p>
            </div>
            <button
              onClick={() => window.close()}
              className="w-full px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 active:scale-95 transition-all font-semibold"
            >
              Close Window
            </button>
          </>
        ) : status === 'error' ? (
          <>
            <XCircleIcon className="w-20 h-20 mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Connection Failed
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message ? decodeURIComponent(message.replace(/\+/g, ' ')) : 'Failed to connect your Google Calendar.'}
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                Please try again from Settings
              </p>
            </div>
            <button
              onClick={() => window.close()}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 active:scale-95 transition-all font-semibold"
            >
              Close Window
            </button>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-brand-primary mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Processing...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Connecting your Google Calendar...
            </p>
          </>
        )}
      </div>
    </div>
  )
}
