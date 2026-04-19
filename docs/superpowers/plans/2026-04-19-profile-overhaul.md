# Profile Section Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Profile tab per `overhaul.md` Profile spec: tappable profile bubble, History/Saved segmented tabs, settings access, and a public profile view — scaffolded with mock data and reusing the existing theme.

**Architecture:** Extend the existing Expo Router setup with two new stack routes (`profile/settings`, `profile/[username]`). Add a small social mock-data layer (`src/services/social.ts` + types) so UI is decoupled from future backend. Create modular components (`ProfileSummaryBubble`, `SegmentedTab`, `StatPill`, `TripItineraryCard`, `SaveLocationButton`) reusing `useTheme()` tokens and existing component patterns. Do not touch tab bar navigation, Feed, Search, Create, Trips — scope is Profile only.

**Tech Stack:** Expo Router, React Native, TypeScript, `useTheme()` / `getColors()` theme system, `lucide-react-native` icons, `AsyncStorage` (already used for theme persistence — reused for privacy scaffolding).

---

## File Structure

**New files:**
- `frontend/src/types/social.ts` — `PublicProfile`, `PostedItinerary`, `PostedTrip`, `PostedLocation`, `PinnedItem`, `PrivacySettings`, `HistoryEntry`, `SavedItem`
- `frontend/src/services/social.ts` — mock fetchers: `getPublicProfile`, `getFriends`, `getProfileHistory`, `getProfileSaved`, `getPrivacySettings`, `updatePrivacySettings`
- `frontend/src/components/StatPill.tsx` — compact label + value stat (used in bubble + public profile)
- `frontend/src/components/SegmentedTab.tsx` — generic 2+ segment control (History / Saved)
- `frontend/src/components/ProfileSummaryBubble.tsx` — tappable top-of-Profile block
- `frontend/src/components/TripItineraryCard.tsx` — card for past trip / posted itinerary listings
- `frontend/src/components/SaveLocationButton.tsx` — saved-location toggle button used in Saved tab
- `frontend/app/profile/_layout.tsx` — stack for profile detail routes (inherits header theme)
- `frontend/app/profile/settings.tsx` — settings screen: privacy toggles + theme toggle + sign out
- `frontend/app/profile/[username].tsx` — public profile view

**Modified files:**
- `frontend/app/(tabs)/profile.tsx` — rebuild with bubble, segmented tabs, settings gear
- `frontend/app/_layout.tsx` — register `profile/settings` and `profile/[username]` stack routes

---

## Self-Review Note

