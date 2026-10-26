import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs } from '@/db/schema';
import { enqueueJob, JobPriority } from '@/lib/queue';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const jobCount = Math.min(body.jobCount || 10, 500); // cap at 500
    const priority = body.priority || 'normal';
    
    const newJobs = [];
    for (let i = 0; i < jobCount; i++) {
      newJobs.push({
        id: crypto.randomUUID(),
        type: ['compute', 'io', 'network'][Math.floor(Math.random() * 3)],
        priority: priority as JobPriority,
        payload: { simulated: true, index: i },
        status: 'pending' as const,
      });
    }

    // Insert to DB and Redis in chunks
    const chunkSize = 100;
    for (let i = 0; i < newJobs.length; i += chunkSize) {
      const chunk = newJobs.slice(i, i + chunkSize);
      await db.insert(jobs).values(chunk);
      
      // Enqueue in Redis
      await Promise.all(
        chunk.map(job => enqueueJob(job.id, job.priority))
      );
    }

    return NextResponse.json({ message: `Simulated ${jobCount} jobs successfully` }, { status: 201 });
  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
