"""
TuneTools FastAPI Backend
Main application entry point
"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import configuration
from configuration.config_loader import config
import logging

logger = logging.getLogger(__name__)

# Import authentication dependencies
from utils.middleware import get_current_user

# Initialize FastAPI app with config
app = FastAPI(
    title=config["app"]["title"],
    description=config["app"]["description"],
    version=config["app"]["version"],
)

# Configure CORS
origins = [
    "http://localhost:3000",  # React dev server
    "http://localhost:5173",  # Vite dev server
    "http://localhost:8080",
    os.getenv("FRONTEND_URL", ""),  # Production frontend URL (e.g., https://tunetools.vercel.app)
]

# Remove empty strings from origins
origins = [origin for origin in origins if origin]

logger.info(f"CORS enabled for origins: {origins}")

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
from api import user, songs, albums, share, root_endpoint

# Include routers
app.include_router(root_endpoint.router, tags=["root"])  # Root endpoint at /
app.include_router(user.router, prefix="/api/user", tags=["user"])
app.include_router(songs.router, prefix="/api/songs", tags=["songs"])
app.include_router(albums.router, prefix="/api/albums", tags=["albums"])
app.include_router(share.router, prefix="/api/share", tags=["share"])


if __name__ == "__main__":
    import uvicorn
    
    # Use configuration
    network_config = config["network"]
    
    uvicorn.run(
        network_config["uvicorn_app_reference"],
        host=network_config["host"],
        port=network_config["server_port"],
        reload=network_config["reload"],
        log_level="info"
    )
