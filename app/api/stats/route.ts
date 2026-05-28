import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/stats - Rich real aggregated data for Dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const userRole = user.role;
    const userId = user.id;

    const where: any = {};

    if (userRole === 'estudiante') {
      where.studentId = userId;
    } else if (userRole === 'asesor') {
      where.OR = [{ advisorId: userId }, { advisor: user.name }];
    }

    const [total, byStatus, avgScores, recent] = await Promise.all([
      prisma.advance.count({ where }),
      prisma.advance.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      prisma.advance.aggregate({
        where,
        _avg: { iaScore: true, finalScore: true },
      }),
      prisma.advance.findMany({
        where,
        orderBy: { uploadDate: 'desc' },
        take: 5,
        include: { academicReport: true },
      }),
    ]);

    const statusCounts = byStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    // Status data ready for Recharts
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));

    // Monthly activity for the "Actividad por Mes" chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRaw = await prisma.advance.groupBy({
      by: ['uploadDate'],
      where: {
        ...where,
        uploadDate: { gte: sixMonthsAgo },
      },
      _count: { id: true },
    });

    const monthlyMap: Record<string, number> = {};
    monthlyRaw.forEach((item) => {
      const month = new Date(item.uploadDate).toISOString().slice(0, 7);
      monthlyMap[month] = (monthlyMap[month] || 0) + item._count.id;
    });

    const activityByMonth = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, subidos]) => ({ month, subidos }));

    return NextResponse.json({
      total,
      byStatus: statusCounts,
      statusData,                    // Ready for charts
      avgIaScore: Math.round(avgScores._avg.iaScore || 0),
      avgFinalScore: Math.round(avgScores._avg.finalScore || 0),
      recentAdvances: recent,
      activityByMonth,               // For the bar chart
      hasData: total > 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}