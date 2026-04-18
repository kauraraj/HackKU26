from __future__ import annotations
from datetime import date, timedelta
from ..database import get_service_client


def create_trip(user_id: str, payload: dict) -> dict:
    db = get_service_client()
    trip_row = {
        "user_id": user_id,
        "title": payload["title"],
        "destination": payload.get("destination"),
        "start_date": payload["start_date"],
        "end_date": payload["end_date"],
        "budget": payload.get("budget"),
        "vibe": payload.get("vibe"),
    }
    trip = db.table("trips").insert(trip_row).execute().data[0]

    # Pre-create empty days so the UI can render a timeline even before itinerary generation
    start = date.fromisoformat(trip["start_date"])
    end = date.fromisoformat(trip["end_date"])
    day_rows = [
        {"trip_id": trip["id"], "day_number": i + 1, "day_date": (start + timedelta(days=i)).isoformat()}
        for i in range((end - start).days + 1)
    ]
    if day_rows:
        db.table("trip_days").insert(day_rows).execute()

    return trip


def update_trip(user_id: str, trip_id: str, patch: dict) -> dict | None:
    db = get_service_client()
    clean = {k: v for k, v in patch.items() if v is not None}
    if not clean:
        return get_trip(user_id, trip_id)
    resp = (
        db.table("trips")
        .update(clean)
        .eq("id", trip_id)
        .eq("user_id", user_id)
        .execute()
    )
    return resp.data[0] if resp.data else None


def get_trip(user_id: str, trip_id: str) -> dict | None:
    db = get_service_client()
    resp = (
        db.table("trips")
        .select("*")
        .eq("id", trip_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    return resp.data[0] if resp.data else None


def list_trips(user_id: str) -> list[dict]:
    db = get_service_client()
    resp = (
        db.table("trips")
        .select("*")
        .eq("user_id", user_id)
        .order("start_date", desc=True)
        .execute()
    )
    return resp.data or []


def list_days(trip_id: str) -> list[dict]:
    db = get_service_client()
    resp = (
        db.table("trip_days")
        .select("*")
        .eq("trip_id", trip_id)
        .order("day_number")
        .execute()
    )
    return resp.data or []


def list_items_for_trip(trip_id: str) -> list[dict]:
    """Fetch itinerary items across all days of a trip in one round trip."""
    db = get_service_client()
    days = list_days(trip_id)
    if not days:
        return []
    day_ids = [d["id"] for d in days]
    resp = (
        db.table("itinerary_items")
        .select("*")
        .in_("trip_day_id", day_ids)
        .order("position")
        .execute()
    )
    return resp.data or []


def replace_itinerary(trip_id: str, days_plan: list[dict]) -> None:
    """Wipe existing items for the trip and insert generated ones."""
    db = get_service_client()

    existing_days = {d["day_number"]: d for d in list_days(trip_id)}

    # Clear existing items
    for day in existing_days.values():
        db.table("itinerary_items").delete().eq("trip_day_id", day["id"]).execute()

    rows = []
    for day in days_plan:
        day_number = day.get("day_number")
        day_row = existing_days.get(day_number)
        if not day_row:
            # Unexpected — skip rather than crash
            continue

        # Update summary
        if day.get("summary"):
            db.table("trip_days").update({"summary": day["summary"]}).eq("id", day_row["id"]).execute()

        pos_per_block = {"morning": 0, "afternoon": 0, "evening": 0}
        for item in day.get("items", []):
            block = item.get("block") or "afternoon"
            pos = pos_per_block.get(block, 0)
            pos_per_block[block] = pos + 1
            rows.append({
                "trip_day_id": day_row["id"],
                "saved_place_id": item.get("saved_place_id"),
                "block": block,
                "position": pos,
                "title": item.get("title") or "Stop",
                "rationale": item.get("rationale"),
                "estimated_travel_minutes": item.get("estimated_travel_minutes"),
            })

    if rows:
        db.table("itinerary_items").insert(rows).execute()


def update_item(user_id: str, item_id: str, patch: dict) -> dict | None:
    db = get_service_client()
    clean = {k: v for k, v in patch.items() if v is not None}
    if not clean:
        resp = db.table("itinerary_items").select("*").eq("id", item_id).limit(1).execute()
        return resp.data[0] if resp.data else None

    # Authorize via trip ownership
    owner_check = (
        db.table("itinerary_items")
        .select("id, trip_day_id, trip_days!inner(trip_id, trips!inner(user_id))")
        .eq("id", item_id)
        .limit(1)
        .execute()
    )
    if not owner_check.data:
        return None
    owner_id = owner_check.data[0]["trip_days"]["trips"]["user_id"]
    if owner_id != user_id:
        return None

    resp = db.table("itinerary_items").update(clean).eq("id", item_id).execute()
    return resp.data[0] if resp.data else None


def places_for_ids(user_id: str, place_ids: list[str]) -> list[dict]:
    if not place_ids:
        return []
    db = get_service_client()
    resp = (
        db.table("saved_places")
        .select("*")
        .eq("user_id", user_id)
        .in_("id", place_ids)
        .execute()
    )
    return resp.data or []
