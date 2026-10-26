import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getQueueDepths } from '@/lib/queue';

export async function GET() {
  let dbStatus = 'healthy';
  let redisStatus = 'healthy';
  let workerStatus = 'healthy';
  
  try {
    await db.execute(sql`SELECT 1`);
  } catch (e) {
    dbStatus = 'unhealthy';
  }

  try {
    await redis.ping();
  } catch (e) {
    redisStatus = 'unhealthy';
  }

  let queueDepth = { critical: 0, normal: 0, low: 0 };
  try {
    queueDepth = await getQueueDepths();
  } catch (e) {
    // ignore
  }

  try {
    const heartbeat = await redis.get('worker:heartbeat');
    if (!heartbeat) {
      workerStatus = 'unhealthy';
    }
  } catch (e) {
    workerStatus = 'unknown';
  }

  const statuses = [dbStatus, redisStatus, workerStatus];
  let overallStatus = 'healthy';
  if (statuses.includes('unhealthy')) {
    overallStatus = statuses.every(s => s === 'unhealthy') ? 'unhealthy' : 'degraded';
  }

  return NextResponse.json({
    status: overallStatus,
    dependencies: {
      db: dbStatus,
      redis: redisStatus,
      worker: workerStatus,
    },
    metrics: {
      queueDepth
    }
  }, {
    status: overallStatus === 'unhealthy' ? 503 : 200
  });
}
