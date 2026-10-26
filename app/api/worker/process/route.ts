import { NextResponse } from 'next/server';
import { dequeueJobs } from '@/lib/queue';
import { processJob } from '@/lib/worker';
import { redis } from '@/lib/redis';
import { captureMetricsSnapshot } from '@/lib/metrics';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max duration for Vercel Hobby is usually 10s, but setting to 60 for Pro if applicable

export async function POST(request: Request) {
  // Simple auth could be added here for Vercel Cron, usually by checking an authorization header
  try {
    // Record heartbeat with 65s TTL (cron runs every 60s)
    try {
      await redis.setex('worker:heartbeat', 65, Date.now().toString());
    } catch (e) {
      console.warn('Heartbeat update failed, possible Redis timeout:', e);
    }

    const batchSize = 10;
    let jobIds: string[] = [];
    try {
      jobIds = await dequeueJobs(batchSize);
    } catch (e: any) {
      console.warn('Failed to dequeue jobs, possibly Redis timeout:', e);
      return NextResponse.json({ error: 'Redis dequeue failed', details: e.message }, { status: 504 });
    }
    
    if (jobIds.length === 0) {
      return NextResponse.json({ message: 'No jobs in queue' }, { status: 200 });
    }

    // Process all jobs in parallel
    await Promise.allSettled(jobIds.map(id => processJob(id)));
    
    // Capture metrics at the end of the tick
    await captureMetricsSnapshot();
    
    return NextResponse.json({ processed: jobIds.length, jobIds }, { status: 200 });
  } catch (error) {
    console.error('Worker tick error:', error);
    return NextResponse.json({ error: 'Worker execution failed' }, { status: 500 });
  }
}
