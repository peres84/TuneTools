"""
Calendar API endpoints for Google Calendar integration
"""
import os
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse
from typing import Optional
from services.calendar import CalendarService
from utils.middleware import get_current_user

router = APIRouter(prefix="/api/calendar", tags=["calendar"])
calendar_service = CalendarService()


@router.get("/authorize")
async def get_authorization_url(
    user_id: str = Depends(get_current_user)
):
    """
    Get Google Calendar OAuth authorization URL
    
    Returns:
        dict: Authorization URL for user to visit
    """
    try:
        auth_url = calendar_service.get_authorization_url(user_id)
        return {
            "authorization_url": auth_url,
            "message": "Visit this URL to authorize calendar access"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate authorization URL: {str(e)}"
        )


@router.get("/callback")
async def handle_oauth_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: str = Query(..., description="User ID passed as state parameter")
):
    """
    Handle OAuth callback from Google
    
    Args:
        code: Authorization code
        state: User ID
        
    Returns:
        HTML redirect to frontend with success/error message
    """
    from fastapi.responses import RedirectResponse
    
    try:
        # Exchange code for tokens and store
        await calendar_service.handle_oauth_callback(code, state)
        
        # Redirect to OAuth callback page with success message
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(url=f"{frontend_url}/oauth/callback?calendar=success")
        
    except Exception as e:
        # Redirect to OAuth callback page with error message
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        error_msg = str(e).replace(" ", "+")
        return RedirectResponse(url=f"{frontend_url}/oauth/callback?calendar=error&message={error_msg}")


@router.get("/status")
async def get_calendar_status(
    user_id: str = Depends(get_current_user)
):
    """
    Check if user has connected Google Calendar
    
    Returns:
        dict: Connection status
    """
    try:
        from db.supabase_client import supabase
        
        response = (
            supabase.table("calendar_integrations")
            .select("id, provider, created_at")
            .eq("user_id", user_id)
            .eq("provider", "google")
            .execute()
        )
        
        is_connected = len(response.data) > 0
        
        return {
            "connected": is_connected,
            "provider": "google" if is_connected else None,
            "connected_at": response.data[0]["created_at"] if is_connected else None
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check calendar status: {str(e)}"
        )


@router.get("/activities")
async def get_calendar_activities(
    user_id: str = Depends(get_current_user),
    days_ahead: int = Query(None, ge=1, le=90, description="Number of days to fetch (1-90, deprecated)"),
    months: int = Query(3, ge=1, le=3, description="Number of months to fetch (1-3, centered on current month)")
):
    """
    Get calendar activities for the specified number of months
    
    Args:
        days_ahead: (Deprecated) Number of days to look ahead
        months: Number of months to fetch (default: 3 = previous + current + next month)
    
    Returns:
        dict: Calendar activities grouped by date
    """
    from utils.custom_logger import log_handler
    from datetime import datetime, timedelta
    import calendar as cal
    
    try:
        # Calculate date range based on months
        today = datetime.now()
        current_year = today.year
        current_month = today.month
        
        if months == 1:
            # Current month only
            start_date = datetime(current_year, current_month, 1)
            last_day = cal.monthrange(current_year, current_month)[1]
            end_date = datetime(current_year, current_month, last_day)
        elif months == 2:
            # Current month + next month
            start_date = datetime(current_year, current_month, 1)
            next_month = current_month + 1 if current_month < 12 else 1
            next_year = current_year if current_month < 12 else current_year + 1
            last_day = cal.monthrange(next_year, next_month)[1]
            end_date = datetime(next_year, next_month, last_day)
        else:  # months == 3 (default)
            # Previous month + current month + next month
            prev_month = current_month - 1 if current_month > 1 else 12
            prev_year = current_year if current_month > 1 else current_year - 1
            start_date = datetime(prev_year, prev_month, 1)
            
            next_month = current_month + 1 if current_month < 12 else 1
            next_year = current_year if current_month < 12 else current_year + 1
            last_day = cal.monthrange(next_year, next_month)[1]
            end_date = datetime(next_year, next_month, last_day)
        
        # Calculate days_ahead and days_behind from date range
        calculated_days_ahead = (end_date - today).days + 1
        calculated_days_behind = (today - start_date).days
        
        # Use days_ahead parameter if provided (for backward compatibility)
        if days_ahead is not None:
            calculated_days_ahead = days_ahead
            calculated_days_behind = 30  # Default for backward compatibility
        
        log_handler.info(f"[CALENDAR] Fetching activities for user {user_id}, months={months}")
        log_handler.info(f"[CALENDAR] Date range: {start_date.date()} to {end_date.date()}")
        log_handler.info(f"[CALENDAR] Days behind: {calculated_days_behind}, Days ahead: {calculated_days_ahead}")
        
        activities = await calendar_service.get_calendar_activities(
            user_id=user_id,
            days_ahead=calculated_days_ahead,
            days_behind=calculated_days_behind
        )
        
        log_handler.info(f"[CALENDAR] Retrieved {len(activities)} activities from service")
        
        # Group activities by date
        from collections import defaultdict
        from datetime import datetime
        
        activities_by_date = defaultdict(list)
        
        for activity in activities:
            date_key = activity.start_time.strftime("%Y-%m-%d")
            activities_by_date[date_key].append({
                "title": activity.title,
                "start_time": activity.start_time.isoformat(),
                "end_time": activity.end_time.isoformat() if activity.end_time else None,
                "location": activity.location,
                "description": activity.description,
                "is_all_day": activity.is_all_day
            })
        
        result = {
            "activities": dict(activities_by_date),
            "total_count": len(activities)
        }
        
        log_handler.info(f"[CALENDAR] Returning {len(activities_by_date)} days with activities")
        log_handler.debug(f"[CALENDAR] Response: {result}")
        
        return result
        
    except Exception as e:
        log_handler.error(f"[CALENDAR] Error fetching activities: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch calendar activities: {str(e)}"
        )


@router.delete("/revoke")
async def revoke_calendar_access(
    user_id: str = Depends(get_current_user)
):
    """
    Revoke calendar access and delete stored credentials
    
    Returns:
        dict: Success message
    """
    try:
        await calendar_service.revoke_access(user_id)
        
        return {
            "success": True,
            "message": "Calendar access revoked successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to revoke calendar access: {str(e)}"
        )
