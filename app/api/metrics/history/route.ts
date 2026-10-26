import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { metricsSnapshots } from '@/db/schema';
import { gte, asc } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const windowParam = searchParams.get('window') || '1h'; // default 1h
  
  let hours = 1;
  if (windowParam.endsWith('h')) {
    hours = parseInt(windowParam.replace('h', ''), 10) || 1;
  }
  
  const fromDate = new Date(Date.now() - hours * 60 * 60 * 1000);

  try {
    const history = await db.select()
      .from(metricsSnapshots)
      .where(gte(metricsSnapshots.recordedAt, fromDate))
      .orderBy(asc(metricsSnapshots.recordedAt));
      
    return NextResponse.json(history);
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
