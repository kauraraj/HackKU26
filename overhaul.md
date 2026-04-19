You are a senior React Native / Expo product engineer working inside an existing repo.

Your task is to update the mobile app’s bottom tab navigation, information architecture, and key screen flows to match a more social travel-planning product vision.

Very important:
- KEEP the existing theme, color palette, typography feel, spacing rhythm, card styling, and general design language already present in the repo.
- Do NOT redesign the app from scratch.
- Do NOT introduce a clashing visual language.
- Reuse existing components, tokens, spacing, and patterns wherever possible.
- The final result should feel like a natural evolution of the current app, not a new app pasted in.

We are building a travel itinerary/social app where users can turn shared travel videos into itineraries, discover other people’s trips, save places, and manage their own travel history.

The current app already has some trip-generation functionality. We now want to evolve the navigation and screens to support the social product direction.

================================
HIGH-LEVEL PRODUCT CHANGES
================================

Replace/refactor the bottom tab bar so that it has 5 tabs in this exact order:

1. Feed
2. Search
3. Create (large center + button in brand/site color)
4. Trips
5. Profile

These tabs should feel polished, modern, and consistent with the current app theme.

The center Create tab should visually stand out:
- larger than the other tab icons
- use the app’s main accent/site color
- feel like the primary action in the app
- still remain consistent with the current design system

Do not make the tab bar look generic. It should feel intentional and slightly elevated/social-product oriented while matching the repo theme.

================================
TAB 1: FEED
================================

The first tab on the left should be a Social Feed screen.

Purpose:
The feed shows trips, itineraries, and travel recommendations from other users, especially friends or followed users.

Main responsibilities of Feed:
- Display a scrollable feed of trip cards from other users
- Each feed item should feel social and inspiring
- Clicking a trip should open a Trip Detail / Shared Itinerary screen
- That detail page should show:
  - trip title
  - creator/user info
  - itinerary breakdown
  - ratings/recommendations for places
  - saved places associated with the trip
  - ability to save either:
    - individual locations
    - entire itinerary
- Feed items should support social signals such as:
  - creator name/avatar
  - destination
  - number of saves/bookmarks
  - optional trip rating / place rating summary
  - friend/following indicator if available

Top of Feed:
At the very top of the feed page, include a prominent CTA block:
“➕ Turn a Video into a Trip”

This should be one of the first things the user sees when opening the app.
This CTA should:
- visually stand out but still match the app theme
- allow users to paste a video URL immediately
- route into the trip generation flow
- feel fast and exciting

This CTA is critical because it reinforces the app’s main magic moment immediately on app launch.

Feed UX notes:
- Use cards, sections, and strong spacing hierarchy
- Keep feed visually engaging, but not cluttered
- Make it easy to scan destinations and creators
- Preserve current design theme from repo
- Include loading, empty, and error states
- Build for demo-worthiness even if backend data is mocked

Suggested feed sections:
- Top CTA: Turn a Video into a Trip
- Following / Friends trips
- Trending itineraries
- Recommended places from community

Do not overcomplicate the first version. Prioritize a strong, polished MVP feed experience.

================================
TAB 2: SEARCH
================================

The second tab should be Search.

Purpose:
Allow users to search across:
- users
- locations
- itineraries
- optionally their own trips

Main search behavior:
- User types a keyword
- Search results can be filtered so everything is not mixed together
- Filters should include:
  - Users
  - Locations
  - Itineraries
  - optionally My Trips if it fits naturally

Requirements:
- By default, results should be well-organized, not jumbled
- Show filter chips, tabs, segmented control, or similar UI
- Search results should clearly indicate type
- Maintain consistent theme and UX patterns from repo

What Search should allow:
- find other users and open their profiles
- send friend requests / follow requests
- find landmarks, destinations, and saved locations
- find itineraries other people made
- find the user’s own trips if useful

Location search behavior:
If the user clicks on a country/city/location result, it should open a Location Detail page.

