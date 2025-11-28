import { Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { SignupPage } from './pages/SignupPage'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { DashboardPage } from './pages/DashboardPage'
import { NewsPage } from './pages/NewsPage'
import { CalendarPage } from './pages/CalendarPage'
import { MySongsPage } from './pages/MySongsPage'
import { SettingsPage } from './pages/SettingsPage'
import { ProfilePage } from './pages/ProfilePage'
import { SongPlayerPage } from './pages/SongPlayerPage'
import { SharedSongPage } from './pages/SharedSongPage'
import { ErrorBoundary } from './components/ErrorBoundary'
import { OfflineBanner } from './components/OfflineBanner'

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white dark:bg-brand-dark transition-colors duration-200">
        <OfflineBanner />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/news" element={<NewsPage />} />
          <Route path="/dashboard/calendar" element={<CalendarPage />} />
          <Route path="/dashboard/songs" element={<MySongsPage />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />
          <Route path="/dashboard/profile" element={<ProfilePage />} />
          <Route path="/song/:songId" element={<SongPlayerPage />} />
          <Route path="/share/:shareToken" element={<SharedSongPage />} />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}

export default App
