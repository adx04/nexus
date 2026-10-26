import { pgTable, uuid, varchar, text, jsonb, integer, timestamp, serial, real } from 'drizzle-orm/pg-core';

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull(), // compute | io | network
  priority: varchar('priority', { length: 50 }).notNull(), // critical | normal | low
  payload: jsonb('payload').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending | processing | completed | failed | cancelled | dead_lettered
  retryCount: integer('retry_count').notNull().default(0),
  maxRetries: integer('max_retries').notNull().default(3),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  latencyMs: integer('latency_ms'),
});

export const metricsSnapshots = pgTable('metrics_snapshots', {
  id: serial('id').primaryKey(),
  recordedAt: timestamp('recorded_at').notNull().defaultNow(),
  queueDepthCritical: integer('queue_depth_critical').notNull().default(0),
  queueDepthNormal: integer('queue_depth_normal').notNull().default(0),
  queueDepthLow: integer('queue_depth_low').notNull().default(0),
  jobsProcessedLastMinute: integer('jobs_processed_last_minute').notNull().default(0),
  avgLatencyMs: integer('avg_latency_ms').notNull().default(0),
  errorRate: real('error_rate').notNull().default(0),
  dlqDepth: integer('dlq_depth').notNull().default(0),
  cacheHitRatio: real('cache_hit_ratio').notNull().default(0),
});
