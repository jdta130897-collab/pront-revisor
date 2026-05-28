import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { defaultAnalysisOrchestrator } from '@/lib/analyzers';

// Force Node.js runtime for analysis
export const runtime = 'nodejs';

// POST /api/advances/[id]/reanalyze - Re-run full analysis on an existing advance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const advance = await prisma.advance.findUnique({
      where: { id },
    });

    if (!advance || !advance.content) {
      return NextResponse.json({ error: 'Advance not found or has no content' }, { status: 404 });
    }

    // Re-run analysis with current content
    const results = await defaultAnalysisOrchestrator.runAll({
      advance: advance as any,
      content: advance.content,
      pattern: {
        id: 'default',
        name: 'Default Pattern',
        program: advance.program || 'Maestría en Educación',
        version: '1.0',
        sections: [],
        rubric: { structure: 30, content: 40, form: 20, originality: 10 },
        createdAt: new Date().toISOString(),
      } as any,
      locale: 'es',
    });

    // Update the advance with new scores
    const updatedAdvance = await prisma.advance.update({
      where: { id },
      data: {
        iaScore: results.academic?.overallScore || 0,
        finalScore: results.combinedScore || 0,
        processedAt: new Date(),
        status: 'en_revision',
      },
    });

    // Upsert Academic Report
    if (results.academic) {
      await prisma.academicReport.upsert({
        where: { advanceId: id },
        update: {
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
        create: {
          advanceId: id,
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

    // Upsert Originality Report (simplified for now)
    if (results.originality) {
      await prisma.originalityReport.upsert({
        where: { advanceId: id },
        update: {
          similarityScore: results.originality.similarityScore,
          aiContentScore: results.originality.aiContentScore,
          aiDetectionLabel: results.originality.aiDetectionLabel,
          totalSourcesFound: results.originality.totalSourcesFound,
          detectionMethod: results.originality.detectionMethod,
        },
        create: {
          advanceId: id,
          similarityScore: results.originality.similarityScore,
          aiContentScore: results.originality.aiContentScore,
          aiDetectionLabel: results.originality.aiDetectionLabel,
          totalSourcesFound: results.originality.totalSourcesFound,
          detectionMethod: results.originality.detectionMethod,
        },
      });
    }

    // Return fresh full data
    const freshAdvance = await prisma.advance.findUnique({
      where: { id },
      include: {
        academicReport: true,
        originalityReport: {
          include: { sources: true, highlightedSections: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      advance: freshAdvance,
      combinedScore: results.combinedScore,
    });
  } catch (error: any) {
    console.error('Reanalysis error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}