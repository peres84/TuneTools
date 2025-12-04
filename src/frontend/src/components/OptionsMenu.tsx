import { useState } from 'react'
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'

export interface MenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

interface OptionsMenuProps {
  items: MenuItem[]
  mode?: 'dropdown' | 'modal' // New prop to control display mode
}

export function OptionsMenu({ items, mode = 'modal' }: OptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = (e: React.MouseEvent) => {
    console.log('🔘 [OptionsMenu] Button clicked, current isOpen:', isOpen)
    e.stopPropagation()
    e.preventDefault()
    setIsOpen(!isOpen)
  }

  const handleClose = () => {
    console.log('❌ [OptionsMenu] Closing menu')
    setIsOpen(false)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    console.log('🎯 [OptionsMenu] Backdrop clicked, target:', e.target, 'currentTarget:', e.currentTarget)
    if (e.target === e.currentTarget) {
      e.stopPropagation()
      e.preventDefault()
      handleClose()
    }
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    console.log('📦 [OptionsMenu] Menu content clicked')
    e.stopPropagation()
    e.preventDefault()
  }

  console.log('🎨 [OptionsMenu] Rendering, isOpen:', isOpen, 'items count:', items.length, 'mode:', mode)

  // Dropdown mode - appears on top of the card (same aesthetic as albums)
  if (mode === 'dropdown') {
    return (
      <div className="relative">
        <button
          onClick={handleToggle}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Options"
        >
          <EllipsisVerticalIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {isOpen && (
          <>
            {/* Backdrop to close menu when clicking outside */}
            <div 
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
              }}
            />
            
            {/* Dropdown menu - matching album aesthetic */}
            <div 
              className="absolute right-0 top-full mt-2 min-w-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
              onClick={handleMenuClick}
            >
              {/* Menu items */}
              <div className="py-1">
                {items.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    disabled={item.disabled}
                    onClick={(e) => {
                      console.log('🎯 [OptionsMenu] Dropdown item clicked:', item.label)
                      e.stopPropagation()
                      e.preventDefault()
                      if (!item.disabled) {
                        setIsOpen(false)
                        setTimeout(() => {
                          item.onClick()
                        }, 100)
                      }
                    }}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                      item.disabled
                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                        : item.variant === 'danger'
                        ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {item.icon && <span className="w-5 h-5">{item.icon}</span>}
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Cancel button */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                <button
                  type="button"
                  onClick={(e) => {
                    console.log('🚫 [OptionsMenu] Cancel button clicked')
                    e.stopPropagation()
                    e.preventDefault()
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // Modal mode - full screen overlay (original behavior)
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
                  type="button"
                  disabled={item.disabled}
                  onClick={(e) => {
                    console.log('🎯 [OptionsMenu] Menu item clicked:', item.label)
                    e.stopPropagation()
                    e.preventDefault()
                    if (!item.disabled) {
                      // Close menu first, then trigger action after a brief delay
                      setIsOpen(false)
                      setTimeout(() => {
                        item.onClick()
                      }, 100)
                    }
                  }}
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 rounded-lg transition-colors ${
                    item.disabled
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                      : item.variant === 'danger'
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
              type="button"
              onClick={(e) => {
                console.log('🚫 [OptionsMenu] Cancel button clicked')
                e.stopPropagation()
                e.preventDefault()
                setIsOpen(false)
              }}
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
