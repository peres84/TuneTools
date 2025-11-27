"""
Supabase client initialization and utilities
"""
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Load .env from project root (two levels up from this file)
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

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
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # If access token provided, set it for RLS context
    if access_token:
        client.postgrest.auth(access_token)
    
    return client


# Global client instance (for non-RLS operations)
supabase: Client = get_supabase_client()
