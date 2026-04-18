import { apiFetch } from '@/lib/api';
import type { SavedPlace, MapPlace } from '@/types';

export interface PlaceConfirmation {
  extracted_place_id: string;
  normalized_name?: string;
  notes?: string;
  tags?: string[];
}

export function confirmPlaces(confirmations: PlaceConfirmation[], rejectedIds: string[] = []): Promise<SavedPlace[]> {
  return apiFetch<SavedPlace[]>('/places/confirm', {
    method: 'POST',
    body: JSON.stringify({ confirmations, rejected_ids: rejectedIds }),
  });
}

export function listPlaces(): Promise<SavedPlace[]> {
  return apiFetch<SavedPlace[]>('/places');
}

export function mapPlaces(): Promise<MapPlace[]> {
  return apiFetch<MapPlace[]>('/map/places');
}
