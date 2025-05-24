import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_POSITIONS = {
  chief_councillor: { 
    id: 'chief_councillor',
    title: 'Chief Councillor',
    description: 'Lead the student body and represent student interests',
    maleSeats: 1,
    femaleSeats: 1
  },
  deputy_chief_councillor: { 
    id: 'deputy_chief_councillor',
    title: 'Deputy Chief Councillor',
    description: 'Support the Chief Councillor and oversee student activities',
    maleSeats: 1,
    femaleSeats: 1
  },
  games_health_councillor: { 
    id: 'games_health_councillor',
    title: 'Games and Health Councillor',
    description: 'Oversee sports activities and health initiatives',
    maleSeats: 1,
    femaleSeats: 1
  },
  block_councillor: { 
    id: 'block_councillor',
    title: 'Block Councillor',
    description: 'Manage block-level activities and concerns',
    maleSeats: 1,
    femaleSeats: 1
  },
  cultural_councillor: { 
    id: 'cultural_councillor',
    title: 'Cultural Councillor',
    description: 'Organize cultural events and promote diversity',
    maleSeats: 1,
    femaleSeats: 1
  },
  college_academic_councillor: { 
    id: 'college_academic_councillor',
    title: 'College Academic Councillor',
    description: 'Represent academic interests and concerns',
    maleSeats: 1,
    femaleSeats: 1
  }
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all positions
    const positions = await prisma.position.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });

    if (!positions || positions.length === 0) {
      return NextResponse.json({
        results: [],
        statistics: {
          totalVoters: 0,
          totalVotes: 0,
          participationRate: 0
        }
      });
    }

    // Get all candidates with their votes
    const candidates = await prisma.candidate.findMany({
      include: {
        _count: {
          select: { votes: true }
        }
      }
    });

    // Get total number of voters
    const totalVoters = await prisma.user.count({
      where: { role: 'STUDENT' }
    });

    // Get total number of votes cast
    const totalVotes = await prisma.vote.count();

    // Format results by position
    const results = positions.map(position => {
      const positionCandidates = candidates.filter(
        candidate => candidate.positionId === position.id
      );

      return {
        positionId: position.id,
        positionName: position.name,
        totalSeats: position.totalSeats,
        maleSeats: position.maleSeats,
        femaleSeats: position.femaleSeats,
        candidates: positionCandidates.map(candidate => ({
          id: candidate.id,
          name: candidate.name,
          gender: candidate.gender,
          department: candidate.department,
          yearOfStudy: candidate.yearOfStudy,
          votes: candidate._count.votes
        }))
      };
    });

    return NextResponse.json({
      results,
      statistics: {
        totalVoters,
        totalVotes,
        participationRate: totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0
      }
    });
  } catch (error) {
    console.error('Error fetching voting results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voting results' },
      { status: 500 }
    );
  }
} 