from fastapi import APIRouter, HTTPException, status

from ...dependencies import CurrentUserDep, CurrentUser
from ...models.schemas import (
    TripCreate, TripUpdate, Trip, TripDay, ItineraryItem, ItineraryItemUpdate, SavedPlace,
)
from ...repositories import trip_repo, place_repo
from ...ai.itinerary_generator import generate_itinerary

router = APIRouter(prefix="/trips", tags=["trips"])


def _hydrate(user_id: str, trip: dict) -> Trip:
    days = trip_repo.list_days(trip["id"])
    items = trip_repo.list_items_for_trip(trip["id"])
    items_by_day: dict[str, list[dict]] = {}
    for it in items:
        items_by_day.setdefault(it["trip_day_id"], []).append(it)

    hydrated_days = [
        TripDay(**d, items=[ItineraryItem(**i) for i in items_by_day.get(d["id"], [])])
        for d in days
    ]

    # Attach any places referenced by itinerary items
    referenced_place_ids = {i["saved_place_id"] for i in items if i.get("saved_place_id")}
    places = place_repo.list_saved(user_id)
    visible_places = [p for p in places if p["id"] in referenced_place_ids]

    return Trip(
        **trip,
        days=hydrated_days,
        places=[SavedPlace(**p) for p in visible_places],
    )


@router.post("", response_model=Trip)
def create_trip(body: TripCreate, user: CurrentUser = CurrentUserDep):
    payload = body.model_dump(mode="json")
    trip = trip_repo.create_trip(user.id, payload)

    # If the user already selected places at creation time, run the planner immediately
    if body.place_ids:
        places = trip_repo.places_for_ids(user.id, body.place_ids)
        plan = generate_itinerary(trip, places)
        trip_repo.replace_itinerary(trip["id"], plan.get("days", []))

    return _hydrate(user.id, trip)


@router.get("", response_model=list[Trip])
def list_trips(user: CurrentUser = CurrentUserDep):
    trips = trip_repo.list_trips(user.id)
    return [_hydrate(user.id, t) for t in trips]


@router.get("/{trip_id}", response_model=Trip)
def get_trip(trip_id: str, user: CurrentUser = CurrentUserDep):
    trip = trip_repo.get_trip(user.id, trip_id)
    if not trip:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Trip not found")
    return _hydrate(user.id, trip)


@router.patch("/{trip_id}", response_model=Trip)
def update_trip(trip_id: str, body: TripUpdate, user: CurrentUser = CurrentUserDep):
    trip = trip_repo.update_trip(user.id, trip_id, body.model_dump(mode="json", exclude_unset=True))
    if not trip:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Trip not found")
    return _hydrate(user.id, trip)


class _GenerateBody(TripUpdate):
    place_ids: list[str] = []


@router.post("/{trip_id}/generate-itinerary", response_model=Trip)
def generate_itinerary_for_trip(
    trip_id: str,
    body: _GenerateBody,
    user: CurrentUser = CurrentUserDep,
):
    trip = trip_repo.get_trip(user.id, trip_id)
    if not trip:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Trip not found")

    place_ids = body.place_ids
    if not place_ids:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Select at least one place.")

    places = trip_repo.places_for_ids(user.id, place_ids)
    if not places:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "None of the selected places belong to this user.")

    plan = generate_itinerary(trip, places)
    trip_repo.replace_itinerary(trip_id, plan.get("days", []))
    return _hydrate(user.id, trip)


@router.patch("/items/{item_id}", response_model=ItineraryItem)
def update_item(item_id: str, body: ItineraryItemUpdate, user: CurrentUser = CurrentUserDep):
    updated = trip_repo.update_item(user.id, item_id, body.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item not found")
    return ItineraryItem(**updated)
