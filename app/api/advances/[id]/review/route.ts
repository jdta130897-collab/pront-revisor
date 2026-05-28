import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/advances/[id]/review - Save human review (real persistence)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { reviewerId, reviewerName, comments, adjustedScore, status } = body;

    if (!reviewerId || !status) {
      return NextResponse.json({ error: 'reviewerId and status are required' }, { status: 400 });
    }

    // Always create new record for history (no upsert on advanceId)
    const review = await prisma.humanReview.create({
      data: {
        advanceId: id,
        reviewerId,
        reviewerName: reviewerName || 'Revisor',
        comments: comments || '',
        adjustedScore: adjustedScore ?? null,
        status,
      },
    });

    // Update the advance with latest status/score
    const currentAdvance = await prisma.advance.findUnique({
      where: { id },
      select: { iaScore: true, finalScore: true },
    });

    let newHumanScore: number | null = null;
    let newFinalScore: number | null = null;

    if (adjustedScore != null) {
      // Advisor is providing their own human score → it completely replaces the IA score
      newHumanScore = adjustedScore;
      newFinalScore = adjustedScore;
    } else {
      // Advisor agrees with the IA analysis → keep the current finalScore
      // (this value already includes the strong penalty for high IA content + high similarity)
      newHumanScore = null;
      newFinalScore = currentAdvance?.finalScore ?? currentAdvance?.iaScore ?? null;
    }

    await prisma.advance.update({
      where: { id },
      data: {
        status,
        humanScore: newHumanScore,
        finalScore: newFinalScore,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error('Save review error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/advances/[id]/review - Get full human review history for an advance
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reviews = await prisma.humanReview.findMany({
      where: { advanceId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reviews);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}