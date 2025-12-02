"""
Supabase client initialization and utilities
"""
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Load .env from project root if it exists (for local development)
# In production (Railway/Docker), environment variables are provided by the platform
env_path = Path(__file__).parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    # Try loading from current directory or parent directories
    load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
# Try multiple key names for compatibility
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY") or  # Preferred name
    os.getenv("SUPABASE_KEY") or               # Alternative
    os.getenv("SUPABASE_ANON_KEY")             # Fallback (not recommended for backend)
)

if not SUPABASE_URL or not SUPABASE_KEY:
    raise EnvironmentError(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. "
        "Add them to your .env file in the project root."
    )


def get_supabase_client(access_token: str = None) -> Client:
    """
    Get Supabase client instance
    
    Args:
        access_token: Optional user JWT token for RLS context
    
    Returns:
        Client: Supabase client
    """
    # Always create a fresh client to avoid token contamination
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # If access token provided, set it for RLS context
    if access_token:
        client.postgrest.auth(access_token)
    
    return client


# Log the key being used (first 20 chars for security)
from utils.custom_logger import log_handler
log_handler.info(f"Initializing Supabase with URL: {SUPABASE_URL}")
log_handler.info(f"Using service key starting with: {SUPABASE_KEY[:20]}...")

# Global client instance (for backend operations with service role key)
# This should NEVER have user tokens set on it
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
