import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { defaultAnalysisOrchestrator } from '@/lib/analyzers';
import { auth } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import path from 'path';

// Force Node.js runtime (pdf-parse, mammoth and heavy analysis require it)
export const runtime = 'nodejs';

// POST /api/advances - Create new advance + run full real analysis
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const studentId = formData.get('studentId') as string || 'demo-student';

    if (!file || !title) {
      return NextResponse.json({ error: 'File and title are required' }, { status: 400 });
    }

    // 1. Extract text using existing logic
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // === FILE STORAGE ===
    // Development: saves to ./uploads (local)
    // Production on Railway: saves to the path defined by UPLOADS_DIR env var (use a Railway Volume)
    const { uploadFile } = await import('@/lib/storage');
    const { filePath, fileUrl } = await uploadFile(file, buffer, file.name);

    let content = '';
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.pdf')) {
      const pdfModule = await import('pdf-parse');
      const pdfParse = (pdfModule as any).default || pdfModule;
      const pdfData = await pdfParse(buffer);
      content = pdfData.text || '';
    } else if (fileName.endsWith('.docx')) {
      const mammothModule = await import('mammoth');
      const mammoth = (mammothModule as any).default || mammothModule;
      const result = await mammoth.extractRawText({ buffer });
      content = result.value || '';
    } else {
      content = buffer.toString('utf-8');
    }

    const wordCount = content.split(/\s+/).filter(Boolean).length;

    // 2. Look up the student to get proper name and advisor link
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { name: true, advisorId: true },
    });

    // 3. Create Advance in real database with file reference
    const advance = await prisma.advance.create({
      data: {
        title,
        fileName: file.name,
        fileType: fileName.endsWith('.pdf') ? 'pdf' : fileName.endsWith('.docx') ? 'docx' : 'txt',
        filePath: filePath || null,   // Local path (dev only)
        fileUrl: fileUrl || null,     // Cloud URL (production)
        status: 'analisis_ia',
        studentId,
        studentName: student?.name || 'Estudiante',
        advisorId: student?.advisorId || null,
        program: 'Maestría en Educación',
        content,
      },
    });

    // 3. Run real analysis orchestration (both academic + originality)
    const results = await defaultAnalysisOrchestrator.runAll({
      advance: {
        id: advance.id,
        title: advance.title,
        studentId: advance.studentId,
        studentName: advance.studentName,
        advisor: advance.advisor || '',
        program: advance.program || '',
      } as any,
      content,
      pattern: {
        id: 'default',
        name: 'Default Pattern',
        program: 'Maestría en Educación',
        version: '1.0',
        sections: [],
        rubric: { structure: 30, content: 40, form: 20, originality: 10 },
        createdAt: new Date().toISOString(),
      } as any,
      locale: 'es',
    });

    // 4. Persist results to real database
    if (results.academic) {
      await prisma.academicReport.create({
        data: {
          advanceId: advance.id,
          overallScore: results.academic.overallScore,
          structureScore: results.academic.structureScore,
          contentScore: results.academic.contentScore,
          formScore: results.academic.formScore,
          originalityScore: results.academic.originalityScore,
          note: results.academic.note,
          summary: results.academic.summary,
          estimatedLevel: results.academic.estimatedLevel,
          findings: results.academic.findings as any,
          strengths: results.academic.strengths as any,
          recommendations: results.academic.recommendations as any,
          analysisProvider: (results as any).academicProvider || 'unknown',
        },
      });
    }

    if (results.originality) {
      const origReport = await prisma.originalityReport.create({
        data: {
          advanceId: advance.id,
          similarityScore: results.originality.similarityScore,
          aiContentScore: results.originality.aiContentScore,
          aiDetectionLabel: results.originality.aiDetectionLabel,
          totalSourcesFound: results.originality.totalSourcesFound,
          detectionMethod: results.originality.detectionMethod,
        },
      });

      // Save sources
      if (results.originality.sources?.length) {
        await prisma.matchedSource.createMany({
          data: results.originality.sources.map((s: any) => ({
            originalityReportId: origReport.id,
            title: s.title,
            url: s.url,
            similarity: s.similarity,
            sourceType: s.sourceType,
          })),
        });
      }

      // Save highlighted sections
      if (results.originality.highlightedSections?.length) {
        await prisma.highlightedSection.createMany({
          data: results.originality.highlightedSections.map((h: any) => ({
            originalityReportId: origReport.id,
            text: h.text,
            startIndex: h.startIndex,
            endIndex: h.endIndex,
            similarityScore: h.similarityScore,
            type: h.type,
          })),
        });
      }
    }

    // 5. Update advance status with final score
    const updatedAdvance = await prisma.advance.update({
      where: { id: advance.id },
      data: {
        status: 'en_revision',
        iaScore: results.academic?.overallScore || 0,
        finalScore: results.combinedScore || 0,
        processedAt: new Date(),
      },
      include: {
        academicReport: true,
        originalityReport: {
          include: {
            sources: true,
            highlightedSections: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      advance: updatedAdvance,
      combinedScore: results.combinedScore,
    });

  } catch (error: any) {
    console.error('Real analysis error:', error);
    return NextResponse.json(
      { error: 'Error processing document', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/advances - List advances from real DB
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const userId = user.id;
    const userRole = user.role;

    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const advisorId = searchParams.get('advisorId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const skip = (page - 1) * limit;

    const where: any = {};

    // === Professional role-based access control (hierarchical) ===
    if (userRole === 'estudiante') {
      where.studentId = userId;
    } else if (userRole === 'asesor') {
      // Asesor only sees advances where they are the assigned advisor
      where.advisorId = userId;
    }
    // coordinador and admin see everything (no additional filter)

    if (status) where.status = status;

    if (advisorId && ['coordinador', 'admin'].includes(userRole)) {
      where.advisorId = advisorId;
    }

    if (search) {
      where.OR = (where.OR || []).concat([
        { title: { contains: search, mode: 'insensitive' } },
        { studentName: { contains: search, mode: 'insensitive' } },
      ]);
    }

    const [advances, total] = await Promise.all([
      prisma.advance.findMany({
        where,
        orderBy: { uploadDate: 'desc' },
        skip,
        take: limit,
        include: {
          academicReport: true,
          originalityReport: true,
          humanReviews: true,
        },
      }),
      prisma.advance.count({ where }),
    ]);

    return NextResponse.json({
      data: advances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('GET /api/advances error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}