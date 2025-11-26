"""
Root endpoint for API health check
"""
from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/")
async def root(request: Request):
    """
    Root endpoint to verify that the API is operational.
    
    This endpoint serves as a basic health check and confirms that the application
    is running correctly.
    
    Parameters:
        request (Request): The incoming HTTP request.
    
    Returns:
        dict: A JSON response indicating that the API is running.
    """
    return {
        "message": "Backend running successfully, ready to use other endpoints",
        "status": "ok",
        "version": "1.0.0"
    }
