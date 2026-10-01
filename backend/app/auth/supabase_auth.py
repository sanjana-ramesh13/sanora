"""
Supabase JWT verification for FastAPI route protection.
Supabase issues HS256 JWTs signed with the project JWT secret.
"""
import os
import jwt
from fastapi import Header, HTTPException
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError

async def get_current_user_id(authorization: str = Header(...)) -> str:
    """
    FastAPI dependency — verifies a Supabase JWT locally via PyJWT.
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
        payload = jwt.decode(
            token,
            os.environ["SUPABASE_JWT_SECRET"],
            algorithms=["HS256"],
            audience="authenticated",
        )
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired.")
    except InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing user ID.")

    return user_id
