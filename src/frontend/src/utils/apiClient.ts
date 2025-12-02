/**
 * API Client with automatic token refresh on 401 errors
 */
import { supabase } from '../services/supabase'

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>
}

/**
 * Fetch wrapper that automatically refreshes tokens on 401 errors
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param retryCount - Internal retry counter (don't set manually)
 * @returns Response
 */
export async function fetchWithAuth(
  url: string,
  options: FetchOptions = {},
  retryCount = 0
): Promise<Response> {
  // Get current session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('No active session')
  }
  
  // Add authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${session.access_token}`
  }
  
  // Make the request
  const response = await fetch(url, {
    ...options,
    headers
  })
  
  // If 401 and we haven't retried yet, refresh token and retry
  if (response.status === 401 && retryCount === 0) {
    console.log('🔄 Got 401, refreshing token and retrying...')
    
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error || !data.session) {
      console.error('❌ Token refresh failed:', error)
      // Sign out user if refresh fails
      await supabase.auth.signOut()
      throw new Error('Session expired. Please log in again.')
    }
    
    console.log('✅ Token refreshed, retrying request...')
    
    // Retry the request with new token
    return fetchWithAuth(url, options, retryCount + 1)
  }
  
  return response
}
