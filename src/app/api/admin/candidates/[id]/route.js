import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/config/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

// DELETE /api/admin/candidates/[id]
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    // Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id }
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Delete candidate and their votes
    await prisma.$transaction([
      // First delete all votes for this candidate
      prisma.vote.deleteMany({
        where: { candidateId: id }
      }),
      // Then delete the candidate
      prisma.candidate.delete({
        where: { id }
      })
    ]);

    // Log the action (non-fatal)
    try {
      await logAudit({
        action: 'CANDIDATE_DELETE',
        entityType: 'CANDIDATE',
        entityId: id,
        userId: session.user.id
      });
    } catch (logError) {
      console.error('Audit log failed:', logError);
      // Do not throw, just log the error
      }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete candidate:', error, error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal server error', details: error.stack },
      { status: 500 }
    );
  }
} 