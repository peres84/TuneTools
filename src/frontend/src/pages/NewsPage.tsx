import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { DashboardLayout } from '../components/DashboardLayout'
import { NewspaperIcon, ClockIcon, ArrowTopRightOnSquareIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { NewsSkeleton } from '../components/LoadingSkeletons'
import { getUserFriendlyErrorMessage } from '../utils/errorMessages'
import { cacheManager } from '../utils/cacheManager'

interface NewsArticle {
  title: string
  description: string
  url: string
  source: string
  published_at: string
  image_url?: string
}

export function NewsPage() {
  const { session } = useAuth()

  const { data: newsData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['userNews'],
    queryFn: async () => {
      if (!session?.access_token) return null

      // Check cache first
      const cached = cacheManager.get<{ categories: string[]; articles: NewsArticle[] }>('news_feed', 60)
      if (cached) {
        console.log('📰 Using cached news')
        return cached
      }

      // Fetch news from backend
      const newsResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/news?max_articles=12`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!newsResponse.ok) throw new Error('Failed to fetch news')
      const newsData = await newsResponse.json()

      const result = {
        categories: newsData.categories || [],
        articles: newsData.articles || []
      }

      // Cache the news for 60 minutes
      cacheManager.set('news_feed', result, 60)

      return result
    },
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000
  })

  const handleRefresh = () => {
    // Clear cache and refetch
    cacheManager.remove('news_feed')
    refetch()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-brand-primary mb-2">Your News Feed</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Worldwide news based on your interests
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <NewsSkeleton key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-1">
                  Failed to Load News
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400">
                  {getUserFriendlyErrorMessage(error)}
                </p>
              </div>
            </div>
          </div>
        )}

        {newsData && (
          <>
            {/* Categories */}
            {newsData.categories.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Your Interests
                </h2>
                <div className="flex flex-wrap gap-2">
                  {newsData.categories.map((category: string) => (
                    <span
                      key={category}
                      className="px-3 py-1 bg-brand-primary/10 text-brand-primary dark:text-brand-secondary rounded-full text-sm font-medium capitalize"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* News Articles */}
            {newsData.articles.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
                <NewspaperIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  News Feed Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your personalized news feed will appear here. News is currently used for song generation.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsData.articles.map((article: NewsArticle, index: number) => (
                  <a
                    key={index}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden"
                  >
                    {article.image_url && (
                      <div className="aspect-video overflow-hidden bg-gray-200 dark:bg-gray-700">
                        <img
                          src={article.image_url}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-brand-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {article.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                        <span className="font-medium">{article.source}</span>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          <span>{formatDate(article.published_at)}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-brand-primary text-sm font-medium">
                        <span>Read more</span>
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
