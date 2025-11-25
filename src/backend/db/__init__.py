"""
Database utilities and client initialization
"""
from .supabase_client import supabase, get_supabase_client

__all__ = [
    "supabase",
    "get_supabase_client",
]
