"""
Place extraction pipeline using Gemini Multimodal Analysis.
"""
from __future__ import annotations
import json
import logging
import os
import time
from typing import Any

from google import genai
from google.genai import types
from ..config import get_settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Watch the entire video. Identify EVERY unique restaurant, shop, or landmark mentioned or shown.
Also consider any text provided to assist.

Return ONLY JSON array of objects. Schema:
[
  {
    "name": "Specific location name",
    "normalized_name": "Cleaner, searchable name",
    "city": "City name if context provides it, or null",
    "region": "State/Region if known, or null",
    "country": "Country if known, or null",
    "category": "restaurant" | "cafe" | "bar" | "landmark" | "museum" | "beach" | "nature" | "viewpoint" | "hotel" | "shopping" | "nightlife" | "hidden_gem" | "other",
    "vibe": "One of: Main Character, Hidden Quest, Digital Nomad, High Energy, or Touch Grass",
    "reason": "1-sentence transcript snippet or reason it was shown",
    "confidence": 0.9
  }
]

Rules:
- If nothing recognizable appears, return []. Do NOT invent.
- Confidence > 0.7 only when name + (city or clear landmark) is explicit.
- Confidence 0.4–0.7 for plausible but ambiguous references.
- Confidence < 0.4 for guesses; still include them so the user can confirm.
- Do not include personal names, hashtag-only noise, or generic phrases ("great food").
"""


def _mock_places(text: str) -> list[dict[str, Any]]:
    # Mock remains unchanged
    return []

def extract_places(video_path: str, text: str) -> list[dict[str, Any]]:
    """Main entry. Uses Gemini 1.5 Flash to extract locations from video + text."""
    s = get_settings()
    if s.mock_ai or not s.gemini_api_key:
        logger.info("place_extractor: using mock AI or no gemini API key")
        return _mock_places(text)

    if not os.path.exists(video_path):
        logger.error("place_extractor ERROR: File '%s' not found.", video_path)
        return _mock_places(text)

    # Initialize the Gemini client (picks up GEMINI_API_KEY from environment/settings)
    logger.info("Initialize Gemini client...")
    client = genai.Client(api_key=s.gemini_api_key)

    video_file = None
    try:
        # 1. Video Upload
        logger.info("Uploading video file: %s", video_path)
        video_file = client.files.upload(file=video_path)
        logger.info("Successfully uploaded as: %s", video_file.name)

        # Wait for the file to be ACTIVE
        logger.info("Waiting for video processing to complete on Gemini's servers...")
        while video_file.state.name == "PROCESSING":
            time.sleep(10)
            video_file = client.files.get(name=video_file.name)

        if video_file.state.name == "FAILED":
            logger.error("Video processing failed on Gemini's servers.")
            return []
        
        logger.info("Video is ACTIVE and ready for analysis.")

        prompt = SYSTEM_PROMPT + f"\n\nHere is the TikTok metadata text context as well:\n\n{text[:6000]}"

        # 3. Structured Output Request
        logger.info("Sending request to Gemini Flash...")
        response = client.models.generate_content(
            model='gemini-2.5-flash', # Updated to modern flash model
            contents=[
                video_file,
                prompt
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            )
        )

        # Display the result
        try:
            result_json = json.loads(response.text)
            if isinstance(result_json, dict) and "places" in result_json:
                return result_json["places"]
            return result_json
        except Exception as e:
            logger.error("Failed to parse JSON: %s. Raw output: %s", e, response.text)
            return []

    except Exception as e:
        logger.exception("An error occurred: %s", e)
        return []

    finally:
        # 4. Cleanup
        if video_file:
            logger.info("Cleaning up: Deleting %s from Gemini cloud...", video_file.name)
            try:
                client.files.delete(name=video_file.name)
                logger.info("Cleanup complete.")
            except Exception as e:
                logger.error("Failed to delete file: %s", e)
