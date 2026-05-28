import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/users?role=asesor
// Used by registration form to let students choose their advisor.
// Also supports ?role=estudiante&advisorId=xxx for loading an advisor's students.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const advisorId = searchParams.get('advisorId');

    const where: any = {};

    if (role) {
      where.role = role;
    }

    // When asking for students of a specific advisor
    if (advisorId && role === 'estudiante') {
      where.advisorId = advisorId;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        orcid: true,
        program: true,
        advisorId: true,                    // Always return for admin and relationship views
        // advisorAssignedManually temporarily removed until Prisma client is fully regenerated
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error fetching users from /api/users:', error);
    // In development, return the real error to help debugging
    const message = process.env.NODE_ENV === 'development' 
      ? (error.message || 'Unknown Prisma error') 
      : 'Error fetching users';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
