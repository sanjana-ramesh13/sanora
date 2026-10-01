"""
Supabase JWT verification for FastAPI route protection.
Supabase issues HS256 JWTs signed with the project JWT secret.
"""
import os
from fastapi import Header, HTTPException
from app.database import get_supabase

async def get_current_user_id(authorization: str = Header(...)) -> str:
    """
    FastAPI dependency — verifies a Supabase JWT by calling Supabase Auth.
    Returns the user UUID on success.
    Raises HTTP 401 on any auth failure.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authorization header must start with 'Bearer '",
        )
    token = authorization[7:]

    try:
        db = get_supabase()
        response = db.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(
            status_code=401,
            detail=f"Token verification failed: {exc}",
        )

    if not response.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    return response.user.id
