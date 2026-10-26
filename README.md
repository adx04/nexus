# Nexus

A highly scalable, distributed Job Orchestration Engine built on Next.js, Neon (PostgreSQL), and Upstash (Redis). Nexus is designed for serverless environments (specifically Vercel), leveraging Vercel Cron for background processing, Upstash for priority queuing and rate limiting, and Neon for persistent state.

## Features
- **Priority Queues**: Supports `critical`, `normal`, and `low` priority jobs using Redis Sorted Sets and custom Lua scripts for atomic batch dequeuing.
- **Fault Tolerance**: Implements exponential backoff retries and Dead Letter Queue (DLQ) promotion for failed jobs.
- **Real-time Metrics**: Streams live metrics (Queue Depth, Throughput, Latency, Cache Hit Ratio) to a beautiful dark-themed dashboard via Server-Sent Events (SSE).
- **Rate Limiting**: Sliding window rate limiting on enqueue endpoints.
- **Load Simulation**: Built-in endpoints to synthetically generate bulk load.

## Tech Stack
- **Framework**: Next.js (App Router, Serverless Functions)
- **Database**: Neon (Serverless Postgres) + Drizzle ORM
- **Cache/Queue**: Upstash (Redis via REST API)
- **Styling**: Tailwind CSS + Lucide React + Recharts

## Local Development
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and populate your Neon and Upstash credentials.
4. Generate and push DB schema:
   ```bash
   npx drizzle-kit push
   ```
   *Note: Or run the custom migration script if configured.*
5. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment Guide (Vercel)
1. Push your code to GitHub.
2. Import the repository into your Vercel account.
3. In the Vercel project settings, add the required environment variables:
   - `DATABASE_URL`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. The repository includes a `vercel.json` file which automatically configures a Cron Job to ping `/api/worker/process` every minute to process the queue.

## License
MIT
