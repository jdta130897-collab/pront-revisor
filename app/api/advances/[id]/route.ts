import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/advances/[id] - Get full real advance with all reports
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const advance = await prisma.advance.findUnique({
      where: { id },
      include: {
        academicReport: true,
        originalityReport: {
          include: {
            sources: true,
            highlightedSections: true,
          },
        },
        humanReviews: true,
      },
    });

    if (!advance) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
    }

    return NextResponse.json(advance);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}