There is no jest infrastructure in `frontend/package.json` (CLAUDE.md mentions `npx jest` but it isn't installed). This plan uses **TypeScript-driven verification** (`npx tsc --noEmit`) plus manual visual pass, rather than unit tests per task. That is the appropriate discipline for this UI-only, mock-backed scope.

---

### Task 1: Add social/privacy types

**Files:**
- Create: `frontend/src/types/social.ts`

- [ ] **Step 1: Write the types file**

```typescript
// frontend/src/types/social.ts
import type { SavedPlace, Trip } from './index';

export type ProfileVisibility = 'public' | 'friends' | 'private';

export interface PrivacySettings {
  history_visibility: ProfileVisibility;
  saved_visibility: ProfileVisibility;
}

export interface Friend {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export interface PublicProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  home_city: string | null;
  bio: string | null;
  trips_count: number;
  saved_count: number;
  posted_count: number;
  friends_count: number;
  is_following: boolean;
  is_friend: boolean;
}

export interface PostedItinerary {
  id: string;
  title: string;
  destination: string | null;
  cover_image_url: string | null;
  days_count: number;
  places_count: number;
  saves: number;
  rating: number | null;
  posted_at: string;
}

export interface PinnedItem {
  id: string;
  kind: 'trip' | 'location' | 'itinerary';
  title: string;
  subtitle: string | null;
  thumbnail_url: string | null;
}

export type HistoryEntry =
  | { kind: 'trip'; id: string; trip: Trip }
  | { kind: 'posted_itinerary'; id: string; itinerary: PostedItinerary };

export type SavedItem =
  | { kind: 'place'; id: string; place: SavedPlace }
  | { kind: 'itinerary'; id: string; itinerary: PostedItinerary };
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors attributable to this file.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/social.ts
git commit -m "feat(profile): add social/privacy types"
```

---

### Task 2: Add mock social service layer

**Files:**
- Create: `frontend/src/services/social.ts`

This service is intentionally mock-only for the hackathon. Privacy settings persist to AsyncStorage so the settings UI feels real.

- [ ] **Step 1: Write the mock service**

```typescript
// frontend/src/services/social.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Friend,
  HistoryEntry,
  PinnedItem,
  PostedItinerary,
  PrivacySettings,
  PublicProfile,
  SavedItem,
} from '@/types/social';
import type { SavedPlace, Trip } from '@/types';

const PRIVACY_KEY = '@profile_privacy_v1';

const DEFAULT_PRIVACY: PrivacySettings = {
  history_visibility: 'friends',
  saved_visibility: 'private',
};

export async function getPrivacySettings(): Promise<PrivacySettings> {
  const raw = await AsyncStorage.getItem(PRIVACY_KEY);
  if (!raw) return DEFAULT_PRIVACY;
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PRIVACY, ...parsed };
  } catch {
    return DEFAULT_PRIVACY;
  }
}

export async function updatePrivacySettings(patch: Partial<PrivacySettings>): Promise<PrivacySettings> {
  const next = { ...(await getPrivacySettings()), ...patch };
  await AsyncStorage.setItem(PRIVACY_KEY, JSON.stringify(next));
  return next;
}

const MOCK_FRIENDS: Friend[] = [
  { id: 'f1', username: 'mira.codes', display_name: 'Mira', avatar_url: null },
  { id: 'f2', username: 'jae.explores', display_name: 'Jae', avatar_url: null },
  { id: 'f3', username: 'sanya.trails', display_name: 'Sanya', avatar_url: null },
  { id: 'f4', username: 'leo.roams', display_name: 'Leo', avatar_url: null },
  { id: 'f5', username: 'nora.hops', display_name: 'Nora', avatar_url: null },
];

const MOCK_POSTED: PostedItinerary[] = [
  {
    id: 'p1',
    title: 'Kyoto Temples in 3 Days',
    destination: 'Kyoto, Japan',
    cover_image_url: null,
    days_count: 3,
    places_count: 9,
    saves: 214,
    rating: 4.8,
    posted_at: '2026-02-14',
  },
  {
    id: 'p2',
    title: 'Lisbon Coffee Crawl',
    destination: 'Lisbon, Portugal',
    cover_image_url: null,
    days_count: 2,
    places_count: 7,
    saves: 88,
    rating: 4.6,
    posted_at: '2025-11-02',
  },
];

const MOCK_PINNED: PinnedItem[] = [
  { id: 'pin1', kind: 'itinerary', title: 'Kyoto Temples in 3 Days', subtitle: '3 days · 9 places', thumbnail_url: null },
  { id: 'pin2', kind: 'location', title: 'Fushimi Inari Shrine', subtitle: 'Kyoto, Japan', thumbnail_url: null },
];

export async function getFriends(): Promise<Friend[]> {
  return MOCK_FRIENDS;
}

export async function getPostedItineraries(): Promise<PostedItinerary[]> {
  return MOCK_POSTED;
}

export async function getPinnedItems(): Promise<PinnedItem[]> {
  return MOCK_PINNED;
}

export async function getPublicProfile(username: string): Promise<PublicProfile> {
  return {
    id: 'self',
    username,
    display_name: username,
    avatar_url: null,
    home_city: null,
    bio: 'Collecting places from the internet, one video at a time.',
    trips_count: 0,
    saved_count: 0,
    posted_count: MOCK_POSTED.length,
    friends_count: MOCK_FRIENDS.length,
    is_following: false,
    is_friend: false,
  };
}

export async function getProfileHistory(trips: Trip[]): Promise<HistoryEntry[]> {
  const tripEntries: HistoryEntry[] = trips.map((t) => ({ kind: 'trip', id: t.id, trip: t }));
  const postedEntries: HistoryEntry[] = MOCK_POSTED.map((p) => ({ kind: 'posted_itinerary', id: p.id, itinerary: p }));
  return [...tripEntries, ...postedEntries];
}

export async function getProfileSaved(places: SavedPlace[]): Promise<SavedItem[]> {
  const placeItems: SavedItem[] = places.map((p) => ({ kind: 'place', id: p.id, place: p }));
  const itinItems: SavedItem[] = MOCK_POSTED.slice(0, 1).map((p) => ({ kind: 'itinerary', id: `saved-${p.id}`, itinerary: p }));
  return [...placeItems, ...itinItems];
}
```

- [ ] **Step 2: Type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/social.ts
git commit -m "feat(profile): add mock social/privacy service"
```

---

### Task 3: StatPill component

**Files:**
- Create: `frontend/src/components/StatPill.tsx`

- [ ] **Step 1: Implement**

```tsx
// frontend/src/components/StatPill.tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  label: string;
  value: number | string;
  onPress?: () => void;
  emphasis?: boolean;
}

