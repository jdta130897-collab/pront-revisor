import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/users/[id] - Get single user (used to refresh currentUser data including orcid/avatar)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        orcid: true,
        avatar: true,
        program: true,
        advisorId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Error fetching user' }, { status: 500 });
  }
}

// PATCH /api/users/[id] - Admin can update certain fields (e.g. orcid, avatar, advisorId)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // For now we only allow updating orcid (can be extended)
    const { orcid, advisorId, avatar } = body;

    const updateData: any = {};
    if (orcid !== undefined) {
      updateData.orcid = orcid || null;
    }
    if (advisorId !== undefined) {
      // Allow clearing advisor by sending empty string
      updateData.advisorId = advisorId || null;
      // When admin manually changes the advisor, mark it as manual assignment
      updateData.advisorAssignedManually = true;
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        orcid: true,
        program: true,
        avatar: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Error updating user' },
      { status: 500 }
    );
  }
}
