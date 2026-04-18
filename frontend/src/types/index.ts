export type IngestionStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type ItemBlock = 'morning' | 'afternoon' | 'evening';

export interface ExtractedPlace {
  id: string;
  original_name: string;
  normalized_name: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  category: string | null;
  reason: string | null;
  confidence: number;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  thumbnail_url: string | null;
  confirmed: boolean;
  rejected: boolean;
}

export interface IngestionJob {
  id: string;
  user_id: string;
  source_url: string;
  status: IngestionStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  extracted_places: ExtractedPlace[];
}

export interface SavedPlace {
  id: string;
  user_id: string;
  source_url: string | null;
  normalized_name: string;
  original_name: string | null;
  category: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  confidence: number | null;
  notes: string | null;
  thumbnail_url: string | null;
  tags: string[];
  created_at: string;
}

export interface ItineraryItem {
  id: string;
  trip_day_id: string;
  saved_place_id: string | null;
  block: ItemBlock;
  position: number;
  title: string;
  notes: string | null;
  rationale: string | null;
  estimated_travel_minutes: number | null;
}

export interface TripDay {
  id: string;
  trip_id: string;
  day_number: number;
  day_date: string;
  summary: string | null;
  items: ItineraryItem[];
}

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  destination: string | null;
  start_date: string;
  end_date: string;
  budget: string | null;
  vibe: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  days: TripDay[];
  places: SavedPlace[];
}

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  home_city: string | null;
  saved_places_count: number;
  trips_count: number;
}

export interface MapPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string | null;
  thumbnail_url: string | null;
}
