/**
 * Cache Manager for TuneTools
 * Handles localStorage caching for user data with automatic cleanup
 */

const CACHE_PREFIX = 'tunetools_cache_'
const CACHE_VERSION = 'v1'

interface CacheItem<T> {
  data: T
  timestamp: number
  version: string
}

export const cacheManager = {
  /**
   * Save data to localStorage cache
   */
  set<T>(key: string, data: T, ttlMinutes: number = 30): void {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      }
      localStorage.setItem(cacheKey, JSON.stringify(cacheItem))
      console.log(`💾 Cached: ${key} (TTL: ${ttlMinutes}min)`)
    } catch (error) {
      console.error('Failed to cache data:', error)
    }
  },

  /**
   * Get data from localStorage cache
   */
  get<T>(key: string, ttlMinutes: number = 30): T | null {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`
      const cached = localStorage.getItem(cacheKey)
      
      if (!cached) {
        console.log(`📭 Cache miss: ${key}`)
        return null
      }

      const cacheItem: CacheItem<T> = JSON.parse(cached)
      
      // Check version
      if (cacheItem.version !== CACHE_VERSION) {
        console.log(`🔄 Cache version mismatch: ${key}`)
        this.remove(key)
        return null
      }

      // Check TTL
      const age = Date.now() - cacheItem.timestamp
      const ttlMs = ttlMinutes * 60 * 1000
      
      if (age > ttlMs) {
        console.log(`⏰ Cache expired: ${key} (age: ${Math.round(age / 1000 / 60)}min)`)
        this.remove(key)
        return null
      }

      console.log(`✅ Cache hit: ${key} (age: ${Math.round(age / 1000)}s)`)
      return cacheItem.data
    } catch (error) {
      console.error('Failed to read cache:', error)
      return null
    }
  },

  /**
   * Remove specific cache item
   */
  remove(key: string): void {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`
      localStorage.removeItem(cacheKey)
      console.log(`🗑️ Removed cache: ${key}`)
    } catch (error) {
      console.error('Failed to remove cache:', error)
    }
  },

  /**
   * Clear all TuneTools cache
   */
  clearAll(): void {
    try {
      const keys = Object.keys(localStorage)
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX))
      
      cacheKeys.forEach(key => {
        localStorage.removeItem(key)
      })
      
      console.log(`🧹 Cleared ${cacheKeys.length} cache items`)
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  },

  /**
   * Get cache statistics
   */
  getStats(): { totalItems: number; totalSize: number; items: string[] } {
    try {
      const keys = Object.keys(localStorage)
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX))
      
      let totalSize = 0
      cacheKeys.forEach(key => {
        const item = localStorage.getItem(key)
        if (item) {
          totalSize += item.length
        }
      })

      return {
        totalItems: cacheKeys.length,
        totalSize,
        items: cacheKeys.map(k => k.replace(CACHE_PREFIX, '')),
      }
    } catch (error) {
      console.error('Failed to get cache stats:', error)
      return { totalItems: 0, totalSize: 0, items: [] }
    }
  },
}

// Cache keys
export const CACHE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  SONGS_LIST: 'songs_list',
  ALBUMS_LIST: 'albums_list',
  USER_PROFILE: 'user_profile',
  CALENDAR_ACTIVITIES: 'calendar_activities',
} as const
