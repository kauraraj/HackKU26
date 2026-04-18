# Developer Setup

Everything a dev needs to get the Travel Itinerary Creator running end-to-end.
Sections are ordered by dependency: finish **Prerequisites → Supabase → Backend → Frontend**
in order on a fresh machine.

---

## 1. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Python | 3.11+ | Required by FastAPI + yt-dlp |
| Node.js | 20.x LTS | Required by Expo |
| npm | bundled with Node | or pnpm/yarn |
| Expo CLI | — | invoked via `npx expo` (no global install needed) |
| Supabase CLI | latest | `brew install supabase/tap/supabase` or see https://supabase.com/docs/guides/cli |
| Xcode (macOS) | 15+ | for iOS simulator — optional if you use Android |
| Android Studio | latest | for Android emulator — optional if you use iOS |
| ffmpeg | latest | `brew install ffmpeg` — yt-dlp uses it for merging streams |

On a physical iOS or Android device you will also need the **Expo Go** app (for managed dev), *or* a custom dev client build (required when using `expo-maps`, since it's a native module that is not in Expo Go).

---

## 2. Supabase project

You can either use a cloud project (fastest for the hackathon) **or** run Supabase locally with Docker. Pick one.

### Option A — Cloud project (recommended)

1. Go to https://supabase.com, create a new project, and wait for provisioning to finish.
2. In **Project Settings → API**, copy:
   - `Project URL` → this is `SUPABASE_URL`
   - `anon` public key → `SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_KEY` (**never** ship this to the mobile app)
3. In **Authentication → Providers**, enable **Email**.
   - For the hackathon, you probably want to **disable "Confirm email"** under Authentication → Sign in/up so that signup → login is instant. Turn it back on for production.
4. Apply the schema. From the repo root:
   ```bash
   # link local CLI to the remote project (you'll need the project ref and db password)
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
   …or, simpler, paste the contents of `supabase/migrations/20260418000000_initial_schema.sql`
   into **SQL Editor → New query** in the dashboard and hit **Run**.

### Option B — Local Supabase

```bash
supabase start             # spins up Docker containers (takes a minute the first time)
supabase db reset          # applies every SQL file in supabase/migrations
```

The `supabase start` command prints the local `API URL`, `anon key`, and `service_role key`.
Use those values in the `.env` files below. Auth confirmations are disabled by default locally.

---

## 3. Backend (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env`:

| Var | What to paste |
|---|---|
| `SUPABASE_URL` | from step 2 |
| `SUPABASE_ANON_KEY` | from step 2 |
| `SUPABASE_SERVICE_KEY` | from step 2 — server-only, bypasses RLS |
| `OPENAI_API_KEY` | your OpenAI key; any OpenAI-compatible provider works |
| `OPENAI_MODEL` | `gpt-4o-mini` is a good default |
| `MOCK_AI` | `1` for offline demo mode (returns stub places / stub itinerary); `0` for real AI |

Run it:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Smoke-test:
```bash
curl http://localhost:8000/health
# → {"ok": true, "mock_ai": false, "supabase_configured": true}
```

Open the interactive docs at http://localhost:8000/docs.

### Backend tests

```bash
cd backend
pytest                                # all tests
pytest tests/test_extraction.py       # single file
pytest -k test_generate_itinerary     # single test
```

Tests force `MOCK_AI=1` so they never call OpenAI or Supabase.

---

## 4. Frontend (Expo)

```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `frontend/.env.local`:

| Var | What to paste |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | same as backend `SUPABASE_URL` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | same as backend `SUPABASE_ANON_KEY` |
| `EXPO_PUBLIC_API_URL` | URL where your FastAPI is running |

**Critical gotcha for physical devices:** `localhost` in the phone means *the phone*. Use your Mac/PC's LAN IP:
```bash
# macOS / Linux
ipconfig getifaddr en0       # e.g. 192.168.1.42
# then in .env.local:
# EXPO_PUBLIC_API_URL=http://192.168.1.42:8000
```
Also start uvicorn with `--host 0.0.0.0` (the default in `.env.example`), otherwise your phone can't reach it.

Run:
```bash
npm run start        # Expo dev tools
# press i for iOS simulator, a for Android emulator, or scan the QR with Expo Go
```

### Dev client build (required for maps)

`expo-maps` is a native module not bundled with Expo Go. If you try to open the **Map** tab under Expo Go you'll see the fallback list view. To get the real map:

```bash
cd frontend
npx expo install expo-dev-client
npx expo prebuild
npx expo run:ios        # or: npx expo run:android
```

This builds a custom dev client with native modules included. Subsequent restarts are just `npm run start`.

### Type-check

```bash
npm run typecheck
```

---

## 5. End-to-end smoke test (what should work when everything is wired)

1. Launch backend: `uvicorn app.main:app --reload`
2. Launch frontend: `npm run start` and open on your device
3. Sign up → you are redirected to the Saved tab (empty state)
4. Tap **Turn a TikTok into a trip**, paste any public TikTok URL
5. You should see a processing spinner, then candidate places appear
   - With `MOCK_AI=1` you'll see stubbed places even if the TikTok has no useful text — useful for demos with flaky Wi-Fi
6. Tap to select, then **Save N place(s)** → lands you back on Saved tab
7. Go to **Trips** → **New trip**, give it a title and dates, pick places, **Create**
8. Trip screen renders day-by-day itinerary with morning/afternoon/evening blocks
9. **Map** tab shows selected places (only inside a dev client build)

---

## 6. Deployment checklist (if you go past the hackathon)

Not needed for the demo — listed for future devs:

- [ ] Set `allow_origins` in `backend/app/main.py` to your real frontend origin (instead of `*`)
- [ ] Remove `SUPABASE_SERVICE_KEY` from anywhere a client might see it; it's server-only
- [ ] Re-enable email confirmation in Supabase Auth
- [ ] Swap `FastAPI BackgroundTasks` for a real queue (RQ / Celery / Supabase Edge Function) so ingestion survives process restarts
- [ ] Add rate limiting on `POST /ingestions` (TikTok calls are not free)
- [ ] Replace Nominatim geocoding with a paid provider (Mapbox, Google) — Nominatim's terms don't allow production use without explicit permission
- [ ] Set Supabase `storage` buckets for thumbnails if you add video frame artifacts
- [ ] Configure EAS Build profiles for production iOS/Android

---

## 7. What's **not** done that devs still need to do

These are the deliberate gaps a future dev needs to close before this is shippable. Each line is something concrete, not a philosophical "add tests":

### Must do before demo

- **Run the SQL migration against your Supabase project** (section 2). The app will crash-loop without it.
- **Fill in both `.env` files**. The backend won't start and the frontend will show a console warning.
- **Share-intent handler on native**. The `app.json` declares Android `SEND` intent filters and iOS URL schemes, but there's no JS code that reads the incoming URL and pushes `/ingestion/new?url=…`. For the hackathon demo we use the manual paste flow. To wire share-to-app properly:
  - Android: read `Linking.getInitialURL()` + `Linking.addEventListener('url', …)` and dispatch on the `SEND` payload.
  - iOS: add a Share Extension target (cannot be done inside managed Expo; requires `expo prebuild` and a native extension target).
- **Generate Supabase types** for stronger typing: `supabase gen types typescript --project-id <ref> > frontend/src/types/supabase.ts` and import them in `src/lib/supabase.ts` via `createClient<Database>(...)`.

### Should do before the demo

- **TikTok transcript / OCR**. The backend currently feeds only title + description + hashtags into the extractor. To boost confidence you want to also pull the caption track (`yt-dlp --write-auto-sub`) and optionally OCR a sampled frame (e.g. with `easyocr`). The scaffolding in `services/tiktok_extractor.py::aggregate_text` is the spot to extend.
- **Geocoding confidence / disambiguation UI**. Nominatim returns one candidate. When a place name is ambiguous (e.g. "Little Italy") the plan calls for letting the user pick the right match. The schema has `extracted_places.geocoding_candidates jsonb` — populate that column with the top N candidates, then add a picker in `app/ingestion/[id].tsx`.
- **Date picker**. Trip creation currently uses plain text fields for `start_date` / `end_date`. Swap in `@react-native-community/datetimepicker` for nicer UX.
- **Better error states**. The 500-level server errors currently surface as raw JSON via `ApiError.message`. Wrap them in a toast component.

### Nice-to-have / stretch

- **Realtime subscription** on `ingestion_jobs` via Supabase Realtime to replace the polling in `useIngestionPolling.ts` (lower battery, snappier).
- **Route drawing on the map** between itinerary items per day (Mapbox Directions API).
- **Shared itinerary links** using `shared_trip_invites` — read-only public page, deep-linked via `tripcreator://trips/shared/<token>`.
- **Image thumbnails**. When we store a TikTok thumbnail URL we hotlink it; for reliability, download and re-host via Supabase Storage.

---

## 8. File map (where to look)

```
backend/
  app/
    main.py                     ← FastAPI entrypoint, CORS, router registration
    config.py                   ← Pydantic-settings, reads .env
    database.py                 ← Supabase service & user clients
    dependencies.py             ← `get_current_user` bearer-token auth
    api/routes/
      ingestions.py             ← POST /ingestions, GET /ingestions/{id}
      places.py                 ← POST /places/confirm, GET /places
      trips.py                  ← POST /trips, POST /trips/{id}/generate-itinerary, PATCH items
      profile.py                ← GET /profile, GET /map/places
    services/
      tiktok_extractor.py       ← yt-dlp wrapper; extract text from metadata
      geocoding.py              ← Nominatim (OpenStreetMap)
    ai/
      place_extractor.py        ← LLM prompt + JSON parsing (has MOCK_AI fallback)
      itinerary_generator.py    ← LLM itinerary planner (has MOCK_AI fallback)
    jobs/
      ingestion_job.py          ← The full async pipeline run from BackgroundTasks
    repositories/               ← All DB reads/writes, typed by Supabase client
    models/schemas.py           ← Pydantic request/response models
  tests/test_extraction.py      ← Offline tests using MOCK_AI=1

frontend/
  app/                          ← Expo Router pages
    _layout.tsx                 ← AuthGate: redirects between (auth) and (tabs)
    (auth)/                     ← login + signup
    (tabs)/                     ← saved places, trips, map, profile
    ingestion/new.tsx           ← paste TikTok URL
    ingestion/[id].tsx          ← polls job, shows candidate places for confirmation
    trips/new.tsx               ← create trip form + place picker
    trips/[id].tsx              ← day-by-day itinerary view
  src/
    lib/supabase.ts             ← Supabase client w/ AsyncStorage session persistence
    lib/api.ts                  ← fetch wrapper that attaches Supabase bearer token
    services/                   ← typed wrappers over REST endpoints
    hooks/useAuth.ts            ← session hook
    hooks/useIngestionPolling.ts← 1.5s polling loop
    components/                 ← Button, PlaceCard, Screen, theme, etc.
    types/index.ts              ← shared TS types mirroring backend Pydantic models

supabase/
  migrations/20260418000000_initial_schema.sql   ← the whole schema, RLS, triggers
```