Location Detail page should include:
- hero section for the place
- pictures of attractions/places in the area
- each image card should show:
  - place name over or on the image
  - directly under the name:
    - trending counter
    - number of visits from users
- additional supporting metadata can include:
  - category
  - short description
  - save button
  - open related itineraries using this place

This page should feel visually rich and discovery-oriented, but still aligned with the repo’s existing design system.
Do not make it feel like a travel blog template disconnected from the app.

================================
TAB 3: CREATE
================================

The center tab should be a big “+” create tab in the app’s main accent/site color.

Purpose:
This is the fast entry point into the app’s core magic flow:
turning a video URL into a trip/itinerary.

Behavior:
- Tapping the Create tab opens the Video Link Paster / Create Trip screen
- This screen should let the user:
  - paste a video URL
  - submit it
  - see processing/progress states
  - move into itinerary generation flow
- This should feel like the quickest route to the core feature

Important:
This screen can overlap in function with the top CTA in Feed, but the Create tab should act as the dedicated persistent entry point.

The Create screen should:
- feel focused
- be simple and clean
- emphasize speed and excitement
- match current app styling
- not feel like an admin form

Suggested content:
- title/headline
- short supporting explanation
- URL input
- paste button if appropriate
- submit/generate button
- recent or example links if helpful
- loading/progress state
- error state
- success route into generated itinerary

================================
TAB 4: TRIPS
================================

The fourth tab should be Trips.

Purpose:
This is the user’s personal trip workspace.

It should keep track of:
- created trips
- generated itineraries
- upcoming/planned trips
- draft trips if applicable

This should remain similar to the current app if a Trips area already exists, but improve it so it feels clearly distinct from Profile.

Trips tab should focus on:
- your active/personal trip planning workflow
- itinerary generation results
- trip organization

Potential sections:
- Upcoming
- Drafts
- Past trips
- Generated itineraries

Trips tab should also still provide another path to generate or regenerate itineraries from saved content or pasted links if that fits the current architecture.

Key distinction:
- Trips = working space for trip planning and itineraries
- Profile = identity, history, saved items, posted/public content

Make that distinction clear in the UX.

================================
TAB 5: PROFILE
================================

The final tab should be Profile.

Purpose:
This is the user’s personal account hub.

Top of page:
There should be a rounded “profile bubble” or profile summary section at the top showing:
- profile picture
- display name / username
- friend count or access to friends list
- possibly quick stats like:
  - trips
  - saved
  - posted

Under that top profile bubble area, include two main tabs/segments:
- History
- Saved

History:
- shows the user’s past trips / trip history
- lets them revisit, share, or review old trips
- can include posted itineraries or previous generated itineraries

Saved:
- shows saved locations
- shows saved itineraries from other users
- supports future reference / planning inspiration

Interaction requirement:
Clicking on the top profile bubble should open a separate Public Profile page.

Public Profile page should show how the user appears to others.
This page can include:
- profile header
- posted itineraries
- trips
- locations
- pinned items
- public-facing stats
- follow/friend related affordances if appropriate

This page should support posting/public sharing concepts such as:
- posted itineraries
- posted trips
- posted locations
- pinned highlights

Settings:
There should be a settings button in the top-right corner of the Profile tab.
Settings should allow users to adjust:
- privacy of History
- privacy of Saved
- light mode / dark mode

If the app already has theme infrastructure, plug into it rather than rebuilding it.
If privacy controls are not fully implemented in backend yet, scaffold the UI and state cleanly for future backend integration.

================================
DESIGN / UX REQUIREMENTS
================================

Follow these rules carefully:

1. Preserve repo theme
- Keep existing colors, shadows, borders, card radii, spacing, and typography style
- Reuse theme tokens and shared components
- Do not introduce random new colors or inconsistent iconography
- Do not make the app look like a template from another project

2. Social + fun feeling
- The product should feel more social, lively, and travel-inspiring
- But still clean and not noisy
- Avoid clutter or gimmicks
- Use thoughtful hierarchy and whitespace

