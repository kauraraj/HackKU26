"""
Geocoding via Nominatim (OpenStreetMap) by default. Free, rate-limited, no key.
"""
from __future__ import annotations
import logging
import httpx

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "HackKU26-TravelItineraryCreator/0.1 (hackathon)"


async def geocode(query: str) -> dict | None:
    """Return {latitude, longitude, address, ...} or None."""
    if not query:
        return None
    params = {"q": query, "format": "json", "limit": 1, "addressdetails": 1}
    headers = {"User-Agent": USER_AGENT}
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            r = await c.get(NOMINATIM_URL, params=params, headers=headers)
            r.raise_for_status()
            data = r.json()
            if not data:
                return None
            top = data[0]
            return {
                "latitude": float(top["lat"]),
                "longitude": float(top["lon"]),
                "address": top.get("display_name"),
                "osm_id": top.get("osm_id"),
                "type": top.get("type"),
            }
    except Exception as exc:
        logger.warning("geocode failed for %r: %s", query, exc)
        return None


async def geocode_place(name: str, city: str | None, country: str | None) -> dict | None:
    parts = [p for p in [name, city, country] if p]
    return await geocode(", ".join(parts))
