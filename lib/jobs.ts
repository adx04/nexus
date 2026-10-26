import { db } from './db';
import { jobs } from '../db/schema';
import { eq } from 'drizzle-orm';
import { invalidateCachedJob } from './cache';

type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'dead_lettered';

export async function updateJobStatus(
  id: string, 
  status: JobStatus, 
  additionalUpdates: Partial<typeof jobs.$inferInsert> = {}
) {
  // We omit id from the update payload
  const { id: _id, ...safeUpdates } = additionalUpdates as any;

  await db.update(jobs)
    .set({ 
      status, 
      updatedAt: new Date(), 
      ...safeUpdates 
    })
    .where(eq(jobs.id, id));
    
  // Invalidate cache immediately on transition
  await invalidateCachedJob(id);
}
