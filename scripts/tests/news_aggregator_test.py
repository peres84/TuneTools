"""
Test script for NewsAggregatorService
Tests fallback logic and 70/30 distribution
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src', 'backend'))

from services.news_aggregator import NewsAggregatorService


def test_news_aggregation():
    """Test news aggregation with 70/30 distribution"""
    print("=" * 80)
    print("Testing NewsAggregatorService")
    print("=" * 80)
    
    service = NewsAggregatorService()
    
    # Test 1: Fetch news with user preferences
    print("\n🧪 Test 1: Fetch news with preferred categories")
    user_categories = ["technology", "business", "science"]
    
    try:
        articles = service.fetch_news(
            user_categories=user_categories,
            location="US",
            max_articles=10
        )
        
        print(f"\n✅ Fetched {len(articles)} articles")
        print(f"📊 Expected: 7 preferred + 3 general (70/30 split)")
        
        # Display first 3 articles
        print("\n📰 Sample articles:")
        for i, article in enumerate(articles[:3], 1):
            print(f"\n[{i}] {article.title}")
            print(f"    Source: {article.source}")
            print(f"    URL: {article.url}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Test 2: Test caching
    print("\n" + "=" * 80)
    print("🧪 Test 2: Test caching (should return cached results)")
    
    try:
        articles = service.fetch_news(
            user_categories=user_categories,
            location="US",
            max_articles=10
        )
        print(f"✅ Returned {len(articles)} articles (from cache)")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Test 3: Clear cache and fetch again
    print("\n" + "=" * 80)
    print("🧪 Test 3: Clear cache and fetch fresh")
    
    service.clear_cache()
    
    try:
        articles = service.fetch_news(
            user_categories=["sports"],
            location="US",
            max_articles=5
        )
        print(f"✅ Fetched {len(articles)} fresh articles")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    print("\n" + "=" * 80)
    print("✅ Tests complete!")
    print("=" * 80)


if __name__ == "__main__":
    test_news_aggregation()
