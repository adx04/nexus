import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCachedJob, setCachedJob } from '@/lib/cache';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Cache-Aside Pattern
    const cachedJob = await getCachedJob(id);
    if (cachedJob) {
      return NextResponse.json(cachedJob);
    }

    const jobResult = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    
    if (jobResult.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = jobResult[0];
    
    // Write back to cache
    await setCachedJob(id, job);
    
    return NextResponse.json(job);
  } catch (error) {
    console.error('Fetch job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
