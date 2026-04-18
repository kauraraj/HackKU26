import { apiFetch } from '@/lib/api';
import type { Trip, ItineraryItem } from '@/types';

export interface TripCreatePayload {
  title: string;
  destination?: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;
  budget?: string;
  vibe?: string;
  place_ids?: string[];
}

export function createTrip(payload: TripCreatePayload): Promise<Trip> {
  return apiFetch<Trip>('/trips', { method: 'POST', body: JSON.stringify(payload) });
}

export function listTrips(): Promise<Trip[]> {
  return apiFetch<Trip[]>('/trips');
}

export function getTrip(id: string): Promise<Trip> {
  return apiFetch<Trip>(`/trips/${id}`);
}

export function generateItinerary(tripId: string, placeIds: string[]): Promise<Trip> {
  return apiFetch<Trip>(`/trips/${tripId}/generate-itinerary`, {
    method: 'POST',
    body: JSON.stringify({ place_ids: placeIds }),
  });
}

export function updateItem(itemId: string, patch: Partial<ItineraryItem>): Promise<ItineraryItem> {
  return apiFetch<ItineraryItem>(`/trips/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
