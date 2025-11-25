"""
Supabase client initialization and utilities
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise EnvironmentError(
        "Missing SUPABASE_URL or SUPABASE_KEY. "
        "Add them to your .env file."
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
