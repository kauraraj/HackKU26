"""FastAPI entrypoint."""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import ingestions, places, trips, profile
from .config import get_settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(title="Travel Itinerary Creator API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # hackathon scope: tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingestions.router)
app.include_router(places.router)
app.include_router(trips.router)
app.include_router(profile.router)


@app.get("/health")
def health():
    s = get_settings()
    return {
        "ok": True,
        "mock_ai": s.mock_ai,
        "supabase_configured": bool(s.supabase_url and s.supabase_service_key),
    }
