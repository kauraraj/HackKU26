from functools import lru_cache
from supabase import create_client, Client
from .config import get_settings


@lru_cache
def get_service_client() -> Client:
    """Service-role client. Bypasses RLS — only use inside trusted server code."""
    s = get_settings()
    if not s.supabase_url or not s.supabase_service_key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set. Copy backend/.env.example to .env."
        )
    return create_client(s.supabase_url, s.supabase_service_key)


def get_user_client(access_token: str) -> Client:
    """User-scoped client honoring RLS based on the provided access token."""
    s = get_settings()
    client = create_client(s.supabase_url, s.supabase_anon_key)
    client.postgrest.auth(access_token)
    return client
