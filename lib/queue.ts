import { redis } from './redis';

export type JobPriority = 'critical' | 'normal' | 'low';

export const QUEUE_KEYS = {
  critical: 'queue:critical',
  normal: 'queue:normal',
  low: 'queue:low',
} as const;

// Lua script for atomic dequeue.
// It checks critical, then normal, then low queues.
// It only pops jobs whose score (timestamp) is <= current time.
const DEQUEUE_LUA_SCRIPT = `
  local limit = tonumber(ARGV[1])
  local now = tonumber(ARGV[2])
  local keys = KEYS
  local results = {}
  
  for _, key in ipairs(keys) do
    if #results >= limit then
      break
    end
    
    local remaining = limit - #results
    -- Peek at the jobs
    local jobs = redis.call('ZRANGEBYSCORE', key, '-inf', now, 'LIMIT', 0, remaining)
    
    for _, job in ipairs(jobs) do
      table.insert(results, job)
      redis.call('ZREM', key, job)
    end
  end
  
  return results
`;

export async function enqueueJob(jobId: string, priority: JobPriority, executeAt?: number) {
  const queueKey = QUEUE_KEYS[priority];
  const score = executeAt ?? Date.now();
  
  await redis.zadd(queueKey, {
    score,
    member: jobId
  });
}

export async function dequeueJobs(batchSize: number = 10): Promise<string[]> {
  const now = Date.now();
  
  // Upstash Redis evaluate script
  const jobs = await redis.eval(
    DEQUEUE_LUA_SCRIPT,
    [QUEUE_KEYS.critical, QUEUE_KEYS.normal, QUEUE_KEYS.low],
    [batchSize, now]
  ) as string[];
  
  return jobs || [];
}

export async function getQueueDepths() {
  const [critical, normal, low] = await Promise.all([
    redis.zcard(QUEUE_KEYS.critical),
    redis.zcard(QUEUE_KEYS.normal),
    redis.zcard(QUEUE_KEYS.low)
  ]);
  
  return { critical, normal, low };
}
