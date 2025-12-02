import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  confirmVariant?: 'danger' | 'primary'
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'danger',
  isLoading = false
}: ConfirmModalProps) {
  console.log('🔔 [ConfirmModal] Render - isOpen:', isOpen, 'isLoading:', isLoading, 'title:', title)
  
  if (!isOpen) return null

  const handleConfirm = () => {
    console.log('✅ [ConfirmModal] Confirm clicked')
    onConfirm()
    // Don't close immediately - let the parent handle closing after success
  }
  
  const handleClose = () => {
    console.log('❌ [ConfirmModal] Close clicked')
    onClose()
  }
  
  const handleBackdropClick = (e: React.MouseEvent) => {
    console.log('🎯 [ConfirmModal] Backdrop clicked, target === currentTarget:', e.target === e.currentTarget)
    if (e.target === e.currentTarget && !isLoading) {
      console.log('✅ [ConfirmModal] Closing via backdrop')
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => {
          console.log('📦 [ConfirmModal] Modal content clicked')
          e.stopPropagation()
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {confirmVariant === 'danger' && (
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            )}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
              confirmVariant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-brand-primary hover:bg-opacity-90'
            }`}
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
