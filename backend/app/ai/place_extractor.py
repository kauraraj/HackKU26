"""
Place extraction pipeline.

Given text pulled from a TikTok (caption + transcript + OCR + hashtags),
return a JSON list of candidate places, each with confidence 0-1.
"""
from __future__ import annotations
import json
import logging
from typing import Any
from openai import OpenAI

from ..config import get_settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You extract travel places from short-form video content (TikTok captions, transcripts, OCR text, hashtags).

Return ONLY JSON. Schema:
{
  "places": [
    {
      "name": string,              // exactly as referenced in the video
      "normalized_name": string,   // cleaner, searchable form
      "city": string | null,
      "region": string | null,
      "country": string | null,
      "category": "restaurant" | "cafe" | "bar" | "landmark" | "museum" | "beach" | "nature" | "viewpoint" | "hotel" | "shopping" | "nightlife" | "hidden_gem" | "other",
      "reason": string,            // 1 sentence, why it is worth visiting per the video
      "confidence": number          // 0.0 - 1.0
    }
  ]
}

Rules:
- If nothing recognizable appears, return {"places": []}. Do NOT invent.
- Confidence > 0.7 only when name + (city or clear landmark) is explicit.
- Confidence 0.4–0.7 for plausible but ambiguous references.
- Confidence < 0.4 for guesses; still include them so the user can confirm.
- Do not include personal names, hashtag-only noise, or generic phrases ("great food").
"""


def _mock_places(text: str) -> list[dict[str, Any]]:
    seed = text.lower()
    samples = []
    if "tokyo" in seed or "japan" in seed:
        samples.append({
            "name": "Shibuya Crossing",
            "normalized_name": "Shibuya Crossing",
            "city": "Tokyo", "region": None, "country": "Japan",
            "category": "landmark",
            "reason": "Iconic scramble intersection highlighted in the video.",
            "confidence": 0.88,
        })
    if "paris" in seed or "france" in seed or "eiffel" in seed:
        samples.append({
            "name": "Café de Flore",
            "normalized_name": "Café de Flore",
            "city": "Paris", "region": None, "country": "France",
            "category": "cafe",
            "reason": "Classic Left Bank café shown with morning pastries.",
            "confidence": 0.72,
        })
    if not samples:
        samples.append({
            "name": "Sunset Viewpoint",
            "normalized_name": "Sunset Viewpoint",
            "city": None, "region": None, "country": None,
            "category": "viewpoint",
            "reason": "Video features a sunset scene — location unclear.",
            "confidence": 0.35,
        })
    return samples


def extract_places(text: str) -> list[dict[str, Any]]:
    """Main entry. Returns a list of candidate place dicts."""
    s = get_settings()
    if s.mock_ai or not s.openai_api_key:
        logger.info("place_extractor: using mock AI")
        return _mock_places(text)

    try:
        client = OpenAI(api_key=s.openai_api_key)
        resp = client.chat.completions.create(
            model=s.openai_model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Source text:\n\n{text[:6000]}"},
            ],
            temperature=0.2,
        )
        content = resp.choices[0].message.content or "{}"
        data = json.loads(content)
        return data.get("places", [])
    except Exception as exc:
        logger.exception("place_extractor failed: %s", exc)
        return []