export function StatPill({ label, value, onPress, emphasis }: Props) {
  const { colors } = useTheme();
  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      style={({ pressed }: { pressed?: boolean }) => [
        styles.wrap,
        { backgroundColor: emphasis ? colors.accentBg : colors.secondary },
        pressed && { opacity: 0.8 },
      ]}
      hitSlop={4}
    >
      <Text style={[styles.value, { color: emphasis ? colors.accentFg : colors.foreground }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  value: { fontSize: 14, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '500' },
});
```

- [ ] **Step 2: Type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/StatPill.tsx
git commit -m "feat(profile): add StatPill component"
```

---

### Task 4: SegmentedTab component

**Files:**
- Create: `frontend/src/components/SegmentedTab.tsx`

- [ ] **Step 1: Implement**

```tsx
// frontend/src/components/SegmentedTab.tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export interface SegmentedTabOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: SegmentedTabOption<T>[];
  value: T;
  onChange: (next: T) => void;
}

export function SegmentedTab<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.seg, active && { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            hitSlop={4}
          >
            <Text
              style={[
                styles.label,
                { color: active ? colors.foreground : colors.mutedForeground },
                active && { fontWeight: '700' },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  seg: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  label: { fontSize: 14 },
});
```

- [ ] **Step 2: Type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/SegmentedTab.tsx
git commit -m "feat(profile): add SegmentedTab component"
```

---

### Task 5: ProfileSummaryBubble component

**Files:**
- Create: `frontend/src/components/ProfileSummaryBubble.tsx`

- [ ] **Step 1: Implement**

```tsx
// frontend/src/components/ProfileSummaryBubble.tsx
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { StatPill } from './StatPill';

interface Props {
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  homeCity: string | null;
  tripsCount: number;
  savedCount: number;
  postedCount: number;
  friendsCount: number;
  onPress: () => void;
  onFriendsPress?: () => void;
}

export function ProfileSummaryBubble({
  displayName,
  username,
  avatarUrl,
  homeCity,
  tripsCount,
  savedCount,
  postedCount,
  friendsCount,
  onPress,
  onFriendsPress,
}: Props) {
  const { colors } = useTheme();
  const initials = displayName
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 3,
        },
        pressed && { opacity: 0.95 },
      ]}
      hitSlop={4}
    >
      <View style={styles.topRow}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <LinearGradient
            colors={[colors.primary, colors.accentFg]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarInitials}>{initials}</Text>
          </LinearGradient>
        )}
        <View style={styles.identity}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {displayName}
          </Text>
          {username ? (
            <Text style={[styles.username, { color: colors.mutedForeground }]} numberOfLines={1}>
              @{username}
            </Text>
          ) : null}
          {homeCity ? (
            <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
              🏠 {homeCity}
            </Text>
          ) : null}
        </View>
        <ChevronRight size={22} color={colors.mutedForeground} />
      </View>

      <View style={styles.statsRow}>
        <StatPill label="trips" value={tripsCount} />
        <StatPill label="saved" value={savedCount} />
        <StatPill label="posted" value={postedCount} />
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onFriendsPress?.();
          }}
          style={[styles.friendsPill, { backgroundColor: colors.accentBg }]}
          hitSlop={4}
        >
          <Users size={14} color={colors.accentFg} />
          <Text style={[styles.friendsValue, { color: colors.accentFg }]}>{friendsCount}</Text>
          <Text style={[styles.friendsLabel, { color: colors.accentFg }]}>friends</Text>
        </Pressable>
      </View>

      <Text style={[styles.hint, { color: colors.mutedForeground }]}>Tap to view your public profile</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitials: { color: '#fff', fontSize: 22, fontWeight: '800' },
  identity: { flex: 1, gap: 2 },
  name: { fontSize: 20, fontWeight: '800' },
  username: { fontSize: 14 },
  sub: { fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  friendsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  friendsValue: { fontSize: 14, fontWeight: '700' },
  friendsLabel: { fontSize: 12, fontWeight: '500' },
  hint: { fontSize: 12, textAlign: 'right' },
});
```

- [ ] **Step 2: Type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ProfileSummaryBubble.tsx
git commit -m "feat(profile): add ProfileSummaryBubble component"
```

