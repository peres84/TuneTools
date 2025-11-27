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

      // Handle first login redirect to onboarding
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔐 User signed in, checking onboarding status...')
        
        // Check if email is confirmed
        if (!session.user.email_confirmed_at) {
          console.log('❌ Email not confirmed, signing out...')
          await supabase.auth.signOut()
          return
        }
        
        // Don't redirect if already on onboarding or dashboard
        if (location.pathname === '/onboarding' || location.pathname === '/dashboard') {
          console.log('✅ Already on correct page, skipping redirect')
          return
        }
        
        try {
          // Check if user has completed onboarding (use maybeSingle instead of single)
          console.log('📊 Fetching user profile...')
          console.log('📊 User ID:', session.user.id)
          console.log('📊 Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
          
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .maybeSingle()

          console.log('📊 Profile result:', { profile, error })
          console.log('📊 Profile data:', profile)
          console.log('📊 Profile error:', error)

          if (error) {
            console.error('❌ Error fetching user profile:', error)
            
            // If table doesn't exist or RLS blocks, create profile via backend
            if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
              console.log('⚠️ Profile table issue, redirecting to onboarding to create profile')
              setIsFirstLogin(true)
              navigate('/onboarding')
              return
            }
            
            // On other errors, redirect to onboarding
            setIsFirstLogin(true)
            console.log('➡️ Redirecting to onboarding (error)')
            navigate('/onboarding')
          } else if (!profile) {
            // Profile doesn't exist yet - first time login
            setIsFirstLogin(true)
            console.log('➡️ Redirecting to onboarding (no profile)')
            navigate('/onboarding')
          } else if (!profile.onboarding_completed) {
            // Profile exists but onboarding not completed
            setIsFirstLogin(true)
            console.log('➡️ Redirecting to onboarding (not completed)')
            navigate('/onboarding')
          } else {
            // Onboarding completed - go to dashboard
            console.log('➡️ Redirecting to dashboard (onboarding completed)')
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
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      console.log('📧 Supabase signUp response:', { data, error })

      if (error) {
        console.error('❌ Sign up error:', error)
        return { error }
      }

      // Create user profile (if trigger doesn't work)
      if (data.user) {
        console.log('✅ User created:', data.user.id)
        
        // Don't wait for profile creation - let it happen in background
        // The database trigger should handle this anyway
        Promise.resolve(
          supabase.from('user_profiles').insert({
            id: data.user.id,
            onboarding_completed: false,
          })
        ).then(({ error: profileError }) => {
          if (profileError) {
            console.log('⚠️ Profile creation error (may already exist):', profileError.message)
          } else {
            console.log('✅ User profile created')
          }
        }).catch(() => {
          // Profile might already exist from trigger, ignore error
          console.log('⚠️ Profile creation skipped (may already exist from trigger)')
        })
      }

      console.log('✅ Sign up completed successfully')
      return { error: null }
    } catch (error) {
      console.error('❌ Unexpected sign up error:', error)
      return { error: error as AuthError }
    }
  }

  // Log in method
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting Log in process for:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('📧 Supabase signIn response:', { data, error })

      if (error) {
        console.error('❌ Sign in error:', error)
      } else {
        console.log('✅ Sign in successful')
      }

      return { error }
    } catch (error) {
      console.error('❌ Unexpected sign in error:', error)
      return { error: error as AuthError }
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
