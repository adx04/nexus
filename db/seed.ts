import 'dotenv/config';
import { db } from '../lib/db';
import { jobs } from './schema';
import { enqueueJob } from '../lib/queue';

async function seed() {
  console.log('Seeding demo data...');
  
  const seedJobs = Array.from({ length: 20 }).map((_, i) => ({
    id: crypto.randomUUID(),
    type: ['compute', 'io', 'network'][i % 3],
    priority: ['critical', 'normal', 'low'][i % 3] as 'critical' | 'normal' | 'low',
    payload: { demo: true, seedIndex: i },
    status: 'pending' as const,
  }));

  try {
    await db.insert(jobs).values(seedJobs);
    
    // Enqueue in Redis
    await Promise.all(
      seedJobs.map(job => enqueueJob(job.id, job.priority))
    );
    
    console.log('Successfully seeded 20 jobs.');
  } catch (e) {
    console.error('Seeding failed:', e);
  }
  process.exit(0);
}

seed();