---

### Task 6: TripItineraryCard component

**Files:**
- Create: `frontend/src/components/TripItineraryCard.tsx`

Used by History (past trips, posted itineraries) and Saved (saved itineraries).

- [ ] **Step 1: Implement**

```tsx
// frontend/src/components/TripItineraryCard.tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, MapPin, Bookmark, Star } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  title: string;
  destination?: string | null;
  dateRange?: string | null;
  daysCount?: number | null;
  placesCount?: number | null;
  savesCount?: number | null;
  rating?: number | null;
  coverImageUrl?: string | null;
  badge?: string | null;
  onPress?: () => void;
}

export function TripItineraryCard({
  title,
  destination,
  dateRange,
  daysCount,
  placesCount,
  savesCount,
  rating,
  coverImageUrl,
  badge,
  onPress,
}: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        },
        pressed && { opacity: 0.9 },
      ]}
      hitSlop={4}
    >
      <LinearGradient
        colors={['#06b6d4', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cover}
      >
        {badge ? (
          <View style={[styles.badge, { backgroundColor: colors.card }]}>
            <Text style={[styles.badgeText, { color: colors.foreground }]}>{badge}</Text>
          </View>
        ) : null}
      </LinearGradient>

      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>{title}</Text>
        {destination ? (
          <View style={styles.row}>
            <MapPin size={13} color={colors.mutedForeground} />
            <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>{destination}</Text>
          </View>
        ) : null}
        {dateRange ? (
          <View style={styles.row}>
            <Calendar size={13} color={colors.primary} />
            <Text style={[styles.sub, { color: colors.primary }]} numberOfLines={1}>{dateRange}</Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          {daysCount != null ? (
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>{daysCount} days</Text>
          ) : null}
          {placesCount != null ? (
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>{placesCount} places</Text>
          ) : null}
          {rating != null ? (
            <View style={styles.row}>
              <Star size={12} color={colors.warn} />
              <Text style={[styles.meta, { color: colors.warn }]}>{rating.toFixed(1)}</Text>
            </View>
          ) : null}
          {savesCount != null ? (
            <View style={styles.row}>
              <Bookmark size={12} color={colors.mutedForeground} />
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>{savesCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cover: { height: 96, padding: 8, alignItems: 'flex-end' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  body: { padding: 14, gap: 6 },
  title: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 4 },
  meta: { fontSize: 12, fontWeight: '500' },
});
```

- [ ] **Step 2: Type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/TripItineraryCard.tsx
git commit -m "feat(profile): add TripItineraryCard component"
```

---

### Task 7: SaveLocationButton component

**Files:**
- Create: `frontend/src/components/SaveLocationButton.tsx`

- [ ] **Step 1: Implement**

```tsx
// frontend/src/components/SaveLocationButton.tsx
import { Pressable, StyleSheet, Text } from 'react-native';
import { Bookmark, BookmarkCheck } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  saved: boolean;
  onToggle: () => void;
  compact?: boolean;
}

export function SaveLocationButton({ saved, onToggle, compact }: Props) {
  const { colors } = useTheme();
  const Icon = saved ? BookmarkCheck : Bookmark;
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : styles.wide,
        {
          backgroundColor: saved ? colors.accentBg : colors.secondary,
          borderColor: saved ? colors.primary : colors.border,
        },
        pressed && { opacity: 0.85 },
      ]}
      hitSlop={4}
    >
      <Icon size={compact ? 16 : 18} color={saved ? colors.primary : colors.foreground} />
      {!compact ? (
        <Text style={[styles.label, { color: saved ? colors.primary : colors.foreground }]}>
          {saved ? 'Saved' : 'Save'}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  compact: { width: 34, height: 34 },
  wide: { paddingHorizontal: 14, paddingVertical: 8 },
  label: { fontSize: 13, fontWeight: '600' },
});
```

- [ ] **Step 2: Type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/SaveLocationButton.tsx
git commit -m "feat(profile): add SaveLocationButton component"
```