3. Navigation clarity
- Each tab should have a very clear purpose
- Avoid overlap/confusion between Feed, Trips, and Profile
- Make the tab behavior intuitive

4. Bottom tab bar styling
- Ensure the bar feels premium and custom
- The Create tab should be emphasized
- Feed, Search, Trips, and Profile should remain balanced and readable
- Use appropriate icons that match the current app style

5. States
For each major screen, include:
- loading state
- empty state
- error state
- placeholder/mock states where backend is incomplete

6. Demo-ready
- Even if some data is mocked, screens should feel real and connected
- Prioritize polish in the main flows
- Do not leave raw placeholders unless clearly structured for replacement

================================
INFORMATION ARCHITECTURE / SCREEN LIST
================================

Refactor or create screens/components for at least the following:

Bottom Tabs:
- FeedScreen
- SearchScreen
- CreateTripFromVideoScreen
- TripsScreen
- ProfileScreen

Additional detail screens:
- SharedTripDetailScreen
- LocationDetailScreen
- UserProfilePublicScreen
- SavedItineraryDetailScreen if useful
- SearchResults states/subviews
- SettingsScreen

Potential reusable components:
- FeedTripCard
- ProfileSummaryBubble
- SearchFilterChips
- LocationHeroCard
- PlaceImageCard
- TripItineraryCard
- SaveLocationButton
- SaveItineraryButton
- CTAInputCard for “Turn a Video into a Trip”
- EmptyState
- ErrorState
- StatPill / MetaRow
- SegmentedTab for History / Saved

================================
DATA / MOCKING REQUIREMENTS
================================

If backend wiring is incomplete, create realistic mock data and structure the screens so they are easy to connect later.

Mock data shapes should support:
- users
- friends/follow counts
- trips
- itineraries
- saved places
- ratings
- visit counts
- trending counts
- posted/public/private state

Do not hardcode messy data directly into screens.
Use clean mock data files, hooks, or service layers.

================================
IMPLEMENTATION REQUIREMENTS
================================

Work inside the existing Expo repo and do the following:

1. Audit the current repo structure
- identify current tab/navigation setup
- identify current theme system
- identify reusable components
- identify existing trip/itinerary screens that should be adapted instead of recreated

2. Refactor navigation
- update bottom tabs to the new 5-tab structure
- make center Create tab visually emphasized
- preserve existing routing conventions if they are clean

3. Build/adjust screens
- implement the new Feed, Search, Trips, and Profile experiences
- adapt current trip-generation flow into Create and Feed CTA entry points
- connect screen navigation logically

4. Preserve code quality
- keep components modular
- avoid giant monolithic screens
- extract reusable UI pieces
- use TypeScript types/interfaces consistently
- keep naming clear and scalable

5. Keep future backend integration in mind
- organize screen data through hooks/services/selectors
- keep UI separate from raw fetching logic where possible
- create clear interfaces for:
  - feed items
  - users
  - itineraries
  - locations
  - saved content
  - settings/privacy options

================================
OUTPUT FORMAT
================================

I want you to do the following in order:

1. First, inspect the existing repo structure and summarize:
- current navigation structure
- current theme/styling approach
- reusable components that should be preserved
- screens that should be adapted

2. Then implement the new tab bar and required screens/components.

3. After implementation, provide a concise summary of:
- files created
- files modified
- key architectural decisions
- what is mocked vs wired
- any follow-up tasks still needed

================================
IMPORTANT GUARDRAILS
================================

- Keep the same theme as the repo
- Do not throw away existing good work
- Do not over-engineer backend logic inside UI screens
- Do not build features outside the requested scope
- Do not make Feed, Trips, and Profile feel redundant
- Do not make Search results visually confusing
- Do not make the Create tab look out of place
- Do not use placeholder lorem ipsum styling or ugly temporary UI
- Make it feel like a polished social travel app MVP built on top of the current codebase
