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
