import { apiFetch } from '@/lib/api';
import type { Profile } from '@/types';

export function getProfile(): Promise<Profile> {
  return apiFetch<Profile>('/profile');
}
