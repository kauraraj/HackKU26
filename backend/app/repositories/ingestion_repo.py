from __future__ import annotations
from ..database import get_service_client


def create_job(user_id: str, source_url: str) -> dict:
    db = get_service_client()
    resp = (
        db.table("ingestion_jobs")
        .insert({"user_id": user_id, "source_url": source_url, "status": "queued"})
        .execute()
    )
    return resp.data[0]


def get_job(job_id: str, user_id: str) -> dict | None:
    db = get_service_client()
    resp = (
        db.table("ingestion_jobs")
        .select("*")
        .eq("id", job_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    return resp.data[0] if resp.data else None


def list_extracted(job_id: str) -> list[dict]:
    db = get_service_client()
    resp = (
        db.table("extracted_places")
        .select("*")
        .eq("ingestion_job_id", job_id)
        .order("confidence", desc=True)
        .execute()
    )
    return resp.data or []
