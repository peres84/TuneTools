import axios, { type AxiosInstance } from 'axios'
import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add JWT token and log requests
apiClient.interceptors.request.use(
  async (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      params: config.params,
    })
    
    // Get current session from Supabase
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
      console.log('🔑 JWT token added to request')
    } else {
      console.log('⚠️ No JWT token available')
    }
    
    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling and logging
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data,
    })
    return response
  },
  async (error) => {
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    })
    
    if (error.response?.status === 401) {
      console.log('🔄 Attempting to refresh token...')
      // Token expired or invalid, try to refresh
      const { data: { session } } = await supabase.auth.refreshSession()
      
      if (session) {
        console.log('✅ Token refreshed, retrying request')
        // Retry the original request with new token
        error.config.headers.Authorization = `Bearer ${session.access_token}`
        return apiClient.request(error.config)
      } else {
        console.log('❌ Token refresh failed, redirecting to login')
        // Refresh failed, redirect to login
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiClient

// API service methods
export const api = {
  // User endpoints
  user: {
    getPreferences: () => apiClient.get('/api/user/preferences'),
    createPreferences: (data: any) => apiClient.post('/api/user/preferences', data),
    updatePreferences: (data: any) => apiClient.put('/api/user/preferences', data),
    getProfile: () => apiClient.get('/api/user/profile'),
  },
  
  // Song endpoints
  songs: {
    generate: (location?: string) => 
      apiClient.post('/api/songs/generate', { location }),
    list: (limit = 10, offset = 0) => 
      apiClient.get('/api/songs/list', { params: { limit, offset } }),
    getToday: () => apiClient.get('/api/songs/today'),
    getById: (songId: string) => apiClient.get(`/api/songs/${songId}`),
  },
  
  // Album endpoints
  albums: {
    list: (limit = 10, offset = 0) => 
      apiClient.get('/api/albums/list', { params: { limit, offset } }),
    getById: (albumId: string) => apiClient.get(`/api/albums/${albumId}`),
    getCurrentWeek: () => apiClient.get('/api/albums/current-week'),
  },
  
  // Share endpoints (public, no auth required)
  share: {
    getSong: (shareToken: string) => 
      axios.get(`${API_BASE_URL}/api/share/song/${shareToken}`),
  },
}
