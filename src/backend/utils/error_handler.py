"""
Error handling utilities for TuneTools backend
Provides user-friendly error messages and comprehensive error logging
"""
import traceback
from typing import Optional, Dict, Any
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from utils.custom_logger import log_handler


class TuneToolsException(Exception):
    """Base exception for TuneTools application"""
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.code = code or "INTERNAL_ERROR"
        self.details = details or {}
        super().__init__(self.message)


class ValidationException(TuneToolsException):
    """Validation error exception"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=400,
            code="VALIDATION_ERROR",
            details=details
        )


class AuthenticationException(TuneToolsException):
    """Authentication error exception"""
    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            message=message,
            status_code=401,
            code="UNAUTHORIZED"
        )


class PermissionException(TuneToolsException):
    """Permission error exception"""
    def __init__(self, message: str = "You don't have permission to perform this action"):
        super().__init__(
            message=message,
            status_code=403,
            code="FORBIDDEN"
        )


class NotFoundException(TuneToolsException):
    """Resource not found exception"""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(
            message=message,
            status_code=404,
            code="NOT_FOUND"
        )


class RateLimitException(TuneToolsException):
    """Rate limit exceeded exception"""
    def __init__(self, message: str = "Too many requests. Please try again later."):
        super().__init__(
            message=message,
            status_code=429,
            code="RATE_LIMIT_EXCEEDED"
        )


class ExternalServiceException(TuneToolsException):
    """External service error exception"""
    def __init__(self, service: str, message: str = "External service error"):
        super().__init__(
            message=f"{service}: {message}",
            status_code=502,
            code="EXTERNAL_SERVICE_ERROR",
            details={"service": service}
        )


# User-friendly error messages
ERROR_MESSAGES = {
    "SONG_GENERATION_FAILED": "Failed to generate your song. Please try again or adjust your preferences.",
    "SONG_ALREADY_EXISTS": "You've already generated a song today. Come back tomorrow for a new one!",
    "AUDIO_LOAD_FAILED": "Unable to load the audio file. Please try again.",
    "IMAGE_UPLOAD_FAILED": "Failed to upload the image. Please try a different file.",
    "SETTINGS_SAVE_FAILED": "Unable to save your settings. Please try again.",
    "NEWS_FETCH_FAILED": "Unable to fetch news articles. Please try again later.",
    "WEATHER_FETCH_FAILED": "Unable to fetch weather data. Please try again later.",
    "CALENDAR_FETCH_FAILED": "Unable to fetch calendar events. Please check your connection.",
    "PROFILE_UPDATE_FAILED": "Unable to update your profile. Please try again.",
    "INVALID_INPUT": "Please check your input and try again.",
    "DATABASE_ERROR": "A database error occurred. Please try again.",
    "NETWORK_ERROR": "Network error. Please check your internet connection.",
}


def get_user_friendly_message(code: str, default: str = "An error occurred") -> str:
    """Get user-friendly error message from error code"""
    return ERROR_MESSAGES.get(code, default)


def log_error(
    error: Exception,
    context: str = "",
    user_id: Optional[str] = None,
    request: Optional[Request] = None
) -> None:
    """
    Log error with context information
    
    Args:
        error: The exception that occurred
        context: Context where the error occurred (e.g., "song_generation")
        user_id: User ID if available
        request: FastAPI request object if available
    """
    error_info = {
        "error_type": type(error).__name__,
        "error_message": str(error),
        "context": context,
        "user_id": user_id,
    }
    
    if request:
        error_info.update({
            "method": request.method,
            "url": str(request.url),
            "client_host": request.client.host if request.client else None,
        })
    
    # Log the error with traceback
    log_handler.error(
        f"Error in {context}: {error_info}",
        exc_info=True
    )
    
    # TODO: Send to external error tracking service (e.g., Sentry)
    # sentry_sdk.capture_exception(error)


async def tunetools_exception_handler(request: Request, exc: TuneToolsException) -> JSONResponse:
    """
    Global exception handler for TuneToolsException
    """
    log_error(exc, context="tunetools_exception", request=request)
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.message,
            "code": exc.code,
            "details": exc.details
        }
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Global exception handler for HTTPException
    """
    log_error(exc, context="http_exception", request=request)
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "code": f"HTTP_{exc.status_code}"
        }
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global exception handler for unhandled exceptions
    """
    log_error(exc, context="unhandled_exception", request=request)
    
    # Don't expose internal error details in production
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Please try again later.",
            "code": "INTERNAL_ERROR"
        }
    )


def handle_external_service_error(service: str, error: Exception) -> None:
    """
    Handle errors from external services (RunPod, Supabase, etc.)
    
    Args:
        service: Name of the external service
        error: The exception that occurred
    
    Raises:
        ExternalServiceException: Always raises with user-friendly message
    """
    log_handler.error(f"External service error ({service}): {str(error)}")
    
    # Map common errors to user-friendly messages
    error_str = str(error).lower()
    
    if "timeout" in error_str:
        message = f"The {service} service is taking too long to respond. Please try again."
    elif "connection" in error_str or "network" in error_str:
        message = f"Unable to connect to {service}. Please check your internet connection."
    elif "rate limit" in error_str or "429" in error_str:
        message = f"Too many requests to {service}. Please wait a moment and try again."
    elif "unauthorized" in error_str or "401" in error_str:
        message = f"Authentication failed with {service}. Please contact support."
    else:
        message = f"An error occurred with {service}. Please try again later."
    
    raise ExternalServiceException(service=service, message=message)
