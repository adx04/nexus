import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './redis';

// Sliding window rate limiter: 20 requests per 10 seconds
export const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '10 s'),
  analytics: true,
  prefix: '@upstash/ratelimit',
});
