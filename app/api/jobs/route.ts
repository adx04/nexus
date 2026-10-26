import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs } from '@/db/schema';
import { and, eq, desc, lt } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const cursor = searchParams.get('cursor'); // UUID for cursor pagination
  const limitParam = parseInt(searchParams.get('limit') || '10', 10);
  
  const conditions = [];
  
  if (status) {
    conditions.push(eq(jobs.status, status));
  }
  
  if (priority) {
    conditions.push(eq(jobs.priority, priority));
  }
  
  try {
    if (cursor) {
      // For proper cursor pagination, we should order by a sequential ID or createdAt.
      // Drizzle + Postgres allows fetching the cursor row and then getting items created before it.
      const cursorRecord = await db.select({ createdAt: jobs.createdAt }).from(jobs).where(eq(jobs.id, cursor)).limit(1);
      if (cursorRecord.length > 0) {
         conditions.push(lt(jobs.createdAt, cursorRecord[0].createdAt));
      }
    }

    const data = await db.select()
      .from(jobs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(jobs.createdAt))
      .limit(limitParam + 1);
      
    let nextCursor = null;
    if (data.length > limitParam) {
      const nextItem = data.pop();
      nextCursor = nextItem?.id;
    }
      
    return NextResponse.json({
      data,
      nextCursor
    });
  } catch (error) {
    console.error('Job list fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
