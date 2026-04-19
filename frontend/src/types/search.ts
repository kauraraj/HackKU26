export type SearchFilter = 'all' | 'users' | 'locations' | 'itineraries';

export interface SearchUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  home_city: string | null;
  trips_count: number;
  is_friend: boolean;
  is_following: boolean;
}

export interface SearchLocation {
  id: string;
  name: string;
  country: string;
  category: string;
  short_description: string | null;
  thumbnail_url: string | null;
  trending_count: number;
  visit_count: number;
  attractions: LocationAttraction[];
}

export interface LocationAttraction {
  id: string;
  name: string;
  category: string;
  thumbnail_url: string | null;
  trending_count: number;
  visit_count: number;
  short_description: string | null;
}

export interface SearchItinerary {
  id: string;
  title: string;
  destination: string;
  cover_image_url: string | null;
  days_count: number;
  places_count: number;
  saves: number;
  rating: number | null;
  creator_name: string;
  creator_username: string;
  posted_at: string;
}

export interface SearchResults {
  users: SearchUser[];
  locations: SearchLocation[];
  itineraries: SearchItinerary[];
}
