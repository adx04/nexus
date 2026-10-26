import { db } from '@/lib/db';
import { metricsSnapshots } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      // Send updates every 2 seconds
      // Vercel serverless function will eventually time out,
      // the frontend is responsible for reconnecting.
      
      let isConnected = true;
      
      const interval = setInterval(async () => {
        if (!isConnected) return;
        
        try {
          const latest = await db.select().from(metricsSnapshots)
            .orderBy(desc(metricsSnapshots.recordedAt))
            .limit(1);
          
          const heartbeat = await redis.get('worker:heartbeat');
          const isWorkerAlive = !!heartbeat;

          const data = {
            snapshot: latest.length > 0 ? latest[0] : null,
            isWorkerAlive,
          };

          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (error) {
          console.error('SSE Error:', error);
          clearInterval(interval);
          controller.close();
        }
      }, 2000);

      // Clean up when the client disconnects
      requestAnimationFrame(() => {}); // Dummy to keep event loop aware, but Next.js handle cleanup below
      // Actually standard Next.js way to handle cleanup:
      controller.error = () => {
        isConnected = false;
        clearInterval(interval);
      };
    },
    cancel() {
      // Called when client disconnects
      // The interval cleanup inside the start function is tricky without sharing state
      // We rely on the stream writing erroring out to stop the interval
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
