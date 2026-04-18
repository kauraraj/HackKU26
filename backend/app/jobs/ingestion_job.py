"""
Background pipeline that runs when a TikTok URL is posted.

Stages:
  1. mark job processing
  2. yt-dlp fetch metadata
  3. aggregate text (title + description + tags)
  4. AI place extraction
  5. geocode each candidate
  6. persist extracted_places
  7. mark job completed (or failed)

MVP note: we run this with FastAPI BackgroundTasks. For production,
swap for a proper queue (RQ / Celery / Arq / Supabase Edge Functions).
"""
from __future__ import annotations
import asyncio
import logging
from datetime import datetime, timezone

from ..database import get_service_client
from ..services.tiktok_extractor import fetch_metadata, aggregate_text, summarize_source
from ..services.geocoding import geocode_place
from ..ai.place_extractor import extract_places

logger = logging.getLogger(__name__)


async def _run_pipeline(job_id: str, source_url: str) -> None:
    db = get_service_client()

    def _touch(status: str, **extra):
        patch = {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}
        patch.update(extra)
        db.table("ingestion_jobs").update(patch).eq("id", job_id).execute()

    try:
        _touch("processing", started_at=datetime.now(timezone.utc).isoformat())

        # 1. yt-dlp (blocking) in a thread
        info = await asyncio.to_thread(fetch_metadata, source_url)
        source_summary = summarize_source(info)

        video_payload = {
            "source_url": source_url,
            "source_platform": "tiktok",
            **source_summary,
        }
        # upsert source_videos by (platform, external_id)
        video_id = None
        if source_summary.get("external_id"):
            existing = (
                db.table("source_videos")
                .select("id")
                .eq("source_platform", "tiktok")
                .eq("external_id", source_summary["external_id"])
                .limit(1)
                .execute()
            )
            if existing.data:
                video_id = existing.data[0]["id"]
                db.table("source_videos").update(video_payload).eq("id", video_id).execute()
        if video_id is None:
            inserted = db.table("source_videos").insert(video_payload).execute()
            video_id = inserted.data[0]["id"] if inserted.data else None

        if video_id:
            db.table("ingestion_jobs").update({"source_video_id": video_id}).eq("id", job_id).execute()

        # 2. aggregate + AI extract
        text = aggregate_text(info)
        if not text:
            _touch("failed", error_message="No usable text in TikTok metadata.")
            return

        candidates = await asyncio.to_thread(extract_places, text)

        # 3. geocode
        rows = []
        for c in candidates:
            geo = await geocode_place(
                c.get("normalized_name") or c.get("name") or "",
                c.get("city"),
                c.get("country"),
            )
            rows.append({
                "ingestion_job_id": job_id,
                "original_name": c.get("name") or "(unknown)",
                "normalized_name": c.get("normalized_name") or c.get("name"),
                "city": c.get("city"),
                "region": c.get("region"),
                "country": c.get("country"),
                "category": c.get("category"),
                "reason": c.get("reason"),
                "confidence": float(c.get("confidence") or 0.0),
                "latitude": geo.get("latitude") if geo else None,
                "longitude": geo.get("longitude") if geo else None,
                "address": geo.get("address") if geo else None,
                "thumbnail_url": source_summary.get("thumbnail_url"),
            })

        if rows:
            db.table("extracted_places").insert(rows).execute()

        _touch("completed", completed_at=datetime.now(timezone.utc).isoformat())
        logger.info("ingestion job %s completed with %d places", job_id, len(rows))
    except Exception as exc:
        logger.exception("ingestion job %s failed: %s", job_id, exc)
        _touch("failed", error_message=str(exc)[:500])


def run_ingestion(job_id: str, source_url: str) -> None:
    """FastAPI BackgroundTasks calls this synchronously. We bridge to async."""
    asyncio.run(_run_pipeline(job_id, source_url))