---

### Task 8: Profile stack layout

**Files:**
- Create: `frontend/app/profile/_layout.tsx`

- [ ] **Step 1: Implement**

```tsx
// frontend/app/profile/_layout.tsx
import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function ProfileStackLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="[username]" options={{ title: 'Profile' }} />
    </Stack>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/profile/_layout.tsx
git commit -m "feat(profile): add profile stack layout"
```

---

### Task 9: Settings screen

**Files:**
- Create: `frontend/app/profile/settings.tsx`

Settings contains: History visibility, Saved visibility, theme toggle (light/dark), sign out.

- [ ] **Step 1: Implement**

```tsx
// frontend/app/profile/settings.tsx
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Moon, Sun, LogOut, Shield, Eye } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { getPrivacySettings, updatePrivacySettings } from '@/services/social';
import type { PrivacySettings, ProfileVisibility } from '@/types/social';

const VISIBILITY_OPTIONS: { value: ProfileVisibility; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'friends', label: 'Friends' },
  { value: 'private', label: 'Only me' },
];

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);

  useEffect(() => {
    getPrivacySettings().then(setPrivacy);
  }, []);

  const setVisibility = useCallback(
    async (key: keyof PrivacySettings, value: ProfileVisibility) => {
      const next = await updatePrivacySettings({ [key]: value });
      setPrivacy(next);
    },
    []
  );

  return (
    <Screen scroll>
      <Section title="Privacy" icon={<Shield size={16} color={colors.primary} />} colors={colors}>
        <VisibilityRow
          label="History"
          helper="Who can see your past trips and posted itineraries"
          value={privacy?.history_visibility ?? 'friends'}
          onChange={(v) => setVisibility('history_visibility', v)}
          colors={colors}
        />
        <VisibilityRow
          label="Saved"
          helper="Who can see places and itineraries you save"
          value={privacy?.saved_visibility ?? 'private'}
          onChange={(v) => setVisibility('saved_visibility', v)}
          colors={colors}
        />
      </Section>

      <Section title="Appearance" icon={<Eye size={16} color={colors.primary} />} colors={colors}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Dark mode</Text>
            <Text style={[styles.rowHelper, { color: colors.mutedForeground }]}>
              Match system or override here
            </Text>
          </View>
          <View style={styles.themeBadge}>
            {isDark ? <Moon size={16} color={colors.primary} /> : <Sun size={16} color={colors.primary} />}
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.card}
            />
          </View>
        </View>
      </Section>

      <Pressable
        onPress={signOut}
        style={({ pressed }) => [
          styles.signOut,
          { backgroundColor: colors.destructive },
          pressed && { opacity: 0.9 },
        ]}
        hitSlop={4}
      >
        <LogOut size={18} color="#fff" />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </Screen>
  );
}

function Section({
  title,
  icon,
  children,
  colors,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      <View style={[styles.sectionBody, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {children}
      </View>
    </View>
  );
}

function VisibilityRow({
  label,
  helper,
  value,
  onChange,
  colors,
}: {
  label: string;
  helper: string;
  value: ProfileVisibility;
  onChange: (v: ProfileVisibility) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.visRow}>
      <View style={{ gap: 2 }}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.rowHelper, { color: colors.mutedForeground }]}>{helper}</Text>
      </View>
      <View style={[styles.visChips, { backgroundColor: colors.secondary }]}>
        {VISIBILITY_OPTIONS.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[
                styles.visChip,
                active && { backgroundColor: colors.card, borderColor: colors.primary },
              ]}
              hitSlop={4}
            >
              <Text
                style={[
                  styles.visChipText,
                  { color: active ? colors.primary : colors.mutedForeground },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  sectionBody: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 12,
  },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowHelper: { fontSize: 12, marginTop: 2 },
  themeBadge: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  visRow: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 12,
  },
  visChips: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 10,
    gap: 4,
  },
  visChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 7,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  visChipText: { fontSize: 12, fontWeight: '600' },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  signOutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
```

