import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { jobs } from '@/db/schema';
import { enqueueJob, JobPriority } from '@/lib/queue';
import { rateLimit } from '@/lib/ratelimit';

const enqueueSchema = z.object({
  type: z.enum(['compute', 'io', 'network']),
  priority: z.enum(['critical', 'normal', 'low']).default('normal'),
  payload: z.record(z.any()).default({}),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success, limit, reset, remaining } = await rateLimit.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    const body = await request.json();
    const result = enqueueSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payload', details: result.error.format() }, { status: 400 });
    }

    const { type, priority, payload } = result.data;
    
    // Generate UUID implicitly through defaultRandom() in Drizzle, but we need it for Redis
    // So we generate it manually here
    const jobId = crypto.randomUUID();

    // 1. Store metadata in Neon DB
    await db.insert(jobs).values({
      id: jobId,
      type,
      priority,
      payload,
      status: 'pending',
    });

    // 2. Push to Redis queue
    await enqueueJob(jobId, priority as JobPriority);

    return NextResponse.json({ id: jobId, message: 'Job enqueued successfully' }, { status: 201 });
  } catch (error) {
    console.error('Enqueue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
