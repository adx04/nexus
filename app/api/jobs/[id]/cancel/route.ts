import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateJobStatus } from '@/lib/jobs';
import { redis } from '@/lib/redis';
import { QUEUE_KEYS } from '@/lib/queue';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // Fetch the job
    const jobResult = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    
    if (jobResult.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = jobResult[0];

    // Status guard
    if (job.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending jobs can be cancelled' }, { status: 400 });
    }

    // Update status to cancelled
    await updateJobStatus(id, 'cancelled');

    // Attempt to remove from Redis queue
    const queueKey = QUEUE_KEYS[job.priority as keyof typeof QUEUE_KEYS];
    if (queueKey) {
      await redis.zrem(queueKey, id);
    }

    return NextResponse.json({ message: 'Job cancelled successfully' }, { status: 200 });
  } catch (error) {
    console.error('Job cancellation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
