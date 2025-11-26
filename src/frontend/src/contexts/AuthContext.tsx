import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
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
        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('onboarding_completed')
          .eq('user_id', session.user.id)
          .single()

        if (!profile || !profile.onboarding_completed) {
          setIsFirstLogin(true)
          navigate('/onboarding')
        } else {
          navigate('/dashboard')
        }
      }

      // Handle sign out
      if (event === 'SIGNED_OUT') {
        navigate('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  // Sign up method
  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      // Create user profile
      if (data.user) {
        await supabase.from('user_profiles').insert({
          user_id: data.user.id,
          email: data.user.email,
          onboarding_completed: false,
        })
      }

      return { error: null }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  // Sign in method
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      return { error }
    } catch (error) {
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
