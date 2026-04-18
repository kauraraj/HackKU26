from fastapi import Depends, Header, HTTPException, status
from .database import get_service_client


class CurrentUser:
    def __init__(self, user_id: str, email: str | None, access_token: str):
        self.id = user_id
        self.email = email
        self.access_token = access_token


async def get_current_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        # Supabase Auth verification via service client
        client = get_service_client()
        resp = client.auth.get_user(token)
        user = resp.user
        if not user:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
        return CurrentUser(user_id=user.id, email=user.email, access_token=token)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Auth failed: {exc}") from exc


CurrentUserDep = Depends(get_current_user)
