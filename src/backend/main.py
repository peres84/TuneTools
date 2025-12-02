"""
#############################################################################
### TuneTools FastAPI Backend
### Main application entry point
###
### @file main.py
### @author Sebastian Russo
### @date 2025
#############################################################################
"""
# Fix Windows console encoding FIRST (before any other imports)
import sys
if sys.platform == 'win32':
    import codecs
    # Only wrap if not already wrapped
    if not hasattr(sys.stdout, 'buffer'):
        pass  # Already wrapped
    else:
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

#Native imports
import os
from contextlib import asynccontextmanager

#Third-party imports
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import configuration
from configuration.config_loader import config

# Import utilities
from utils.custom_logger import log_handler
from utils.limiter import limiter
from utils.request_limiter import rate_limit_handler

# Import authentication dependencies
from utils.middleware import get_current_user

"""API APP-----------------------------------------------------------"""
#Lifespan event manager (startup and shutdown)
@asynccontextmanager
async def lifespan(app: FastAPI):
    port = os.getenv("PORT", config["network"]["server_port"])
    log_handler.info(f"TuneTools backend server starting on port {port}")
    yield
    log_handler.info("TuneTools backend server shutting down")

# Initialize FastAPI app with config
app = FastAPI(
    title=config["app"]["title"],
    description=config["app"]["description"],
    version=config["app"]["version"],
    lifespan=lifespan
)

"""VARIOUS-----------------------------------------------------------"""
#Setup rate limiter
app.state.limiter = limiter

#Add global exception handlers
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

# Import error handlers
from utils.error_handler import (
    TuneToolsException,
    tunetools_exception_handler,
    http_exception_handler,
    general_exception_handler
)
from fastapi import HTTPException

# Add custom exception handlers
app.add_exception_handler(TuneToolsException, tunetools_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Configure CORS
origins = [
    "http://localhost:3000",  # React dev server
    "http://localhost:5173",  # Vite dev server
    "http://localhost:8000",
    "http://localhost:8080",
    os.getenv("FRONTEND_URL", "https://tune-tools.vercel.app/"),  # Production frontend URL (e.g., https://tunetools.vercel.app)
]

# Remove empty strings from origins
origins = [origin for origin in origins if origin]

log_handler.info(f"CORS enabled for origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",  # TODO: Add actual DB check
        "services": {
            "supabase": "ok",
            "runpod": "ok",
        }
    }


@app.get("/protected-example")
async def protected_example(user_id: str = Depends(get_current_user)):
    """
    Example protected endpoint requiring authentication
    
    This demonstrates how to use the authentication middleware.
    The user_id is automatically extracted from the JWT token.
    """
    return {
        "message": "This is a protected endpoint",
        "user_id": user_id,
        "authenticated": True
    }


# Import API routers
from api import user, songs, albums, share, root_endpoint, songs_management, albums_management, auth, calendar

# Include routers
app.include_router(root_endpoint.router, tags=["root"])  # Root endpoint at /
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(user.router, prefix="/api/user", tags=["user"])
app.include_router(songs.router, prefix="/api/songs", tags=["songs"])
app.include_router(songs_management.router, prefix="/api/songs", tags=["songs-management"])
app.include_router(albums.router, prefix="/api/albums", tags=["albums"])
app.include_router(albums_management.router, prefix="/api/albums", tags=["albums-management"])
app.include_router(share.router, prefix="/api/share", tags=["share"])
app.include_router(calendar.router, tags=["calendar"])


"""Start server-----------------------------------------------------------"""
if __name__ == "__main__":
    import uvicorn
    
    # Use configuration
    port = int(os.getenv("PORT", config["network"]["server_port"]))
    
    # Configure uvicorn logging format to match our custom logger
    log_config = uvicorn.config.LOGGING_CONFIG
    log_config["formatters"]["default"]["fmt"] = "%(asctime)s %(msecs)03dZ | %(levelname)s | %(message)s"
    log_config["formatters"]["default"]["datefmt"] = "%Y-%m-%d %H:%M:%S"
    log_config["formatters"]["access"]["fmt"] = "%(asctime)s %(msecs)03dZ | %(levelname)s | %(client_addr)s - %(request_line)s %(status_code)s"
    log_config["formatters"]["access"]["datefmt"] = "%Y-%m-%d %H:%M:%S"
    
    uvicorn.run(
        config["network"]["uvicorn_app_reference"],
        host=config["network"]["host"],
        port=port,
        reload=config["network"]["reload"],
        workers=config["network"]["workers"],
        proxy_headers=config["network"]["proxy_headers"],
        log_config=log_config
    )
