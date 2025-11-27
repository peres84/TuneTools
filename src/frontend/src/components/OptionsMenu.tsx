import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right + window.scrollX - 192 // 192px = w-48
      })
    }
    
    setIsOpen(!isOpen)
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Options"
      >
        <EllipsisVerticalIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {isOpen && createPortal(
        <div 
          ref={menuRef}
          className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[9999]"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`
          }}
        >
          <div className="py-1">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  item.onClick()
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors ${
                  item.variant === 'danger'
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {item.icon && <span className="w-5 h-5">{item.icon}</span>}
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
