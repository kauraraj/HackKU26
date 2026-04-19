"""
Itinerary generation pipeline.

Given a trip (dates + selected places with lat/lng), output day-by-day
morning/afternoon/evening blocks. Groups geographically adjacent places per day.
"""
from __future__ import annotations
import json
import logging
import math
from datetime import date, timedelta
from typing import Any
from openai import OpenAI

from ..config import get_settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You plan short travel itineraries for casual trips.

Input: trip dates, destination, optional budget/vibe, and a list of places the user wants to visit (with approximate coordinates).

Output ONLY JSON. Schema:
{
  "days": [
    {
      "day_number": int,      // starts at 1
      "date": "YYYY-MM-DD",
      "summary": string,       // 1 sentence describing the day
      "items": [
        {
          "block": "morning" | "afternoon" | "evening",
          "title": string,              // reuses place name when applicable
          "saved_place_id": string | null,
          "rationale": string,          // 1 sentence why this ordering
          "estimated_travel_minutes": int
        }
      ]
    }
  ]
}

Rules:
- 1 day = 1 entry per day in range (inclusive, start_date..end_date).
- Group nearby places on the same day. Do NOT bounce across the city.
- Max ~4 items per day. Morning should be lighter; evening for food/nightlife.
- Use saved_place_id from input verbatim when linking to a real place.
- Do NOT invent opening hours or prices. If unsure, say so in rationale.
"""


def _haversine_km(a: dict, b: dict) -> float:
    try:
        lat1, lon1 = float(a["latitude"]), float(a["longitude"])
        lat2, lon2 = float(b["latitude"]), float(b["longitude"])
    except (TypeError, ValueError, KeyError):
        return 9999.0
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a_ = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a_))


def _mock_itinerary(trip: dict[str, Any], places: list[dict[str, Any]]) -> dict[str, Any]:
    # Extract just the YYYY-MM-DD part to handle any ISO format including datetime with 'T'
    start_str = trip["start_date"].split("T")[0] if "T" in trip["start_date"] else trip["start_date"]
    end_str = trip["end_date"].split("T")[0] if "T" in trip["end_date"] else trip["end_date"]

    start = date.fromisoformat(start_str)
    end = date.fromisoformat(end_str)
    total_days = (end - start).days + 1
    total_days = max(total_days, 1)

    # Rough spatial cluster: sort by longitude, chunk evenly across days
    ordered = sorted(places, key=lambda p: (p.get("longitude") or 0, p.get("latitude") or 0))
    per_day = max(1, math.ceil(len(ordered) / total_days))
    blocks = ["morning", "afternoon", "evening"]
    days = []
    for d in range(total_days):
        day_places = ordered[d * per_day : (d + 1) * per_day]
        items = []
        for i, p in enumerate(day_places[:3]):
            items.append({
                "block": blocks[i % 3],
                "title": p.get("normalized_name") or p.get("original_name") or "Explore",
                "saved_place_id": p["id"],
                "rationale": "Grouped with nearby stops to keep travel short.",
                "estimated_travel_minutes": 15 * (i + 1),
            })
        if not items:
            items = [{
                "block": "afternoon",
                "title": "Free exploration",
                "saved_place_id": None,
                "rationale": "Buffer day — no saved places assigned.",
                "estimated_travel_minutes": 0,
            }]
        days.append({
            "day_number": d + 1,
            "date": (start + timedelta(days=d)).isoformat(),
            "summary": f"Day {d + 1} around {trip.get('destination') or 'your trip'}",
            "items": items,
        })
    return {"days": days}


def generate_itinerary(trip: dict[str, Any], places: list[dict[str, Any]]) -> dict[str, Any]:
    """Main entry. Returns {"days": [...]}"""
    s = get_settings()
    if s.mock_ai or not s.openai_api_key or not places:
        logger.info("itinerary_generator: using mock planner")
        return _mock_itinerary(trip, places)

    try:
        client = OpenAI(api_key=s.openai_api_key)
        payload = {
            "trip": {
                "title": trip.get("title"),
                "destination": trip.get("destination"),
                "start_date": trip.get("start_date"),
                "end_date": trip.get("end_date"),
                "budget": trip.get("budget"),
                "vibe": trip.get("vibe"),
            },
            "places": [
                {
                    "id": p["id"],
                    "name": p.get("normalized_name") or p.get("original_name"),
                    "category": p.get("category"),
                    "latitude": p.get("latitude"),
                    "longitude": p.get("longitude"),
                    "city": p.get("city"),
                }
                for p in places
            ],
        }
        resp = client.chat.completions.create(
            model=s.openai_model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(payload)},
            ],
            temperature=0.3,
        )
        content = resp.choices[0].message.content or "{}"
        return json.loads(content)
    except Exception as exc:
        logger.exception("itinerary_generator failed, falling back to mock: %s", exc)
        return _mock_itinerary(trip, places)
