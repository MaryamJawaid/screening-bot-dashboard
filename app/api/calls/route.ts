import { NextRequest, NextResponse } from 'next/server';
import { getCallHistory } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || undefined;
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Get paginated data
    const result = await getCallHistory(limit, offset, search);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(result.totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      calls: result.calls,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: result.totalCount,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });
  } catch (error: any) {
    console.error('Error fetching call history:', error);
    return NextResponse.json(
      { error: `Failed to fetch call history: ${error.message}` },
      { status: 500 }
    );
  }
}