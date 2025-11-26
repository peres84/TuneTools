import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { supabase } from './services/supabase'
import { useAuthStore } from './stores/authStore'

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
    <div className="min-h-screen bg-white dark:bg-brand-dark">
      <Routes>
        <Route path="/" element={<div className="p-8 text-center">
          <h1 className="text-4xl font-bold text-brand-primary">TuneTools</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Your Daily Song Platform</p>
        </div>} />
        {/* More routes will be added in subsequent tasks */}
      </Routes>
    </div>
  )
}

export default App
