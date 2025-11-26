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
# Try both SUPABASE_KEY and SUPABASE_ANON_KEY for compatibility
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise EnvironmentError(
        "Missing SUPABASE_URL or SUPABASE_KEY/SUPABASE_ANON_KEY. "
        "Add them to your .env file in the project root."
    )


def get_supabase_client() -> Client:
    """
    Get Supabase client instance
    
    Returns:
        Client: Supabase client
    """
    return create_client(SUPABASE_URL, SUPABASE_KEY)


# Global client instance
supabase: Client = get_supabase_client()
