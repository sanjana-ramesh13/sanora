"""Supabase client singleton."""
from functools import lru_cache
import os
from supabase import create_client, Client

@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """Return a cached Supabase client using the service role key (bypasses RLS server-side)."""
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
