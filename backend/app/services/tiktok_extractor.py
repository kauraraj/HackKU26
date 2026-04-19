"""
Wraps yt-dlp to fetch metadata (title, description, uploader, thumbnail)
and subtitles/captions. We intentionally skip video download to avoid
storing large blobs during a hackathon MVP.
"""
from __future__ import annotations
import os
import uuid
import logging
import re
from typing import Any
import yt_dlp

logger = logging.getLogger(__name__)

TIKTOK_URL_RE = re.compile(
    r"^https?://(?:www\.|vm\.|vt\.)?tiktok\.com/.+",
    re.IGNORECASE,
)


def is_tiktok_url(url: str) -> bool:
    return bool(TIKTOK_URL_RE.match(url or ""))


def fetch_metadata(url: str) -> dict[str, Any]:
    """Return yt-dlp info dict. Downloads video temporarily."""
    temp_id = str(uuid.uuid4())
    temp_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'downloads'))
    os.makedirs(temp_dir, exist_ok=True)
    temp_filename = os.path.join(temp_dir, f"{temp_id}.mp4")

    opts = {
        "outtmpl": temp_filename,
        "format": "best",
        "quiet": True,
        "no_warnings": True,
        "writesubtitles": False,
        "writeautomaticsub": False,
        "writeinfojson": False,
        "noplaylist": True,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=True)
        if not info:
            raise RuntimeError("yt-dlp returned no info")
        
        info['downloaded_video_path'] = temp_filename
        return info


def aggregate_text(info: dict[str, Any]) -> str:
    """Concatenate every useful text field from a yt-dlp info dict."""
    parts: list[str] = []
    for key in ("title", "description", "uploader", "creator", "fulltitle"):
        v = info.get(key)
        if v:
            parts.append(str(v))

    tags = info.get("tags") or []
    if tags:
        parts.append("Tags: " + ", ".join(str(t) for t in tags))

    # Subtitles may arrive as {lang: [{url, ext, ...}]} — we can't download captions
    # synchronously here without extra deps, but the description + title on TikTok
    # already carry most of the searchable signal.
    chapters = info.get("chapters") or []
    for ch in chapters:
        if isinstance(ch, dict) and ch.get("title"):
            parts.append(str(ch["title"]))

    return "\n".join(parts).strip()


def summarize_source(info: dict[str, Any]) -> dict[str, Any]:
    return {
        "external_id": info.get("id"),
        "author": info.get("uploader") or info.get("creator"),
        "title": info.get("title"),
        "description": info.get("description"),
        "duration_seconds": info.get("duration"),
        "thumbnail_url": info.get("thumbnail"),
        "raw_hashtags": info.get("tags") or [],
    }
