from fastapi import APIRouter, HTTPException, status

from ...dependencies import CurrentUserDep, CurrentUser
from ...database import get_service_client
from ...models.schemas import Profile, MapPlace
from ...repositories import place_repo

router = APIRouter(tags=["profile"])


@router.get("/profile", response_model=Profile)
def get_profile(user: CurrentUser = CurrentUserDep):
    db = get_service_client()
    resp = db.table("profiles").select("*").eq("id", user.id).limit(1).execute()
    if not resp.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile not found")
    return Profile(**resp.data[0])


@router.get("/map/places", response_model=list[MapPlace])
def map_places(user: CurrentUser = CurrentUserDep):
    rows = place_repo.list_for_map(user.id)
    return [
        MapPlace(
            id=r["id"],
            name=r["normalized_name"],
            latitude=r["latitude"],
            longitude=r["longitude"],
            category=r.get("category"),
            thumbnail_url=r.get("thumbnail_url"),
        )
        for r in rows
    ]
