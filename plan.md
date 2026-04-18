You are a senior full-stack product engineer and hackathon architect.

Help me design and build an MVP mobile app called Travel Itinerary Creator, a fun travel planning app that turns TikTok travel videos into saved places and trip itineraries.

Tech stack:
- Frontend: Expo (React Native, TypeScript)
- Maps: Expo Maps library
- Backend: FastAPI (Python)
- Database/Auth/Realtime: Supabase
- File storage/blob storage: Supabase Storage or equivalent blob storage
- Video extraction: yt-dlp on backend
- AI: one model/pipeline for place extraction from TikTok content, one model/pipeline for itinerary planning

Core product idea:
Users scroll TikTok, tap Share, choose our app, and send the TikTok URL into our app. Our backend processes the TikTok URL, extracts useful travel information from the video, identifies the places mentioned or shown, and stores them in the user’s profile as saveable travel spots. Later, the user selects saved places and trip dates, and the app generates an optimized itinerary for their vacation. Long term this becomes a social travel planning app with group trips, rankings, and photo/map-driven recommendations, but for now focus only on the MVP.

Your job:
1. Refine this idea into a realistic hackathon MVP.
2. Call out missing pieces, risky assumptions, and simplify where needed.
3. Propose a production-minded but hackathon-friendly architecture.
4. Generate the app structure, backend structure, data model, API contracts, user flows, and implementation plan.
5. Prioritize speed of implementation, clarity, demo-worthiness, and resilience over perfect completeness.

Important product goals:
- Make travel planning feel fun, magical, and fast.
- Reduce friction between seeing a cool TikTok and saving it for a real trip.
- Give the user a satisfying “inspiration -> saved place -> itinerary” loop.
- Keep the UX simple enough to demo in under 2 minutes.

MVP definition:
The MVP must include only the smallest set of features needed for a compelling demo:
- User authentication
- Receive a TikTok URL through share flow or paste-link fallback
- Send URL to backend for processing
- Extract candidate places from TikTok content
- Let user review/edit/confirm extracted places
- Save confirmed places to user profile
- Create a trip by selecting dates and saved places
- Generate a day-by-day itinerary
- Show itinerary in list view and map view
- Basic profile with saved places and past itineraries

Features that should NOT be in MVP unless trivial:
- Public social feed
- Travel ranks/gamification
- Full friend graph
- Complex recommendation engine
- Geocentric photo recommendation system
- Full collaborative editing
- Advanced personalization
- Heavy moderation tools
- Multi-provider travel booking
- Offline-first mode

However, include clean extension points in the architecture for future features like:
- Group trips
- Inviting friends
- Shared trip editing
- Rankings and badges
- Photo map
- Personalized recommendations
- Public or private itineraries
- Likes/comments/saves on trips

Critical product decisions:
- Assume full automatic extraction is unreliable, so the system must include a user confirmation step before places are permanently saved.
- Prioritize extraction from transcript, captions, title text, OCR text, and metadata first; use frame analysis as a secondary enhancement, not the primary dependency.
- Use confidence scoring for extracted places.
- If extraction confidence is low, show “possible places” and let the user manually confirm, rename, or reject them.
- Itinerary generation should optimize for simplicity:
  - group nearby places together
  - avoid too many place changes in one day
  - support morning / afternoon / evening blocks
  - respect trip date range
  - optionally consider vibe or budget if easy to add
- Include a graceful fallback when no valid places are extracted.

Expected deliverables:
I want you to output all of the following in a structured way:
1. Product summary
2. Refined MVP scope
3. Core user stories
4. End-to-end user flow
5. App screen list and screen-level responsibilities
6. Backend architecture
7. Database schema
8. API endpoints with request/response examples
9. Async processing pipeline for TikTok ingestion
10. AI pipeline design for:
   - place extraction
   - place normalization
   - itinerary generation
11. Storage plan for video/media/artifacts
12. Error handling and fallback UX
13. Security/privacy considerations
14. Hackathon build order by priority
15. Suggested folder structure for Expo app
16. Suggested folder structure for FastAPI app
17. Stretch goals if there is time
19. Clear assumptions and tradeoffs

Specific functional requirements:

A. Authentication and profile
- Use Supabase Auth.
- Users can sign up/log in.
- Profile stores:
  - id
  - username
  - display name
  - avatar url
  - home city (optional)
  - saved places count
  - trips count

B. TikTok ingestion flow
- App supports two input methods:
  1. share-to-app entry point
  2. manual “paste TikTok URL” fallback
- When a TikTok URL is received:
  - validate URL
  - create ingestion job
  - mark status as queued / processing / completed / failed
  - fetch TikTok content via backend
  - extract usable text/signals
  - produce candidate places
  - return them to the app
- Users must see processing state and retry state.

C. Place extraction pipeline
Design the extraction pipeline with the following stages:
1. ingest URL
2. fetch/download metadata and content
3. extract text from:
   - captions
   - transcript if available
   - OCR from sampled frames
   - video description / hashtags if useful
4. run AI/place parser to identify:
   - place name
   - city
   - country/state if possible
   - category (restaurant, landmark, beach, museum, nightlife, cafe, etc.)
   - why it was recommended
   - confidence score
