import { NextResponse } from 'next/server';
import { getDlqJobs, getDlqDepth } from '@/lib/dlq';
import { db } from '@/lib/db';
import { jobs } from '@/db/schema';
import { inArray } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  
  try {
    const jobIds = await getDlqJobs(page, limit);
    const total = await getDlqDepth();
    
    if (jobIds.length === 0) {
      return NextResponse.json({ data: [], total, page, limit });
    }
    
    const jobsData = await db.select().from(jobs).where(inArray(jobs.id, jobIds));
    
    // Sort jobsData to match the order in DLQ (newest first)
    const sortedData = jobIds.map(id => jobsData.find(j => j.id === id)).filter(Boolean);
    
    return NextResponse.json({ data: sortedData, total, page, limit });
  } catch (error) {
    console.error('DLQ fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
