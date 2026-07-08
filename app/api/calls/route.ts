import { NextResponse } from 'next/server';
import { getCallHistory } from '@/lib/db';

export async function GET() {
  try {
    const calls = await getCallHistory(100);
    return NextResponse.json(calls);
  } catch (error: any) {
    console.error('Error fetching call history:', error);
    return NextResponse.json(
      { error: `Failed to fetch call history: ${error.message}` },
      { status: 500 }
    );
  }
}