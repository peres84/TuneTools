import { useEffect } from 'react'
import { AuthForm } from '../components/AuthForm'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { signOut } = useAuth()

  // Clear any existing session when landing on login page
  useEffect(() => {
    const clearSession = async () => {
      console.log('🧹 LoginPage: Clearing any existing session...')
      await signOut()
    }
    clearSession()
  }, [signOut])

  return <AuthForm mode="login" />
}
