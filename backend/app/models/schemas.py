from __future__ import annotations
from datetime import date, datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, HttpUrl


IngestionStatus = Literal["queued", "processing", "completed", "failed"]
ItemBlock = Literal["morning", "afternoon", "evening"]


# ---------------------------------------------------------------------------
# Ingestion
# ---------------------------------------------------------------------------
class IngestionCreate(BaseModel):
    source_url: str


class ExtractedPlace(BaseModel):
    id: str
    original_name: str
    normalized_name: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    category: Optional[str] = None
    reason: Optional[str] = None
    confidence: float = 0.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    thumbnail_url: Optional[str] = None
    confirmed: bool = False
    rejected: bool = False


class IngestionJob(BaseModel):
    id: str
    user_id: str
    source_url: str
    status: IngestionStatus
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    extracted_places: list[ExtractedPlace] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Places
# ---------------------------------------------------------------------------
class PlaceConfirmRequest(BaseModel):
    extracted_place_id: str
    normalized_name: Optional[str] = None
    notes: Optional[str] = None
    tags: list[str] = Field(default_factory=list)


class PlaceConfirmBatch(BaseModel):
    confirmations: list[PlaceConfirmRequest]
    rejected_ids: list[str] = Field(default_factory=list)


class SavedPlace(BaseModel):
    id: str
    user_id: str
    source_url: Optional[str] = None
    normalized_name: str
    original_name: Optional[str] = None
    category: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    confidence: Optional[float] = None
    notes: Optional[str] = None
    thumbnail_url: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    created_at: datetime


# ---------------------------------------------------------------------------
# Trips
# ---------------------------------------------------------------------------
class TripCreate(BaseModel):
    title: str
    destination: Optional[str] = None
    start_date: date
    end_date: date
    budget: Optional[str] = None
    vibe: Optional[str] = None
    place_ids: list[str] = Field(default_factory=list)


class TripUpdate(BaseModel):
    title: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[str] = None
    vibe: Optional[str] = None


class ItineraryItem(BaseModel):
    id: str
    trip_day_id: str
    saved_place_id: Optional[str] = None
    block: ItemBlock
    position: int
    title: str
    notes: Optional[str] = None
    rationale: Optional[str] = None
    estimated_travel_minutes: Optional[int] = None


class ItineraryItemUpdate(BaseModel):
    block: Optional[ItemBlock] = None
    position: Optional[int] = None
    title: Optional[str] = None
    notes: Optional[str] = None
    rationale: Optional[str] = None


class TripDay(BaseModel):
    id: str
    trip_id: str
    day_number: int
    day_date: date
    summary: Optional[str] = None
    items: list[ItineraryItem] = Field(default_factory=list)


class Trip(BaseModel):
    id: str
    user_id: str
    title: str
    destination: Optional[str] = None
    start_date: date
    end_date: date
    budget: Optional[str] = None
    vibe: Optional[str] = None
    cover_image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    days: list[TripDay] = Field(default_factory=list)
    places: list[SavedPlace] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------
class Profile(BaseModel):
    id: str
    username: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    home_city: Optional[str] = None
    saved_places_count: int = 0
    trips_count: int = 0


class MapPlace(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    category: Optional[str] = None
    thumbnail_url: Optional[str] = None