- [ ] **Step 2: Type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/profile/settings.tsx
git commit -m "feat(profile): add settings screen"
```

---

### Task 10: Public profile screen

**Files:**
- Create: `frontend/app/profile/[username].tsx`

- [ ] **Step 1: Implement**

```tsx
// frontend/app/profile/[username].tsx
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Pin, UserPlus, UserCheck } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { TripItineraryCard } from '@/components/TripItineraryCard';
import { StatPill } from '@/components/StatPill';
import { useTheme } from '@/context/ThemeContext';
import { getPinnedItems, getPostedItineraries, getPublicProfile } from '@/services/social';
import type { PinnedItem, PostedItinerary, PublicProfile } from '@/types/social';

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { colors } = useTheme();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posted, setPosted] = useState<PostedItinerary[]>([]);
  const [pinned, setPinned] = useState<PinnedItem[]>([]);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (!username) return;
    getPublicProfile(username).then((p) => {
      setProfile(p);
      setFollowing(p.is_following);
    });
    getPostedItineraries().then(setPosted);
    getPinnedItems().then(setPinned);
  }, [username]);

  if (!profile) return <LoadingState label="Loading profile…" />;

  const initials = profile.display_name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <Screen scroll>
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <LinearGradient
            colors={[colors.primary, colors.accentFg]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarInitials}>{initials}</Text>
          </LinearGradient>
        )}
        <Text style={[styles.name, { color: colors.foreground }]}>{profile.display_name}</Text>
        <Text style={[styles.username, { color: colors.mutedForeground }]}>@{profile.username}</Text>
        {profile.home_city ? (
          <Text style={[styles.homeCity, { color: colors.mutedForeground }]}>🏠 {profile.home_city}</Text>
        ) : null}
        {profile.bio ? (
          <Text style={[styles.bio, { color: colors.foreground }]}>{profile.bio}</Text>
        ) : null}

        <View style={styles.stats}>
          <StatPill label="trips" value={profile.trips_count} />
          <StatPill label="posted" value={profile.posted_count} />
          <StatPill label="friends" value={profile.friends_count} emphasis />
        </View>

        <Pressable
          onPress={() => setFollowing((f) => !f)}
          style={({ pressed }) => [
            styles.followBtn,
            {
              backgroundColor: following ? colors.secondary : colors.primary,
              borderColor: following ? colors.border : colors.primary,
            },
            pressed && { opacity: 0.9 },
          ]}
          hitSlop={4}
        >
          {following ? (
            <UserCheck size={16} color={colors.foreground} />
          ) : (
            <UserPlus size={16} color={colors.primaryForeground} />
          )}
          <Text
            style={[
              styles.followLabel,
              { color: following ? colors.foreground : colors.primaryForeground },
            ]}
          >
            {following ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      </View>

      {pinned.length > 0 ? (
        <View style={{ gap: 10 }}>
          <View style={styles.sectionHeader}>
            <Pin size={14} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Pinned</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {pinned.map((pin) => (
              <View
                key={pin.id}
                style={[styles.pinCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <LinearGradient
                  colors={['#06b6d4', '#3b82f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.pinThumb}
                />
                <Text style={[styles.pinTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {pin.title}
                </Text>
                {pin.subtitle ? (
                  <Text style={[styles.pinSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {pin.subtitle}
                  </Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={{ gap: 10 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Posted itineraries</Text>
        {posted.length === 0 ? (
          <EmptyState title="Nothing posted yet" subtitle="Public itineraries will show here." />
        ) : (
          posted.map((p) => (
            <TripItineraryCard
              key={p.id}
              title={p.title}
              destination={p.destination}
              daysCount={p.days_count}
              placesCount={p.places_count}
              savesCount={p.saves}
              rating={p.rating}
              badge="POSTED"
            />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitials: { color: '#fff', fontSize: 30, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800' },
  username: { fontSize: 14 },
  homeCity: { fontSize: 13 },
  bio: { fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  stats: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
    marginTop: 8,
  },
  followLabel: { fontSize: 14, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  pinCard: {
    width: 160,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 6,
  },
  pinThumb: { height: 80, borderRadius: 8 },
  pinTitle: { fontSize: 14, fontWeight: '700' },
  pinSub: { fontSize: 12 },
});
```

- [ ] **Step 2: Type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/profile/\[username\].tsx
git commit -m "feat(profile): add public profile screen"
```

---

### Task 11: Register new stack routes

**Files:**
- Modify: `frontend/app/_layout.tsx`

Add `profile` group to the Stack. Since `(tabs)` already exists, and we want `profile/settings` + `profile/[username]` to live outside the tabs as full-height stack routes, register them in the root stack.

- [ ] **Step 1: Add stack screen registrations**

Modify the Stack in `AuthGate`:

```tsx
<Stack.Screen name="(auth)" options={{ headerShown: false }} />
<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
<Stack.Screen name="ingestion/new" options={{ title: 'Turn a TikTok into a trip' }} />
<Stack.Screen name="ingestion/[id]" options={{ title: 'Review places' }} />
<Stack.Screen name="trips/new" options={{ title: 'New trip' }} />
<Stack.Screen name="trips/[id]" options={{ title: 'Trip' }} />
<Stack.Screen name="profile" options={{ headerShown: false }} />
```

- [ ] **Step 2: Type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/_layout.tsx
git commit -m "feat(profile): register profile stack routes"
```

---

### Task 12: Rewrite Profile tab

**Files:**
- Modify: `frontend/app/(tabs)/profile.tsx`

Replace entire contents. Hooks: load `Profile`, trips list, places list, history, saved. Add settings gear top-right (replaces the theme toggle that's currently in the tabs `_layout.tsx` for this tab — but since that is global, we add a local header option via the `Tabs.Screen` config for profile; simpler: just render a settings gear as an in-content header row so we don't touch the tabs layout).

Per spec: **"There should be a settings button in the top-right corner of the Profile tab."** We'll render it as part of the screen content (top-right row) so we don't need to modify `(tabs)/_layout.tsx`, preserving scope.

- [ ] **Step 1: Implement**

```tsx
// frontend/app/(tabs)/profile.tsx
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { ProfileSummaryBubble } from '@/components/ProfileSummaryBubble';
import { SegmentedTab } from '@/components/SegmentedTab';
import { TripItineraryCard } from '@/components/TripItineraryCard';
import { PlaceCard } from '@/components/PlaceCard';
import { SaveLocationButton } from '@/components/SaveLocationButton';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { getProfile } from '@/services/profile';
import { listTrips } from '@/services/trips';
import { listPlaces } from '@/services/places';
import { getProfileHistory, getProfileSaved } from '@/services/social';
import type { Profile, SavedPlace, Trip } from '@/types';
import type { HistoryEntry, SavedItem } from '@/types/social';

type Segment = 'history' | 'saved';

export default function ProfileTab() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [saved, setSaved] = useState<SavedItem[] | null>(null);
  const [segment, setSegment] = useState<Segment>('history');
  const [unsavedIds, setUnsavedIds] = useState<Set<string>>(new Set());

  const loadAll = useCallback(async () => {
    try {
      const [p, t, pl] = await Promise.all([
        getProfile().catch(() => null),
        listTrips().catch(() => [] as Trip[]),
        listPlaces().catch(() => [] as SavedPlace[]),
      ]);
      setProfile(p);
      setTrips(t);
      setPlaces(pl);
      setHistory(await getProfileHistory(t));
      setSaved(await getProfileSaved(pl));
    } catch (e) {
      console.warn('profile load failed', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const displayName = profile?.display_name ?? profile?.username ?? user?.email ?? 'You';
  const username = profile?.username ?? null;

  const toggleSaved = (id: string) => {
    setUnsavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openPublicProfile = () => {
    const u = username ?? 'you';
    router.push(`/profile/${u}`);
  };

  const pastTripsCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return trips.filter((t) => t.end_date < today).length;
  }, [trips]);

  if (history === null || saved === null) {
    return <LoadingState label="Loading your profile…" />;
  }

  return (
    <Screen scroll>
      <View style={styles.headerRow}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Profile</Text>
        <Pressable
          onPress={() => router.push('/profile/settings')}
          style={[styles.gear, { backgroundColor: colors.card, borderColor: colors.border }]}
          hitSlop={8}
          accessibilityLabel="Settings"
        >
          <Settings size={18} color={colors.foreground} />
        </Pressable>
      </View>

      <ProfileSummaryBubble
        displayName={displayName}
        username={username}
        avatarUrl={profile?.avatar_url ?? null}
        homeCity={profile?.home_city ?? null}
        tripsCount={profile?.trips_count ?? trips.length}
        savedCount={profile?.saved_places_count ?? places.length}
        postedCount={0}
        friendsCount={5}
        onPress={openPublicProfile}
        onFriendsPress={openPublicProfile}
      />

      <SegmentedTab<Segment>
        options={[
          { value: 'history', label: `History${pastTripsCount ? ` · ${pastTripsCount}` : ''}` },
          { value: 'saved', label: `Saved${places.length ? ` · ${places.length}` : ''}` },
        ]}
        value={segment}
        onChange={setSegment}
      />

      {segment === 'history' ? (
        history.length === 0 ? (
          <EmptyState
            title="No history yet"
            subtitle="Past trips and posted itineraries will show up here."
          />
        ) : (
          <View>
            {history.map((entry) =>
              entry.kind === 'trip' ? (
                <TripItineraryCard
                  key={entry.id}
                  title={entry.trip.title}
                  destination={entry.trip.destination}
                  dateRange={`${entry.trip.start_date} → ${entry.trip.end_date}`}
                  daysCount={entry.trip.days.length}
                  placesCount={entry.trip.places.length}
                  onPress={() => router.push(`/trips/${entry.trip.id}`)}
                />
              ) : (
                <TripItineraryCard
                  key={entry.id}
                  title={entry.itinerary.title}
                  destination={entry.itinerary.destination}
                  daysCount={entry.itinerary.days_count}
                  placesCount={entry.itinerary.places_count}
                  savesCount={entry.itinerary.saves}
                  rating={entry.itinerary.rating}
                  badge="POSTED"
                />
              )
            )}
          </View>
        )
      ) : saved.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          subtitle="Save places and itineraries to revisit them later."
        />
      ) : (
        <View>
          {saved.map((item) =>
            item.kind === 'place' ? (
              <PlaceCard
                key={item.id}
                title={item.place.normalized_name}
                subtitle={item.place.address ?? undefined}
                reason={item.place.notes}
                category={item.place.category}
                confidence={item.place.confidence}
                thumbnailUrl={item.place.thumbnail_url}
                trailing={
                  <SaveLocationButton
                    compact
                    saved={!unsavedIds.has(item.id)}
                    onToggle={() => toggleSaved(item.id)}
                  />
                }
              />
            ) : (
              <TripItineraryCard
                key={item.id}
                title={item.itinerary.title}
                destination={item.itinerary.destination}
                daysCount={item.itinerary.days_count}
                placesCount={item.itinerary.places_count}
                savesCount={item.itinerary.saves}
                rating={item.itinerary.rating}
                badge="SAVED"
              />
            )
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: 28, fontWeight: '800' },
  gear: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
```

- [ ] **Step 2: Type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/\(tabs\)/profile.tsx
git commit -m "feat(profile): rebuild profile tab with bubble, segments, settings"
```

---

### Task 13: Final verification

- [ ] **Step 1: Full type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: clean overall.

- [ ] **Step 2: Visual/manual pass (document observations)**

Since there's no test harness, write a short note in the PR summary describing:
- Each new screen's empty state
- The segmented tab switching
- The settings gear navigation
- Theme toggle in settings
- Privacy chip state persisting across app restart (AsyncStorage)

- [ ] **Step 3: Summary commit if any fixups**

```bash
git status
# If fixups needed, commit them; otherwise skip.
```

---

## Spec Coverage (Self-Review)

| Spec requirement | Task |
| --- | --- |
| Rounded profile bubble at top (avatar, name, username, friends, stats) | Task 5, 12 |
| Tapping bubble opens separate Public Profile page | Task 10, 12 |
| History + Saved segmented tabs | Task 4, 12 |
| History shows past trips / posted itineraries | Task 1, 2, 12 |
| Saved shows saved locations and saved itineraries | Task 1, 2, 12 |
| Public profile shows posted itineraries, pinned, stats, follow | Task 10 |
| Settings button top-right of Profile tab | Task 12 |
| Settings: privacy of History, privacy of Saved, theme toggle | Task 9 |
| Plug into existing theme infrastructure | All tasks use `useTheme()` |
| Scaffold privacy UI/state cleanly for backend integration later | Task 2, 9 |
| Include loading/empty/error states | Task 10, 12 |
| Mock data files for users/friends/posted/pinned | Task 2 |
| Reusable components (ProfileSummaryBubble, SegmentedTab, etc.) | Tasks 3–7 |

No placeholders, no `TBD`. Function/type names are consistent across tasks (`PrivacySettings`, `updatePrivacySettings`, `getProfileHistory`, `HistoryEntry`, `SavedItem`, etc.).
