import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

async function getStatsWithRetry(retries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      // Use Promise.all to run queries concurrently
      const [totalUsers, totalVotes] = await Promise.all([
        prisma.user.count({
          where: { role: 'STUDENT' }
        }),
        prisma.vote.count()
      ]);

      return { totalUsers, totalVotes };
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${i + 1} failed:`, error);
      
      if (i === retries - 1) break;
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  
  throw lastError;
}

export async function GET(req) {
  try {
    // Check if user is admin
    const session = await requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getStatsWithRetry();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2024') {
      return NextResponse.json(
        { error: 'Database connection timeout. Please try again.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch stats. Please try again.' },
      { status: 500 }
    );
  }
} 