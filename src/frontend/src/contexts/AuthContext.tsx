import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  isFirstLogin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFirstLogin, setIsFirstLogin] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Token refresh watchdog - refreshes at 90% of expiry time
  useEffect(() => {
    if (!session) return

    const expiresAt = session.expires_at
    if (!expiresAt) return

    const expiresInMs = (expiresAt * 1000) - Date.now()
    const refreshAt = expiresInMs * 0.9 // Refresh at 90% of expiry time

    console.log(`🔄 Token refresh scheduled in ${Math.round(refreshAt / 1000 / 60)} minutes`)

    const refreshTimer = setTimeout(async () => {
      console.log('🔄 Refreshing access token...')
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('❌ Token refresh failed:', error)
        // If refresh fails, sign out user
        await supabase.auth.signOut()
      } else if (data.session) {
        console.log('✅ Token refreshed successfully')
        setSession(data.session)
        setUser(data.session.user)
      }
    }, refreshAt)

    return () => clearTimeout(refreshTimer)
  }, [session])

  // Session restoration on app load
  useEffect(() => {
    // Get initial session from localStorage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Handle first login redirect to onboarding (only for session restoration, not manual login)
      // Skip if we're on login/signup pages to avoid interfering with manual login
      if (event === 'SIGNED_IN' && session?.user && location.pathname === '/' && !location.pathname.includes('/login') && !location.pathname.includes('/signup')) {
        console.log('🔐 Session restored, checking onboarding status...')
        
        // Check if email is confirmed
        if (!session.user.email_confirmed_at) {
          console.log('❌ Email not confirmed, signing out...')
          await supabase.auth.signOut()
          return
        }
        
        try {
          // Check if user has completed onboarding
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .maybeSingle()

          if (error) {
            console.error('❌ Error fetching user profile:', error)
            // On error, redirect to onboarding
            setIsFirstLogin(true)
            navigate('/onboarding')
          } else if (!profile || !profile.onboarding_completed) {
            // Profile doesn't exist or onboarding not completed
            setIsFirstLogin(true)
            navigate('/onboarding')
          } else {
            // Onboarding completed - go to dashboard
            navigate('/dashboard')
          }
        } catch (err) {
          console.error('❌ Error in auth state change:', err)
          // On error, redirect to onboarding
          setIsFirstLogin(true)
          navigate('/onboarding')
        }
      }

      // Handle sign out
      if (event === 'SIGNED_OUT') {
        navigate('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate, location.pathname])

  // Sign up method
  const signUp = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting sign up process for:', email)
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      console.log('📧 Backend signup response:', data)

      if (!response.ok) {
        console.error('❌ Sign up error:', data.detail)
        return { error: { message: data.detail } as AuthError }
      }

      // Set session if provided
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        })
      }

      console.log('✅ Sign up completed successfully')
      return { error: null }
    } catch (error) {
      console.error('❌ Unexpected sign up error:', error)
      return { error: { message: 'Network error. Please try again.' } as AuthError }
    }
  }

  // Log in method
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting Log in process for:', email)
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      console.log('📧 Backend login response:', data)

      if (!response.ok) {
        console.error('❌ Sign in error:', data.detail)
        return { error: { message: data.detail } as AuthError }
      }

      // Set session
      console.log('🔄 Setting session in Supabase...')
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      })

      if (sessionError) {
        console.error('❌ Session error:', sessionError)
        return { error: { message: 'Failed to establish session. Please try again.' } as AuthError }
      }

      console.log('✅ Session set successfully:', sessionData)
      console.log('📊 Onboarding completed:', data.onboarding_completed)

      // Set first login flag based on onboarding status
      setIsFirstLogin(!data.onboarding_completed)

      // Small delay to ensure session is fully set before navigation
      await new Promise(resolve => setTimeout(resolve, 100))

      // Navigate immediately based on backend response (don't wait for auth state change)
      // Backend already checked onboarding status, so we can trust it
      if (!data.onboarding_completed) {
        console.log('➡️ Redirecting to onboarding')
        navigate('/onboarding')
      } else {
        console.log('➡️ Redirecting to dashboard')
        navigate('/dashboard')
      }

      return { error: null }
    } catch (error) {
      console.error('❌ Unexpected sign in error:', error)
      return { error: { message: 'Network error. Please try again.' } as AuthError }
    }
  }

  // Sign out method
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setIsFirstLogin(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        isFirstLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
