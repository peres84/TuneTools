"""
Calendar Service for Google Calendar integration
"""
import os
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from dotenv import load_dotenv

from models.context import CalendarActivity
from db.supabase_client import supabase

load_dotenv()

# Google Calendar OAuth configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/calendar/callback")


class CalendarService:
    """
    Google Calendar integration service
    
    Handles OAuth flow and calendar event fetching
    """
    
    def __init__(self):
        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
            print("[WARN] Google Calendar credentials not configured")
    
    def get_authorization_url(self, user_id: str) -> str:
        """
        Generate Google OAuth authorization URL
        
        Args:
            user_id: User ID for state parameter
            
        Returns:
            str: Authorization URL
        """
        from urllib.parse import urlencode
        
        params = {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "https://www.googleapis.com/auth/calendar.readonly",
            "access_type": "offline",
            "prompt": "consent",
            "state": user_id  # Pass user_id as state
        }
        
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
        return auth_url
    
    async def handle_oauth_callback(
        self,
        code: str,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Handle OAuth callback and exchange code for tokens
        
        Args:
            code: Authorization code from Google
            user_id: User ID
            
        Returns:
            dict: Token information
        """
        import requests
        
        # Exchange code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        
        try:
            response = requests.post(token_url, data=data, timeout=10)
            response.raise_for_status()
            
            tokens = response.json()
            
            # Store tokens securely in Supabase
            await self._store_credentials(user_id, tokens)
            
            return tokens
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"OAuth callback failed: {str(e)}")
    
    async def _store_credentials(
        self,
        user_id: str,
        tokens: Dict[str, Any]
    ):
        """
        Store calendar credentials securely in Supabase
        
        Args:
            user_id: User ID
            tokens: OAuth tokens
        """
        # Calculate token expiration
        expires_at = None
        if "expires_in" in tokens:
            expires_at = (
                datetime.utcnow() + timedelta(seconds=tokens["expires_in"])
            ).isoformat()
        
        # Upsert credentials
        data = {
            "user_id": user_id,
            "provider": "google",
            "access_token": tokens["access_token"],
            "refresh_token": tokens.get("refresh_token", ""),
            "token_expires_at": expires_at
        }
        
        try:
            # Check if integration exists
            existing = (
                supabase.table("calendar_integrations")
                .select("id")
                .eq("user_id", user_id)
                .eq("provider", "google")
                .execute()
            )
            
            if existing.data:
                # Update existing
                supabase.table("calendar_integrations").update(data).eq(
                    "user_id", user_id
                ).eq("provider", "google").execute()
            else:
                # Insert new
                supabase.table("calendar_integrations").insert(data).execute()
                
            print(f"[OK] Stored calendar credentials for user {user_id}")
            
        except Exception as e:
            raise Exception(f"Failed to store credentials: {str(e)}")
    
    async def get_calendar_activities(
        self,
        user_id: str,
        days_ahead: int = 1,
        days_behind: int = 30
    ) -> List[CalendarActivity]:
        """
        Fetch upcoming calendar activities
        
        Args:
            user_id: User ID
            days_ahead: Number of days to look ahead
            
        Returns:
            List[CalendarActivity]: Upcoming activities
        """
        # Get stored credentials
        try:
            response = (
                supabase.table("calendar_integrations")
                .select("*")
                .eq("user_id", user_id)
                .eq("provider", "google")
                .single()
                .execute()
            )
            
            if not response.data:
                print(f"[WARN] No calendar integration found for user {user_id}")
                return []
            
            credentials = response.data
            access_token = credentials["access_token"]
            
            print(f"[OK] Found calendar integration for user {user_id}")
            
            # Check if token is expired
            if credentials.get("token_expires_at"):
                from datetime import timezone
                expires_at = datetime.fromisoformat(credentials["token_expires_at"])
                now = datetime.now(timezone.utc)
                
                # Make expires_at timezone-aware if it isn't
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                
                print(f"[DEBUG] Token expires at: {expires_at}, Current time: {now}")
                
                if now >= expires_at:
                    print(f"[WARN] Token expired, refreshing...")
                    # Token expired, need to refresh
                    access_token = await self._refresh_access_token(
                        user_id,
                        credentials["refresh_token"]
                    )
                else:
                    print(f"[OK] Token still valid")
            
            # Fetch calendar events
            print(f"[INFO] Fetching calendar events: {days_behind} days behind to {days_ahead} days ahead...")
            activities = await self._fetch_events(access_token, days_ahead, days_behind=days_behind)
            print(f"[OK] Fetched {len(activities)} activities")
            return activities
            
        except Exception as e:
            print(f"[ERROR] Failed to fetch calendar activities: {str(e)}")
            return []
    
    async def _refresh_access_token(
        self,
        user_id: str,
        refresh_token: str
    ) -> str:
        """
        Refresh expired access token
        
        Args:
            user_id: User ID
            refresh_token: Refresh token
            
        Returns:
            str: New access token
        """
        import requests
        
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        
        try:
            response = requests.post(token_url, data=data, timeout=10)
            response.raise_for_status()
            
            tokens = response.json()
            
            # Update stored credentials
            await self._store_credentials(user_id, tokens)
            
            return tokens["access_token"]
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Token refresh failed: {str(e)}")
    
    async def _fetch_events(
        self,
        access_token: str,
        days_ahead: int,
        days_behind: int = 30
    ) -> List[CalendarActivity]:
        """
        Fetch calendar events from Google Calendar API
        
        Args:
            access_token: Google access token
            days_ahead: Number of days to look ahead
            days_behind: Number of days to look behind (default: 30)
            
        Returns:
            List[CalendarActivity]: Calendar activities
        """
        import requests
        
        # Calculate time range - include past events for calendar view
        time_min = (datetime.utcnow() - timedelta(days=days_behind)).isoformat() + "Z"
        time_max = (datetime.utcnow() + timedelta(days=days_ahead)).isoformat() + "Z"
        
        url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
        headers = {"Authorization": f"Bearer {access_token}"}
        params = {
            "timeMin": time_min,
            "timeMax": time_max,
            "singleEvents": True,
            "orderBy": "startTime",
            "maxResults": 100  # Increased to handle 3 months of events
        }
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            activities = []
            
            for item in data.get("items", []):
                # Parse start time
                start = item.get("start", {})
                if "dateTime" in start:
                    start_time = datetime.fromisoformat(start["dateTime"].replace("Z", "+00:00"))
                    is_all_day = False
                else:
                    start_time = datetime.fromisoformat(start["date"])
                    is_all_day = True
                
                # Parse end time
                end = item.get("end", {})
                end_time = None
                if "dateTime" in end:
                    end_time = datetime.fromisoformat(end["dateTime"].replace("Z", "+00:00"))
                elif "date" in end:
                    end_time = datetime.fromisoformat(end["date"])
                
                activities.append(CalendarActivity(
                    title=item.get("summary", "Untitled Event"),
                    start_time=start_time,
                    end_time=end_time,
                    location=item.get("location"),
                    description=item.get("description"),
                    is_all_day=is_all_day
                ))
            
            print(f"[OK] Fetched {len(activities)} calendar activities")
            return activities
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to fetch calendar events: {str(e)}")
    
    async def revoke_access(self, user_id: str):
        """
        Revoke calendar access and delete stored credentials
        
        Args:
            user_id: User ID
        """
        try:
            # Delete from database
            supabase.table("calendar_integrations").delete().eq(
                "user_id", user_id
            ).eq("provider", "google").execute()
            
            print(f"[OK] Revoked calendar access for user {user_id}")
            
        except Exception as e:
            raise Exception(f"Failed to revoke access: {str(e)}")
