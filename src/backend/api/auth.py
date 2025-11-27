"""
#############################################################################
### Authentication API endpoints
### Handles signup and login via backend
###
### @file auth.py
### @author Sebastian Russo
### @date 2025
#############################################################################
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from utils.custom_logger import log_handler
from utils.limiter import limiter as SlowLimiter
from db.supabase_client import supabase

router = APIRouter()


class SignupRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup")
@SlowLimiter.limit("5/minute")
async def signup(request: Request, signup_data: SignupRequest):
    """
    Sign up a new user
    
    Args:
        signup_data: Email and password
        
    Returns:
        User data and session
    """
    try:
        log_handler.info(f"[AUTH] Signup attempt for: {signup_data.email}")
        
        # Sign up user with Supabase
        response = supabase.auth.sign_up({
            "email": signup_data.email,
            "password": signup_data.password
        })
        
        if response.user:
            log_handler.info(f"[AUTH] User created: {response.user.id}")
            
            # Create user profile (trigger should handle this, but backup)
            try:
                supabase.table("user_profiles").insert({
                    "id": str(response.user.id),
                    "onboarding_completed": False
                }).execute()
                log_handler.info(f"[AUTH] User profile created for: {response.user.id}")
            except Exception as profile_error:
                # Profile might already exist from trigger
                log_handler.warning(f"[AUTH] Profile creation skipped: {str(profile_error)}")
            
            return {
                "user": {
                    "id": str(response.user.id),
                    "email": response.user.email,
                    "email_confirmed_at": response.user.email_confirmed_at
                },
                "session": {
                    "access_token": response.session.access_token if response.session else None,
                    "refresh_token": response.session.refresh_token if response.session else None,
                    "expires_at": response.session.expires_at if response.session else None
                } if response.session else None,
                "message": "Signup successful. Please check your email to confirm your account."
            }
        else:
            log_handler.error(f"[AUTH] Signup failed for: {signup_data.email}")
            raise HTTPException(status_code=400, detail="Signup failed")
            
    except Exception as e:
        error_msg = str(e)
        log_handler.error(f"[AUTH] Signup error: {error_msg}")
        
        # Check if email already exists
        if "already registered" in error_msg.lower() or "user already exists" in error_msg.lower():
            raise HTTPException(status_code=409, detail="This email is already registered. Please log in instead.")
        
        raise HTTPException(status_code=400, detail=error_msg)


@router.post("/login")
@SlowLimiter.limit("10/minute")
async def login(request: Request, login_data: LoginRequest):
    """
    Log in an existing user
    
    Args:
        login_data: Email and password
        
    Returns:
        User data, session, and onboarding status
    """
    try:
        log_handler.info(f"[AUTH] Login attempt for: {login_data.email}")
        
        # Sign in user with Supabase
        response = supabase.auth.sign_in_with_password({
            "email": login_data.email,
            "password": login_data.password
        })
        
        if not response.user or not response.session:
            log_handler.error(f"[AUTH] Login failed for: {login_data.email}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        log_handler.info(f"[AUTH] Login successful for: {response.user.id}")
        
        # Check if email is confirmed
        if not response.user.email_confirmed_at:
            log_handler.warning(f"[AUTH] Email not confirmed for: {response.user.id}")
            raise HTTPException(
                status_code=403,
                detail="Please check your email and click the confirmation link before logging in."
            )
        
        # Check onboarding status
        onboarding_completed = False
        try:
            profile_response = (
                supabase.table("user_profiles")
                .select("onboarding_completed")
                .eq("id", str(response.user.id))
                .execute()
            )
            
            if profile_response.data and len(profile_response.data) > 0:
                onboarding_completed = profile_response.data[0].get("onboarding_completed", False)
                log_handler.info(f"[AUTH] Onboarding status for {response.user.id}: {onboarding_completed}")
            else:
                # Profile doesn't exist, create it
                log_handler.warning(f"[AUTH] Profile not found for {response.user.id}, creating...")
                try:
                    supabase.table("user_profiles").insert({
                        "id": str(response.user.id),
                        "onboarding_completed": False
                    }).execute()
                    log_handler.info(f"[AUTH] Profile created for {response.user.id}")
                except Exception as insert_error:
                    log_handler.warning(f"[AUTH] Profile insert failed (may already exist): {str(insert_error)}")
                onboarding_completed = False
                
        except Exception as profile_error:
            log_handler.error(f"[AUTH] Error checking onboarding status: {str(profile_error)}")
            # Default to false if we can't check - don't crash the login
            onboarding_completed = False
        
        return {
            "user": {
                "id": str(response.user.id),
                "email": response.user.email,
                "email_confirmed_at": response.user.email_confirmed_at
            },
            "session": {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
                "expires_at": response.session.expires_at,
                "expires_in": response.session.expires_in
            },
            "onboarding_completed": onboarding_completed,
            "message": "Login successful"
        }
            
    except HTTPException:
        raise
    except Exception as e:
        log_handler.error(f"[AUTH] Login error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid email or password")
