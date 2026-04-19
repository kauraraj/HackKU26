export interface FeedCreator {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_friend: boolean;
}

export interface FeedItineraryItem {
  id: string;
  block: 'morning' | 'afternoon' | 'evening';
  title: string;
  notes: string | null;
}

export interface FeedItineraryDay {
  day_number: number;
  day_date: string;
  summary: string | null;
  items: FeedItineraryItem[];
}

export interface FeedPlace {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  country: string | null;
  thumbnail_url: string | null;
  rating: number | null;
}

export type FeedSection = 'following' | 'trending' | 'recommended';

export interface FeedItem {
  id: string;
  creator: FeedCreator;
  title: string;
  destination: string;
  cover_image_url: string | null;
  days_count: number;
  places_count: number;
  saves: number;
  rating: number | null;
  posted_at: string;
  section: FeedSection;
  days: FeedItineraryDay[];
  places: FeedPlace[];
}
