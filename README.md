# Travel Itinerary Creator — HackKU 2026

Turn TikTok travel videos into saved places and trip itineraries.

## What's here

- `frontend/` — Expo (React Native, TypeScript) mobile app with auth, ingestion, saved places, trip builder, and map.
- `backend/` — FastAPI service with a TikTok ingestion pipeline (yt-dlp → text extraction → AI place parser → geocoding) and an AI itinerary planner.
- `supabase/migrations/` — the full Postgres schema with RLS, triggers, and auto-profile creation.
- `plan.md` — the original hackathon product spec.
- `CLAUDE.md` — onboarding notes for Claude Code sessions.

## Run it

See **[DEVELOPER.md](./DEVELOPER.md)** for step-by-step setup (Supabase, backend, Expo dev client, env vars, smoke test, and what's left to finish).

## Quick start (TL;DR)

```bash
# 1. Apply the schema in Supabase SQL Editor:
#    paste supabase/migrations/20260418000000_initial_schema.sql → Run

# 2. Backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # fill SUPABASE_* and OPENAI_API_KEY
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 3. Frontend (in another terminal)
cd frontend && npm install
cp .env.example .env.local   # fill EXPO_PUBLIC_*
npm run start
```

Set `MOCK_AI=1` in `backend/.env` for a fully offline demo (stubbed places + itinerary).
