import { apiFetch } from '@/lib/api';
import type { IngestionJob } from '@/types';

export function createIngestion(sourceUrl: string): Promise<IngestionJob> {
  return apiFetch<IngestionJob>('/ingestions', {
    method: 'POST',
    body: JSON.stringify({ source_url: sourceUrl }),
  });
}

export function getIngestion(jobId: string): Promise<IngestionJob> {
  return apiFetch<IngestionJob>(`/ingestions/${jobId}`);
}
