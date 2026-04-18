from __future__ import annotations
from ..database import get_service_client


def confirm_and_save(user_id: str, extracted_place_id: str, overrides: dict) -> dict | None:
    db = get_service_client()

    # Load the extracted candidate (authorized via ingestion_jobs.user_id)
    ep_resp = (
        db.table("extracted_places")
        .select("*, ingestion_jobs!inner(user_id, source_url)")
        .eq("id", extracted_place_id)
        .limit(1)
        .execute()
    )
    if not ep_resp.data:
        return None
    ep = ep_resp.data[0]
    parent = ep.get("ingestion_jobs") or {}
    if parent.get("user_id") != user_id:
        return None

    payload = {
        "user_id": user_id,
        "source_url": parent.get("source_url"),
        "source_platform": "tiktok",
        "original_name": ep.get("original_name"),
        "normalized_name": overrides.get("normalized_name") or ep.get("normalized_name") or ep.get("original_name"),
        "category": ep.get("category"),
        "latitude": ep.get("latitude"),
        "longitude": ep.get("longitude"),
        "address": ep.get("address"),
        "city": ep.get("city"),
        "region": ep.get("region"),
        "country": ep.get("country"),
        "confidence": ep.get("confidence"),
        "notes": overrides.get("notes") or ep.get("reason"),
        "thumbnail_url": ep.get("thumbnail_url"),
        "tags": overrides.get("tags") or [],
    }

    # Duplicate guard (user_id, source_url, normalized_name) is the DB constraint.
    existing = (
        db.table("saved_places")
        .select("*")
        .eq("user_id", user_id)
        .eq("normalized_name", payload["normalized_name"])
        .eq("source_url", payload["source_url"] or "")
        .limit(1)
        .execute()
    )
    if existing.data:
        saved = existing.data[0]
    else:
        ins = db.table("saved_places").insert(payload).execute()
        saved = ins.data[0] if ins.data else None

    db.table("extracted_places").update({"confirmed": True}).eq("id", extracted_place_id).execute()
    return saved


def reject(user_id: str, extracted_place_id: str) -> None:
    db = get_service_client()
    db.table("extracted_places").update({"rejected": True}).eq("id", extracted_place_id).execute()


def list_saved(user_id: str) -> list[dict]:
    db = get_service_client()
    resp = (
        db.table("saved_places")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data or []


def get_saved(user_id: str, place_id: str) -> dict | None:
    db = get_service_client()
    resp = (
        db.table("saved_places")
        .select("*")
        .eq("user_id", user_id)
        .eq("id", place_id)
        .limit(1)
        .execute()
    )
    return resp.data[0] if resp.data else None


def list_for_map(user_id: str) -> list[dict]:
    db = get_service_client()
    resp = (
        db.table("saved_places")
        .select("id, normalized_name, latitude, longitude, category, thumbnail_url")
        .eq("user_id", user_id)
        .not_.is_("latitude", "null")
        .not_.is_("longitude", "null")
        .execute()
    )
    return resp.data or []
