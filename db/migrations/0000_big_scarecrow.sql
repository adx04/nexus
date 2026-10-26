CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"priority" varchar(50) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"latency_ms" integer
);
--> statement-breakpoint
CREATE TABLE "metrics_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"queue_depth_critical" integer DEFAULT 0 NOT NULL,
	"queue_depth_normal" integer DEFAULT 0 NOT NULL,
	"queue_depth_low" integer DEFAULT 0 NOT NULL,
	"jobs_processed_last_minute" integer DEFAULT 0 NOT NULL,
	"avg_latency_ms" integer DEFAULT 0 NOT NULL,
	"error_rate" real DEFAULT 0 NOT NULL,
	"dlq_depth" integer DEFAULT 0 NOT NULL,
	"cache_hit_ratio" real DEFAULT 0 NOT NULL
);
