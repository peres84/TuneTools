import { useNavigate } from 'react-router-dom'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface SessionExpiredModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SessionExpiredModal({ isOpen, onClose }: SessionExpiredModalProps) {
  if (!isOpen) return null
  const navigate = useNavigate()

  const handleLogin = () => {
    onClose()
    navigate('/login')
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 max-w-md w-full">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-600 dark:text-yellow-400" />
          </div>
          
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
            Session Expired
          </h3>
          
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
            Your session has expired. Please refresh the page or log in again to continue.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRefresh}
              className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 active:scale-95 transition-all font-semibold touch-manipulation"
            >
              Refresh Page
            </button>
            <button
              onClick={handleLogin}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-95 transition-all font-semibold touch-manipulation"
            >
              Log In Again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
