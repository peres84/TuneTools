import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { supabase } from './services/supabase'
import { useAuthStore } from './stores/authStore'
import { ThemeToggle } from './components/ThemeToggle'
import { LandingPage } from './pages/LandingPage'

function App() {
  const { setUser, setSession, setLoading } = useAuthStore()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setSession, setLoading])

  return (
    <div className="min-h-screen bg-white dark:bg-brand-dark transition-colors duration-200">
      {/* Theme toggle in top right corner */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<div className="p-8 text-center">Signup Page (Coming Soon)</div>} />
        <Route path="/login" element={<div className="p-8 text-center">Login Page (Coming Soon)</div>} />
        {/* More routes will be added in subsequent tasks */}
      </Routes>
    </div>
  )
}

export default App
