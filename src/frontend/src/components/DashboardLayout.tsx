import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ThemeToggle } from './ThemeToggle'
import {
  HomeIcon,
  NewspaperIcon,
  CalendarIcon,
  MusicalNoteIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import logoDisk from '../assets/logo-disk.png'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()

  const tabs = [
    { id: 'home', label: 'Home', icon: HomeIcon, path: '/dashboard' },
    { id: 'news', label: 'News', icon: NewspaperIcon, path: '/dashboard/news' },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon, path: '/dashboard/calendar' },
    { id: 'songs', label: 'My Music', icon: MusicalNoteIcon, path: '/dashboard/songs' },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon, path: '/dashboard/settings' },
    { id: 'profile', label: 'Profile', icon: UserCircleIcon, path: '/dashboard/profile' }
  ]

  const handleTabClick = (path: string) => {
    navigate(path)
    setSidebarOpen(false)
  }

  const handleSignOutClick = () => {
    setShowSignOutConfirm(true)
  }

  const handleSignOutConfirm = async () => {
    setShowSignOutConfirm(false)
    await signOut()
    navigate('/')
  }

  const handleSignOutCancel = () => {
    setShowSignOutConfirm(false)
  }

  const isActiveTab = (path: string) => {
    return location.pathname === path || 
           (path === '/dashboard' && location.pathname === '/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-dark">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 bg-white dark:bg-gray-800 shadow-lg z-50
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo, theme toggle, and close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2">
              <img src={logoDisk} alt="TuneTools Logo" className="w-8 h-8" />
              <h1 className="text-xl font-bold text-brand-primary">TuneTools</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Navigation tabs - scrollable if needed */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = isActiveTab(tab.path)
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.path)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-200
                    ${active
                      ? 'bg-brand-primary text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </nav>

          {/* User section - always visible at bottom */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSignOutClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Mobile header */}
        <header className="lg:hidden bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-2">
            <img src={logoDisk} alt="TuneTools Logo" className="w-6 h-6" />
            <h1 className="text-lg font-bold text-brand-primary">TuneTools</h1>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Sign Out
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to sign out?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSignOutCancel}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOutConfirm}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
