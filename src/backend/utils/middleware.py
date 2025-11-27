"""
#############################################################################
### Authentication middleware for FastAPI
###
### @file middleware.py
### @author Sebastian Russo
### @date 2025
#############################################################################
"""
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import jwt
import os
from dotenv import load_dotenv

from utils.custom_logger import log_handler

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

if not SUPABASE_JWT_SECRET:
    log_handler.error("Missing SUPABASE_JWT_SECRET environment variable")
    raise EnvironmentError(
        "Missing SUPABASE_JWT_SECRET. "
        "Get it from Supabase Dashboard > Settings > API > JWT Secret"
    )

# HTTP Bearer token security scheme
security = HTTPBearer()


class AuthMiddleware:
    """
    Authentication middleware for validating Supabase JWT tokens
    """
    
    @staticmethod
    def verify_token(token: str) -> dict:
        """
        Verify and decode JWT token
        
        Args:
            token: JWT token string
            
        Returns:
            dict: Decoded token payload
            
        Raises:
            HTTPException: If token is invalid, expired, or malformed
        """
        try:
            # Decode and verify token
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
                options={"verify_exp": True}
            )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            log_handler.warning("Token has expired")
            raise HTTPException(
                status_code=401,
                detail="Token has expired. Please refresh your session."
            )
        except jwt.InvalidAudienceError:
            log_handler.warning("Invalid token audience")
            raise HTTPException(
                status_code=401,
                detail="Invalid token audience"
            )
        except jwt.InvalidTokenError as e:
            log_handler.warning(f"Invalid token: {str(e)}")
            raise HTTPException(
                status_code=401,
                detail=f"Invalid token: {str(e)}"
            )
        except Exception as e:
            log_handler.error(f"Token validation failed: {str(e)}")
            raise HTTPException(
                status_code=401,
                detail=f"Token validation failed: {str(e)}"
            )
    
    @staticmethod
    def extract_user_id(payload: dict) -> str:
        """
        Extract user ID from token payload
        
        Args:
            payload: Decoded JWT payload
            
        Returns:
            str: User ID (UUID)
            
        Raises:
            HTTPException: If user ID is missing
        """
        user_id = payload.get("sub")
        
        if not user_id:
            log_handler.warning("Token missing user ID")
            raise HTTPException(
                status_code=401,
                detail="Invalid token: missing user ID"
            )
        
        log_handler.debug(f"User authenticated: {user_id}")
        return user_id
    
    @staticmethod
    def get_user_from_token(credentials: HTTPAuthorizationCredentials) -> str:
        """
        Validate token and extract user ID
        
        Args:
            credentials: HTTP Bearer credentials
            
        Returns:
            str: User ID
        """
        payload = AuthMiddleware.verify_token(credentials.credentials)
        return AuthMiddleware.extract_user_id(payload)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Dependency to get current authenticated user ID
    
    Usage in route:
        @app.get("/protected")
        async def protected_route(user_id: str = Depends(get_current_user)):
            return {"user_id": user_id}
    
    Args:
        credentials: HTTP Bearer credentials from request
        
    Returns:
        str: User ID
    """
    return AuthMiddleware.get_user_from_token(credentials)


async def optional_auth(
    request: Request
) -> Optional[str]:
    """
    Optional authentication dependency
    Returns user_id if authenticated, None otherwise
    
    Usage in route:
        @app.get("/public-or-private")
        async def route(user_id: Optional[str] = Depends(optional_auth)):
            if user_id:
                # User is authenticated
                pass
            else:
                # Public access
                pass
    
    Args:
        request: FastAPI request object
        
    Returns:
        Optional[str]: User ID if authenticated, None otherwise
    """
    auth_header = request.headers.get("Authorization")
    
    if not auth_header:
        return None
    
    try:
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            return None
        
        payload = AuthMiddleware.verify_token(token)
        return AuthMiddleware.extract_user_id(payload)
        
    except (ValueError, HTTPException):
        return None
