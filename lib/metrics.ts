import { db } from './db';
import { metricsSnapshots, jobs } from '../db/schema';
import { getQueueDepths } from './queue';
import { getDlqDepth } from './dlq';
import { gte, and, sql, eq } from 'drizzle-orm';
import { redis } from './redis';

export async function captureMetricsSnapshot() {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  // Get queue depths
  const { critical, normal, low } = await getQueueDepths();
  const dlqDepth = await getDlqDepth();

  // Calculate jobs processed, avg latency, and error rate in the last minute
  // We look at jobs updated in the last minute with status 'completed', 'failed', 'dead_lettered'
  const recentJobsResult = await db.select({
    status: jobs.status,
    latencyMs: jobs.latencyMs,
  }).from(jobs).where(gte(jobs.updatedAt, oneMinuteAgo));

  let completedCount = 0;
  let failedCount = 0;
  let totalLatency = 0;

  for (const job of recentJobsResult) {
    if (job.status === 'completed') {
      completedCount++;
      if (job.latencyMs) totalLatency += job.latencyMs;
    }
    if (job.status === 'failed' || job.status === 'dead_lettered') {
      failedCount++;
    }
  }

  const totalProcessed = completedCount + failedCount;
  const avgLatencyMs = completedCount > 0 ? Math.round(totalLatency / completedCount) : 0;
  const errorRate = totalProcessed > 0 ? failedCount / totalProcessed : 0;

  // Cache hit ratio (simulated tracking, or simple placeholder if not tracking exactly)
  // In a real system, we'd increment Redis counters on hit/miss. Let's assume 0.85 default.
  // Wait, let's implement actual tracking using Redis.
  const hits = parseInt(await redis.get('metrics:cache_hits') || '0', 10);
  const misses = parseInt(await redis.get('metrics:cache_misses') || '0', 10);
  const totalCacheRequests = hits + misses;
  const cacheHitRatio = totalCacheRequests > 0 ? hits / totalCacheRequests : 0;

  // Reset counters for next minute (optional, but good for windowed tracking)
  await redis.set('metrics:cache_hits', 0);
  await redis.set('metrics:cache_misses', 0);

  // Insert snapshot
  await db.insert(metricsSnapshots).values({
    queueDepthCritical: critical,
    queueDepthNormal: normal,
    queueDepthLow: low,
    jobsProcessedLastMinute: totalProcessed, // Processed + Failed
    avgLatencyMs,
    errorRate,
    dlqDepth,
    cacheHitRatio,
  });
}
