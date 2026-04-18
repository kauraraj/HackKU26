import { useEffect, useRef, useState } from 'react';
import { getIngestion } from '@/services/ingestions';
import type { IngestionJob } from '@/types';

/**
 * Poll the ingestion job until it reaches completed or failed.
 * Hackathon-grade: 1.5s interval, 60s timeout.
 */
export function useIngestionPolling(jobId: string | null | undefined) {
  const [job, setJob] = useState<IngestionJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    attemptsRef.current = 0;

    const tick = async () => {
      try {
        const j = await getIngestion(jobId);
        if (cancelled) return;
        setJob(j);
        if (j.status === 'completed' || j.status === 'failed') return;
        attemptsRef.current += 1;
        if (attemptsRef.current > 40) {
          setError('Ingestion is taking longer than expected.');
          return;
        }
        setTimeout(tick, 1500);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  return { job, error };
}
