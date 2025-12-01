"""
News Aggregator Service with fallback logic and 70/30 distribution
"""
import os
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from dotenv import load_dotenv
import time

from models.context import NewsArticle
from utils.custom_logger import log_handler

load_dotenv()

# API Keys
SERPAPI_KEY = os.getenv("SERPAPI_API_KEY")
NEWSAPI_KEY = os.getenv("NEWSAPI_API_KEY")
WORLDNEWS_API_KEY = os.getenv("WORLDNEWS_API_KEY")


class NewsAggregatorService:
    """
    News aggregation service with fallback logic and 70/30 distribution
    
    Primary: SerpAPI
    Fallback 1: NewsAPI
    Fallback 2: WorldNewsAPI
    """
    
    def __init__(self):
        self.cache: Dict[str, tuple[List[NewsArticle], float]] = {}
        self.cache_ttl = 3600  # 1 hour in seconds
    
    def fetch_news(
        self,
        user_categories: List[str],
        location: str = "US",
        max_articles: int = 10
    ) -> List[NewsArticle]:
        """
        Fetch news with 70/30 distribution
        
        70% from user's preferred categories
        30% from general news
        
        Args:
            user_categories: User's preferred news categories
            location: Location/country code
            max_articles: Maximum number of articles to return
            
        Returns:
            List[NewsArticle]: Aggregated news articles
        """
        # Check cache
        cache_key = f"{','.join(sorted(user_categories))}:{location}:{max_articles}"
        if cache_key in self.cache:
            cached_articles, cached_time = self.cache[cache_key]
            if time.time() - cached_time < self.cache_ttl:
                log_handler.info(f"[OK] Returning cached news ({len(cached_articles)} articles)")
                return cached_articles
        
        # Calculate distribution
        preferred_count = int(max_articles * 0.7)  # 70%
        general_count = max_articles - preferred_count  # 30%
        
        log_handler.info(f"[NEWS] Fetching news: {preferred_count} preferred + {general_count} general")
        
        # Fetch preferred category news
        preferred_articles = self._fetch_with_fallback(
            categories=user_categories,
            location=location,
            count=preferred_count
        )
        
        # Fetch general news
        general_articles = self._fetch_with_fallback(
            categories=None,  # General news
            location=location,
            count=general_count
        )
        
        # Combine and deduplicate
        all_articles = preferred_articles + general_articles
        unique_articles = self._deduplicate_articles(all_articles)
        
        # Cache results
        self.cache[cache_key] = (unique_articles, time.time())
        
        return unique_articles[:max_articles]
    
    def _fetch_with_fallback(
        self,
        categories: Optional[List[str]],
        location: str,
        count: int
    ) -> List[NewsArticle]:
        """
        Fetch news with fallback logic
        
        Tries: SerpAPI → NewsAPI → WorldNewsAPI
        """
        # Try SerpAPI (Primary)
        if SERPAPI_KEY:
            try:
                log_handler.info("[SEARCH] Trying SerpAPI (primary)...")
                articles = self._fetch_from_serpapi(categories, location, count)
                if articles:
                    log_handler.info(f"[OK] SerpAPI returned {len(articles)} articles")
                    return articles
            except Exception as e:
                log_handler.warning("SerpAPI failed: {str(e)}")
        
        # Try NewsAPI (Fallback 1)
        if NEWSAPI_KEY:
            try:
                log_handler.info("[SEARCH] Trying NewsAPI (fallback 1)...")
                articles = self._fetch_from_newsapi(categories, location, count)
                if articles:
                    log_handler.info(f"[OK] NewsAPI returned {len(articles)} articles")
                    return articles
            except Exception as e:
                log_handler.warning("NewsAPI failed: {str(e)}")
        
        # Try WorldNewsAPI (Fallback 2)
        if WORLDNEWS_API_KEY:
            try:
                log_handler.info("[SEARCH] Trying WorldNewsAPI (fallback 2)...")
                articles = self._fetch_from_worldnews(categories, location, count)
                if articles:
                    log_handler.info(f"[OK] WorldNewsAPI returned {len(articles)} articles")
                    return articles
            except Exception as e:
                log_handler.warning("WorldNewsAPI failed: {str(e)}")
        
        log_handler.error("All news APIs failed")
        return []
    
    def _fetch_from_serpapi(
        self,
        categories: Optional[List[str]],
        location: str,
        count: int
    ) -> List[NewsArticle]:
        """Fetch from SerpAPI"""
        # Build query
        if categories:
            query = " OR ".join(categories)
        else:
            query = "news"
        
        url = "https://serpapi.com/search"
        params = {
            "engine": "google_news",
            "q": query,
            "num": count,
            "api_key": SERPAPI_KEY
        }
        
        # Only add location if provided (for worldwide news, omit location)
        if location and location.strip():
            params["gl"] = location.lower()
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        articles = []
        
        for item in data.get("news_results", [])[:count]:
            articles.append(NewsArticle(
                title=item.get("title", ""),
                description=item.get("snippet", ""),
                content=item.get("snippet", ""),
                url=item.get("link", ""),
                source=item.get("source", {}).get("name", "Unknown"),
                author=None,
                published_at=item.get("date", ""),
                image_url=item.get("thumbnail", "")
            ))
        
        return articles
    
    def _fetch_from_newsapi(
        self,
        categories: Optional[List[str]],
        location: str,
        count: int
    ) -> List[NewsArticle]:
        """Fetch from NewsAPI"""
        # For worldwide news, use 'everything' endpoint instead of 'top-headlines'
        if not location or not location.strip():
            url = "https://newsapi.org/v2/everything"
            params = {
                "apiKey": NEWSAPI_KEY,
                "pageSize": count,
                "sortBy": "publishedAt",
                "language": "en"
            }
            
            # Add category-based query
            if categories and len(categories) > 0:
                params["q"] = " OR ".join(categories)
            else:
                params["q"] = "news"
        else:
            url = "https://newsapi.org/v2/top-headlines"
            params = {
                "apiKey": NEWSAPI_KEY,
                "country": location.lower(),
                "pageSize": count
            }
            
            # Add category if specified
            if categories and len(categories) > 0:
                # NewsAPI only supports single category
                # Map common categories to NewsAPI categories
                category_map = {
                    "technology": "technology",
                    "business": "business",
                    "entertainment": "entertainment",
                    "health": "health",
                    "science": "science",
                    "sports": "sports"
                }
                for cat in categories:
                    if cat.lower() in category_map:
                        params["category"] = category_map[cat.lower()]
                        break
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        articles = []
        
        for item in data.get("articles", [])[:count]:
            articles.append(NewsArticle(
                title=item.get("title", ""),
                description=item.get("description", ""),
                content=item.get("content", ""),
                url=item.get("url", ""),
                source=item.get("source", {}).get("name", "Unknown"),
                author=item.get("author"),
                published_at=item.get("publishedAt", ""),
                image_url=item.get("urlToImage")
            ))
        
        return articles
    
    def _fetch_from_worldnews(
        self,
        categories: Optional[List[str]],
        location: str,
        count: int
    ) -> List[NewsArticle]:
        """Fetch from WorldNewsAPI"""
        url = "https://api.worldnewsapi.com/search-news"
        
        # Build query
        if categories:
            query = " OR ".join(categories)
        else:
            query = "news"
        
        params = {
            "api-key": WORLDNEWS_API_KEY,
            "text": query,
            "number": count,
            "sort": "publish-time",
            "sort-direction": "DESC"
        }
        
        # Only add location if provided (for worldwide news, omit location)
        if location and location.strip():
            params["source-countries"] = location.lower()
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        articles = []
        
        for item in data.get("news", [])[:count]:
            articles.append(NewsArticle(
                title=item.get("title", ""),
                description=item.get("text", "")[:200],  # Truncate
                content=item.get("text", ""),
                url=item.get("url", ""),
                source=item.get("source", "Unknown"),
                author=item.get("author"),
                published_at=item.get("publish_date", ""),
                image_url=item.get("image")
            ))
        
        return articles
    
    def _deduplicate_articles(self, articles: List[NewsArticle]) -> List[NewsArticle]:
        """Remove duplicate articles based on title similarity"""
        seen_titles = set()
        unique_articles = []
        
        for article in articles:
            # Normalize title for comparison
            normalized_title = article.title.lower().strip()
            
            if normalized_title not in seen_titles:
                seen_titles.add(normalized_title)
                unique_articles.append(article)
        
        return unique_articles
    
    def clear_cache(self):
        """Clear the news cache"""
        self.cache.clear()
        log_handler.info("[DELETE] News cache cleared")
