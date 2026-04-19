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
