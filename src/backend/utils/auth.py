"""
Authentication utilities for JWT token validation
"""
from fastapi import HTTPException, Header
from typing import Optional
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

if not SUPABASE_JWT_SECRET:
    raise EnvironmentError(
        "Missing SUPABASE_JWT_SECRET. "
        "Get it from Supabase Dashboard > Settings > API > JWT Secret"
    )


def verify_jwt_token(authorization: Optional[str] = Header(None)) -> dict:
    """
    Verify JWT token from Authorization header
    
    Args:
        authorization: Authorization header value (Bearer <token>)
        
    Returns:
        dict: Decoded JWT payload
        
    Raises:
        HTTPException: If token is invalid or missing
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing authorization header"
        )
    
    try:
        # Extract token from "Bearer <token>"
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication scheme"
            )
        
        # Verify and decode token
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        
        return payload
        
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format"
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


def get_user_id_from_token(authorization: Optional[str] = Header(None)) -> str:
    """
    Extract user ID from JWT token
    
    Args:
        authorization: Authorization header value
        
    Returns:
        str: User ID (UUID)
    """
    payload = verify_jwt_token(authorization)
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token: missing user ID"
        )
    
    return user_id
