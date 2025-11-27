import { useState } from 'react'
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'

interface MenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
}

interface OptionsMenuProps {
  items: MenuItem[]
}

export function OptionsMenu({ items }: OptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = (e: React.MouseEvent) => {
    console.log('🔘 [OptionsMenu] Button clicked, current isOpen:', isOpen)
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const handleClose = () => {
    console.log('❌ [OptionsMenu] Closing menu')
    setIsOpen(false)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleClose()
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  console.log('🎨 [OptionsMenu] Rendering, isOpen:', isOpen, 'items count:', items.length)

  return (
    <>
      <button
        onClick={handleToggle}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Options"
      >
        <EllipsisVerticalIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
          onClick={handleBackdropClick}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-w-sm w-full mx-4"
            onClick={handleMenuClick}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Options</h3>
            <div className="space-y-2">
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    console.log('🎯 [OptionsMenu] Menu item clicked:', item.label)
                    e.stopPropagation()
                    item.onClick()
                    setIsOpen(false)
                  }}
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 rounded-lg transition-colors ${
                    item.variant === 'danger'
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.icon && <span className="w-5 h-5">{item.icon}</span>}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={handleClose}
              className="mt-4 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