5. normalize place names
6. geocode or resolve into map coordinates
7. return candidate place cards to user for confirmation

Important:
- Explicitly mention that a place search/geocoding/POI resolution layer is required, because extracted names alone are not enough for map plotting or itinerary optimization.
- If multiple place matches exist, design a user-friendly disambiguation step.
- Duplicate detection should prevent the same TikTok/place from being saved repeatedly.

D. Saved places
- Users can save confirmed places to a personal collection.
- Each place record should store:
  - id
  - user_id
  - source_url
  - source_platform
  - original extracted name
  - normalized name
  - category
  - latitude
  - longitude
  - address if available
  - city/region/country
  - confidence
  - notes / reason extracted from video
  - thumbnail or representative image if available
  - created_at
- Allow tags like:
  - food
  - views
  - nightlife
  - nature
  - shopping
  - hidden gem

E. Trip creation
- User creates a trip with:
  - title
  - destination city/region
  - start date
  - end date
  - optional budget or vibe
- User selects from saved places to include.
- Planner generates itinerary with:
  - day number
  - morning / afternoon / evening items
  - short rationale for ordering
  - estimated movement between places
- The generated itinerary should be editable after generation.

F. Map experience
- Show selected places on a map.
- Show itinerary route or clustered daily grouping if route drawing is too hard.
- Tapping a place pin should open place card info.
- Keep map implementation hackathon-friendly and minimal.

G. Social-lite MVP
- Do not build a full social network.
- If including a social feature, keep it very small:
  - share trip with a friend via invite link
  OR
  - let another user view a shared itinerary
- Only include collaborative editing if time remains.

UX requirements:
- The app should feel playful and modern, not like a boring planner.
- Keep UI visually satisfying:
  - card-based saved places
  - smooth loading states
  - celebratory success state after place extraction
  - simple trip timeline view
- Add delight:
  - “Turn this TikTok into a trip” call to action
  - animated processing states
  - clean empty states
- Prioritize mobile-first UX.

Technical architecture requirements:
- Frontend should be organized with Expo Router or equivalent clean navigation structure.
- Use TypeScript throughout frontend.
- Use service layers/hooks instead of putting all API logic in screens.
- Backend should separate:
  - API routes
  - business logic/services
  - background jobs/tasks
  - AI orchestration
  - data access/repositories
- Use async job processing for TikTok ingestion rather than blocking the request cycle.
- Include job status polling or subscriptions on frontend.
- Use Supabase for auth and relational data.
- Use storage for thumbnails, extracted artifacts, or temporary media metadata.
- Be explicit about what should be stored permanently vs temporarily.

Data model requirements:
Design the main tables/entities:
- users / profiles
- ingestion_jobs
- source_videos
- extracted_places
- saved_places
- trips
- trip_days
- itinerary_items
- shared_trip_invites (optional MVP+)
- activity_logs or events if useful

For each table, include:
- purpose
- primary fields
- relationships
- important constraints/indexes

Backend/API requirements:
Design clean FastAPI endpoints such as:
- POST /auth/session or rely on Supabase client auth
- POST /ingestions
- GET /ingestions/{id}
- POST /places/confirm
- GET /places
- POST /trips
- POST /trips/{id}/generate-itinerary
- GET /trips/{id}
- PATCH /trips/{id}
- PATCH /itinerary-items/{id}
- GET /profile
- GET /map/places
Provide example request/response payloads.

AI requirements:
Be realistic and practical.
For place extraction:
- design prompts or structured extraction outputs
- return JSON schema
- include confidence
- include explanation/rationale
- handle ambiguity
For itinerary planning:
- optimize for grouped geography and simple day structure
- do not hallucinate exact opening hours if unavailable
- if required data is missing, say so
- produce JSON output that can be rendered directly in the app

Important safety/product constraints:
- Do not assume all extracted places are correct.
- Do not assume all videos contain enough information.
- Do not over-promise exact geographic accuracy.
- Ask the user to confirm extracted places before saving.
- Do not require full raw video retention if avoidable.
- Prefer storing metadata and derived artifacts over large raw files for MVP.
- Build with clear status and retry handling.

Error handling requirements:
Include explicit UX and backend behavior for:
- invalid TikTok URL
- extractor failure
- no places found
- ambiguous place matches
- geocoding failure
- itinerary generation failure
- duplicate save attempt
- network timeout
- backend job stuck in processing

Testing requirements:
Suggest the minimum useful test strategy for a hackathon:
- a few backend unit tests
- one or two integration tests
- manual test checklist for happy path and fallback path
- mocked AI/extraction responses for demo reliability

Implementation plan:
Give me a realistic build order for 24–48 hackathon hours:
Phase 1: foundation
Phase 2: TikTok ingestion
Phase 3: place confirmation/save flow
Phase 4: trip generation
Phase 5: map + polish
Phase 6: optional social-lite stretch

Output style:
- Be concrete, not generic.
- Make decisions instead of staying vague.
- Use sensible defaults when something is unspecified.
- Point out anything missing from the idea.
- Optimize for “can actually be built and demoed this weekend.”
- When relevant, recommend simplifications that improve demo quality.
- Include example schemas and payloads.
- End with the top 5 risks and how to de-risk them quickly.

