import { NextResponse } from 'next/server';
import { redriveDlqJob } from '@/lib/dlq';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    
    const success = await redriveDlqJob(id);
    
    if (success) {
      return NextResponse.json({ message: 'Job redriven successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Job not found in DLQ' }, { status: 404 });
    }
  } catch (error) {
    console.error('Redrive error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
