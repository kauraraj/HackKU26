# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Travel Itinerary Creator** — a mobile app that turns TikTok travel videos into saved places and trip itineraries. Built for HackKU 2026 (24–48 hour hackathon).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Expo (React Native, TypeScript), Expo Router |
| Maps | Expo Maps |
| Backend | FastAPI (Python) |
| Auth / DB / Realtime | Supabase |
| Blob Storage | Supabase Storage |
| Video extraction | yt-dlp (backend) |
| AI | Two pipelines: place extraction + itinerary generation |

## Commands

### Frontend (Expo)
```bash
cd frontend
npx expo start          # Start dev server
npx expo start --ios    # iOS simulator
npx expo start --android
npx tsc --noEmit        # Type check
npx jest                # Run all tests
npx jest path/to/test   # Run single test
```

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload          # Start dev server (port 8000)
uvicorn main:app --reload --port 8000
pytest                             # Run all tests
pytest tests/test_ingestion.py     # Run single test file
pytest -k "test_function_name"     # Run single test
```

### Supabase
```bash
supabase start          # Start local Supabase stack
supabase db reset       # Apply migrations fresh
supabase gen types typescript --local > frontend/src/types/supabase.ts
```

## Architecture

### Data Flow (Core Loop)

```
User shares TikTok URL
  → POST /ingestions (queues async job)
  → backend: yt-dlp fetches metadata + captions
  → text extraction (captions, transcript, OCR, hashtags)
  → AI extracts candidate places with confidence scores
  → geocoding/POI resolution for map coordinates
  → GET /ingestions/{id} polling returns candidate places
  → user confirms/rejects on PlaceConfirmationScreen
  → POST /places/confirm saves to saved_places
  → user creates trip (dates + place selection)
  → POST /trips/{id}/generate-itinerary
  → AI produces day-by-day JSON itinerary
  → rendered as list + map view
```

### Frontend Structure (Expo Router)

```
app/
  (auth)/           # Login/signup screens
  (tabs)/           # Main tab navigator
    index.tsx       # Home / saved places
    trips.tsx       # Trip list
    profile.tsx     # User profile
  ingestion/        # TikTok URL entry + processing state
  places/           # Place confirmation + detail screens
  trips/[id]/       # Trip detail + itinerary view + map
```

Service/hook layers live in `src/services/` and `src/hooks/` — API logic must NOT be written directly in screen components.

### Backend Structure (FastAPI)

```
app/
  api/routes/       # FastAPI route handlers (thin)
  services/         # Business logic
  jobs/             # Background async tasks (ingestion pipeline)
  ai/               # Place extraction + itinerary generation prompts/clients
  repositories/     # Data access (Supabase queries)
  models/           # Pydantic schemas
```

### Key Database Tables

- `ingestion_jobs` — tracks TikTok URL processing (status: queued/processing/completed/failed)
- `source_videos` — metadata about ingested videos (no raw video retained)
- `extracted_places` — raw AI extraction results with confidence scores
- `saved_places` — user-confirmed places (lat/lng, category, tags, source URL)
- `trips` — title, destination, date range, optional budget/vibe
- `trip_days` — day-level structure within a trip
- `itinerary_items` — morning/afternoon/evening blocks per day

### AI Pipelines

**Place extraction** — input: raw text from video (captions + transcript + OCR). Output JSON per place: `name`, `city`, `country`, `category`, `reason`, `confidence` (0–1). Low confidence → show as "possible place" requiring explicit user confirmation.

**Itinerary generation** — input: confirmed places + trip dates. Output: day-by-day JSON grouping nearby places, organized into morning/afternoon/evening blocks. Do not hallucinate opening hours.

## Critical Product Decisions

- **User must confirm extracted places** before they are permanently saved. Never auto-save.
- **Prioritize text extraction** (captions, transcript, OCR) over frame analysis.
- **Confidence scoring required** — places below threshold show a disambiguation/confirmation step.
- **Geocoding is mandatory** — extracted place names alone are insufficient for map plotting.
- **Duplicate detection** — prevent saving the same TikTok/place twice.
- **No raw video storage** — store metadata and derived artifacts only.
- **Async ingestion** — `POST /ingestions` returns a job ID immediately; frontend polls `GET /ingestions/{id}`.

## Environment Variables

Frontend (`.env.local`):
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=
```

Backend (`.env`):
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
OPENAI_API_KEY=        # or whichever AI provider
```

## Build Order (Hackathon Phases)

1. **Foundation** — Supabase project, auth screens, DB migrations, Expo scaffold, FastAPI scaffold
2. **TikTok ingestion** — yt-dlp integration, async job queue, place extraction AI pipeline
3. **Place confirmation/save** — PlaceConfirmationScreen, `POST /places/confirm`, saved places gallery
4. **Trip generation** — trip creation screen, itinerary AI pipeline, list view
5. **Map + polish** — Expo Maps integration, loading states, empty states, error states
6. **Social-lite (stretch)** — share trip via invite link / read-only shared itinerary view
