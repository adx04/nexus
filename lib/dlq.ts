import { redis } from './redis';
import { db } from './db';
import { jobs } from '../db/schema';
import { eq } from 'drizzle-orm';
import { updateJobStatus } from './jobs';
import { enqueueJob, JobPriority } from './queue';

export const DLQ_KEY = 'dlq:jobs';

export async function moveToDlq(jobId: string) {
  // Push to a Redis list
  await redis.lpush(DLQ_KEY, jobId);
}

export async function getDlqJobs(page = 1, limit = 10) {
  const start = (page - 1) * limit;
  const end = start + limit - 1;
  const jobIds = await redis.lrange(DLQ_KEY, start, end);
  return jobIds;
}

export async function getDlqDepth() {
  return await redis.llen(DLQ_KEY);
}

export async function redriveDlqJob(jobId: string) {
  // Remove from DLQ
  const removed = await redis.lrem(DLQ_KEY, 0, jobId);
  if (removed > 0) {
    // Fetch from DB to get priority
    const jobResult = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (jobResult.length > 0) {
      const job = jobResult[0];
      // Reset retry count and status
      await updateJobStatus(jobId, 'pending', { retryCount: 0, errorMessage: null });
      // Re-enqueue
      await enqueueJob(jobId, job.priority as JobPriority);
      return true;
    }
  }
  return false;
}
