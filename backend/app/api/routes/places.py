from fastapi import APIRouter, HTTPException, status

from ...dependencies import CurrentUserDep, CurrentUser
from ...models.schemas import PlaceConfirmBatch, SavedPlace, MapPlace
from ...repositories import place_repo

router = APIRouter(prefix="/places", tags=["places"])


@router.post("/confirm", response_model=list[SavedPlace])
def confirm_places(body: PlaceConfirmBatch, user: CurrentUser = CurrentUserDep):
    saved: list[dict] = []
    for c in body.confirmations:
        row = place_repo.confirm_and_save(
            user_id=user.id,
            extracted_place_id=c.extracted_place_id,
            overrides={
                "normalized_name": c.normalized_name,
                "notes": c.notes,
                "tags": c.tags,
            },
        )
        if row:
            saved.append(row)
    for rid in body.rejected_ids:
        place_repo.reject(user.id, rid)
    return [SavedPlace(**s) for s in saved]


@router.get("", response_model=list[SavedPlace])
def list_places(user: CurrentUser = CurrentUserDep):
    return [SavedPlace(**p) for p in place_repo.list_saved(user.id)]


@router.get("/{place_id}", response_model=SavedPlace)
def get_place(place_id: str, user: CurrentUser = CurrentUserDep):
    p = place_repo.get_saved(user.id, place_id)
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Place not found")
    return SavedPlace(**p)
