"""
Unit tests that run without network access or Supabase, using mock-AI mode.
"""
import os
os.environ["MOCK_AI"] = "1"

from app.ai.place_extractor import extract_places  # noqa: E402
from app.ai.itinerary_generator import generate_itinerary  # noqa: E402
from app.services.tiktok_extractor import is_tiktok_url  # noqa: E402


def test_is_tiktok_url_accepts_common_forms():
    assert is_tiktok_url("https://www.tiktok.com/@user/video/1234")
    assert is_tiktok_url("https://vm.tiktok.com/abc")
    assert is_tiktok_url("http://tiktok.com/@u/video/9")


def test_is_tiktok_url_rejects_other():
    assert not is_tiktok_url("https://youtube.com/shorts/x")
    assert not is_tiktok_url("")
    assert not is_tiktok_url("not a url")


def test_extract_places_tokyo_matches_mock():
    places = extract_places("", "Amazing day in Tokyo, Japan. Must-visit spots!")
    assert places, "mock should return at least one place"
    assert any("Shibuya" in (p.get("name") or "") for p in places)


def test_generate_itinerary_covers_every_day():
    trip = {"start_date": "2026-05-01", "end_date": "2026-05-03", "destination": "Tokyo"}
    places = [
        {"id": "a", "normalized_name": "Shibuya", "latitude": 35.65, "longitude": 139.7},
        {"id": "b", "normalized_name": "Asakusa", "latitude": 35.71, "longitude": 139.79},
        {"id": "c", "normalized_name": "Shinjuku", "latitude": 35.69, "longitude": 139.70},
    ]
    plan = generate_itinerary(trip, places)
    assert len(plan["days"]) == 3
    assert all(day["items"] for day in plan["days"])
