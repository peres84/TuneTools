import { useEffect } from 'react'
import { AuthForm } from '../components/AuthForm'
import { useAuth } from '../contexts/AuthContext'

export function SignupPage() {
  const { signOut } = useAuth()

  // Clear any existing session when landing on signup page
  useEffect(() => {
    const clearSession = async () => {
      console.log('🧹 SignupPage: Clearing any existing session...')
      await signOut()
    }
    clearSession()
  }, [signOut])

  return <AuthForm mode="signup" />
}
