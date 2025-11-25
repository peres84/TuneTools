"""
News API Test Script
Fetches news articles using NewsAPI.org
"""
import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

NEWSAPI_API_KEY = os.getenv("NEWSAPI_API_KEY")

if not NEWSAPI_API_KEY:
    raise EnvironmentError(
        "Missing NEWSAPI_API_KEY. "
        "Add it to your .env file: NEWSAPI_API_KEY=your_key_here"
    )

BASE_URL = "https://newsapi.org/v2"


def get_top_headlines(country="us", category=None, query=None, page_size=10):
    """
    Get top headlines from NewsAPI

    Args:
        country (str): 2-letter country code (us, de, gb, etc.)
        category (str): Category (business, entertainment, general, health, science, sports, technology)
        query (str): Keywords or phrases to search for
        page_size (int): Number of results to return (max 100)

    Returns:
        list: List of article dictionaries
    """
    url = f"{BASE_URL}/top-headlines"
    params = {
        "apiKey": NEWSAPI_API_KEY,
        "pageSize": page_size,
    }

    if country:
        params["country"] = country
    if category:
        params["category"] = category
    if query:
        params["q"] = query

    try:
        response = requests.get(url, params=params, timeout=10)

        if response.status_code == 200:
            data = response.json()
            if data["status"] == "ok":
                return parse_articles(data["articles"])
            else:
                raise Exception(f"API Error: {data.get('message', 'Unknown error')}")
        else:
            raise Exception(f"HTTP Error: {response.status_code} - {response.text}")

    except requests.exceptions.RequestException as e:
        raise Exception(f"Network error: {str(e)}")


def search_everything(
    query, from_date=None, to_date=None, language="en", sort_by="publishedAt", page_size=10
):
    """
    Search all articles matching a query

    Args:
        query (str): Keywords or phrases to search for
        from_date (str): Date to search from (YYYY-MM-DD format)
        to_date (str): Date to search to (YYYY-MM-DD format)
        language (str): 2-letter language code (en, de, es, etc.)
        sort_by (str): Sort order (relevancy, popularity, publishedAt)
        page_size (int): Number of results to return (max 100)

    Returns:
        list: List of article dictionaries
    """
    url = f"{BASE_URL}/everything"
    params = {
        "apiKey": NEWSAPI_API_KEY,
        "q": query,
        "language": language,
        "sortBy": sort_by,
        "pageSize": page_size,
    }

    if from_date:
        params["from"] = from_date
    if to_date:
        params["to"] = to_date

    try:
        response = requests.get(url, params=params, timeout=10)

        if response.status_code == 200:
            data = response.json()
            if data["status"] == "ok":
                return parse_articles(data["articles"])
            else:
                raise Exception(f"API Error: {data.get('message', 'Unknown error')}")
        else:
            raise Exception(f"HTTP Error: {response.status_code} - {response.text}")

    except requests.exceptions.RequestException as e:
        raise Exception(f"Network error: {str(e)}")


def get_sources(category=None, language="en", country=None):
    """
    Get available news sources

    Args:
        category (str): Category filter
        language (str): Language filter
        country (str): Country filter

    Returns:
        list: List of source dictionaries
    """
    url = f"{BASE_URL}/top-headlines/sources"
    params = {"apiKey": NEWSAPI_API_KEY}

    if category:
        params["category"] = category
    if language:
        params["language"] = language
    if country:
        params["country"] = country

    try:
        response = requests.get(url, params=params, timeout=10)

        if response.status_code == 200:
            data = response.json()
            if data["status"] == "ok":
                return data["sources"]
            else:
                raise Exception(f"API Error: {data.get('message', 'Unknown error')}")
        else:
            raise Exception(f"HTTP Error: {response.status_code} - {response.text}")

    except requests.exceptions.RequestException as e:
        raise Exception(f"Network error: {str(e)}")


def parse_articles(articles):
    """
    Parse and extract relevant data from articles

    Args:
        articles (list): Raw article data from API

    Returns:
        list: Cleaned article dictionaries
    """
    parsed = []
    for article in articles:
        parsed.append(
            {
                "title": article.get("title", ""),
                "description": article.get("description", ""),
                "content": article.get("content", ""),
                "url": article.get("url", ""),
                "source": article.get("source", {}).get("name", "Unknown"),
                "author": article.get("author", "Unknown"),
                "published_at": article.get("publishedAt", ""),
                "image_url": article.get("urlToImage", ""),
            }
        )
    return parsed


def print_articles(articles, max_articles=5):
    """Print formatted article summaries"""
    print("\n" + "=" * 80)
    print(f"📰 Found {len(articles)} articles")
    print("=" * 80)

    for i, article in enumerate(articles[:max_articles], 1):
        print(f"\n[{i}] {article['title']}")
        print(f"    Source: {article['source']} | Author: {article['author']}")
        print(f"    Published: {article['published_at']}")
        if article["description"]:
            desc = article["description"][:150]
            print(f"    {desc}{'...' if len(article['description']) > 150 else ''}")
        print(f"    URL: {article['url']}")

    if len(articles) > max_articles:
        print(f"\n... and {len(articles) - max_articles} more articles")

    print("\n" + "=" * 80 + "\n")


if __name__ == "__main__":
    # Test 1: Get top headlines from US
    print("🧪 Test 1: Top Headlines (US)")
    try:
        articles = get_top_headlines(country="us", page_size=5)
        print_articles(articles)
    except Exception as e:
        print(f"❌ Error: {str(e)}\n")

    # Test 2: Get top tech headlines
    print("🧪 Test 2: Top Tech Headlines")
    try:
        articles = get_top_headlines(country="us", category="technology", page_size=5)
        print_articles(articles)
    except Exception as e:
        print(f"❌ Error: {str(e)}\n")

    # Test 3: Search for specific topic
    print("🧪 Test 3: Search for 'artificial intelligence'")
    try:
        # Get articles from last 7 days
        today = datetime.now()
        week_ago = today - timedelta(days=7)
        articles = search_everything(
            query="artificial intelligence",
            from_date=week_ago.strftime("%Y-%m-%d"),
            to_date=today.strftime("%Y-%m-%d"),
            sort_by="popularity",
            page_size=5,
        )
        print_articles(articles)
    except Exception as e:
        print(f"❌ Error: {str(e)}\n")

    # Test 4: Get available sources
    print("🧪 Test 4: Available Tech News Sources")
    try:
        sources = get_sources(category="technology", language="en")
        print(f"\n📡 Found {len(sources)} tech news sources:")
        for source in sources[:10]:
            print(f"  - {source['name']} ({source['id']})")
        if len(sources) > 10:
            print(f"  ... and {len(sources) - 10} more")
        print()
    except Exception as e:
        print(f"❌ Error: {str(e)}\n")
