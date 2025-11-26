import { Routes, Route } from 'react-router-dom'
import { ThemeToggle } from './components/ThemeToggle'
import { LandingPage } from './pages/LandingPage'
import { SignupPage } from './pages/SignupPage'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { DashboardPage } from './pages/DashboardPage'

function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-brand-dark transition-colors duration-200">
      {/* Theme toggle in top right corner */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* More routes will be added in subsequent tasks */}
      </Routes>
    </div>
  )
}

export default App
