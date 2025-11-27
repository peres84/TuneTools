"""
#############################################################################
### Root endpoint file
###
### @file root_endpoint.py
### @author Sebastian Russo
### @date 2025
#############################################################################

This module contains an endpoint that simply returns a dictionary confirming
backend is up and running correctly, it serves no other purpose
"""

#Third-party imports
from fastapi import APIRouter, Request

#Other files imports
from utils.custom_logger import log_handler
from utils.limiter import limiter as SlowLimiter
from configuration.config_loader import config


"""API ROUTER-----------------------------------------------------------"""
#Get API router
router = APIRouter(
    prefix=config['endpoints']['root_directory_endpoint']['endpoint_prefix'],
    tags=[config['endpoints']['root_directory_endpoint']['endpoint_tag']],
)

"""ENDPOINT-----------------------------------------------------------"""
#Check if app works
@router.get(config['endpoints']['root_directory_endpoint']['endpoint_route']) #/ 
@SlowLimiter.limit(
    f"{config['endpoints']['root_directory_endpoint']['request_limit']}/"
    f"{config['endpoints']['root_directory_endpoint']['unit_of_time_for_limit']}"
)  #Root endpoint to 25 requests per minute
async def root(request: Request):
    """
    Root endpoint to verify that the API is operational.

    This endpoint serves as a basic health check and confirms that the application
    is running correctly. It is rate-limited to 25 requests per minute.

    Parameters:
        request (Request): The incoming HTTP request for limit event management.

    Returns:
        dict: A JSON response indicating that the API is running.
    
    Note:
        If the rate limit is exceeded, the rate_limit_handler() function handles the response.
    """
    log_handler.debug("Backend running successfully")
    return {
        "message": "Backend running successfully, ready to use other endpoints",
        "status": "ok",
        "version": config["app"]["version"]
    }
