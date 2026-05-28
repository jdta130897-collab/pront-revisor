import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsPDF } from 'jspdf';

// GET /api/advances/[id]/report - Generate official Acta PDF from real persisted data
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
        humanReviews: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!advance) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('ACTA DE REVISIÓN OFICIAL', 105, 12, { align: 'center' });
    doc.setFontSize(10);
    doc.text('PRONT Revisor • Sistema Inteligente de Evaluación de Tesis', 105, 20, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);

    let y = 36;

    // Basic info
    doc.setFont('helvetica', 'bold');
    doc.text('ESTUDIANTE:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(advance.studentName, 55, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('TÍTULO:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(advance.title.substring(0, 70) + (advance.title.length > 70 ? '...' : ''), 55, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('FECHA:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('es-ES'), 50, y);
    y += 10;

    // === FINAL SCORES ===
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('PUNTAJE FINAL Y NOTA DEL ESTUDIANTE', 20, y);
    y += 8;

    doc.setFontSize(11);
    const finalNote = advance.finalScore 
      ? Math.round((advance.finalScore / 100) * 20) 
      : (advance.academicReport ? Math.round((advance.academicReport.overallScore / 100) * 20) : 0);
    doc.text(`Nota Final del Estudiante: ${finalNote} / 20`, 25, y);
    y += 6;

    if (advance.academicReport) {
      doc.text(`Puntaje Calidad Académica (IA): ${advance.academicReport.overallScore}%`, 25, y);
      y += 6;
    }
    if (advance.originalityReport) {
      doc.text(`Similitud detectada: ${advance.originalityReport.similarityScore}%`, 25, y);
      y += 6;
    }

    // Human review summary
    if (advance.humanReviews && advance.humanReviews.length > 0) {
      const latest = advance.humanReviews[0];
      doc.text(`Puntaje Ajustado por Asesor: ${latest.adjustedScore ?? '—'}%`, 25, y);
      y += 6;
      doc.text(`Estado: ${latest.status?.toUpperCase() || '—'}`, 25, y);
      y += 10;
    } else {
      y += 8;
    }

    // === HUMAN REVIEW SECTION (key for students) ===
    if (advance.humanReviews && advance.humanReviews.length > 0) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('RETROALIMENTACIÓN DEL ASESOR / REVISOR', 20, y);
      y += 8;

      advance.humanReviews.slice(0, 2).forEach((rev: any, idx: number) => {
        if (y > 235) return;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${idx === 0 ? 'ÚLTIMA REVISIÓN' : 'REVISIÓN ANTERIOR'} — ${rev.reviewerName || 'Revisor'}`, 20, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.text(`Fecha: ${new Date(rev.createdAt).toLocaleDateString('es-ES')}`, 25, y);
        y += 5;
        doc.text(`Estado: ${rev.status?.toUpperCase() || '—'}   |   Puntaje ajustado: ${rev.adjustedScore ?? '—'}%`, 25, y);
        y += 5;

        if (rev.comments) {
          doc.setFont('helvetica', 'bold');
          doc.text('Comentarios del revisor:', 25, y);
          y += 5;
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(rev.comments, 155);
          doc.text(lines, 25, y);
          y += lines.length * 5 + 6;
        }
        y += 3;
      });
    }

    // === IA FINDINGS ===
    if (advance.academicReport?.findings && Array.isArray(advance.academicReport.findings)) {
      if (y > 200) { doc.addPage(); y = 30; }

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('HALLAZGOS PRINCIPALES DEL ANÁLISIS IA', 20, y);
      y += 8;

      const findings = advance.academicReport.findings.slice(0, 5);
      findings.forEach((finding: any, idx: number) => {
        if (y > 255) return;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${idx + 1}. [${(finding.severity || 'info').toUpperCase()}] ${finding.section || 'General'}`, 20, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        const desc = doc.splitTextToSize(finding.description || '', 155);
        doc.text(desc, 25, y);
        y += desc.length * 4.8 + 3;

        if (finding.instruction) {
          doc.setFontSize(9);
          doc.setTextColor(90, 90, 90);
          const inst = doc.splitTextToSize(`→ ${finding.instruction.substring(0, 120)}`, 150);
          doc.text(inst, 25, y);
          doc.setTextColor(0, 0, 0);
          y += inst.length * 4.5 + 4;
        }
      });
    }

    // === ORIGINALITY / SIMILITUD ===
    if (advance.originalityReport) {
      if (y > 210) { doc.addPage(); y = 30; }

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('ANÁLISIS DE ORIGINALIDAD Y SIMILITUD', 20, y);
      y += 8;

      doc.setFontSize(10);
      doc.text(`Similitud total detectada: ${advance.originalityReport.similarityScore}%`, 25, y);
      y += 5;

      if (advance.originalityReport.sources && advance.originalityReport.sources.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text("Principales fuentes detectadas:", 25, y);
        y += 5;

        advance.originalityReport.sources.slice(0, 5).forEach((src: any) => {
          if (y > 265) return;
          doc.setFont('helvetica', 'normal');
          const title = (src.title || 'Fuente externa').substring(0, 75);
          doc.text(`• ${title} — ${src.similarity || '?'}% similitud`, 28, y);
          y += 5;
        });
      }
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Este reporte incluye: Análisis IA + Detección de similitud + Retroalimentación completa del asesor', 105, 282, { align: 'center' });
    doc.text('PRONT Revisor • Generado para uso del estudiante en corrección de su avance de tesis', 105, 288, { align: 'center' });

    const pdfBuffer = doc.output('arraybuffer');

    const filename = `Reporte_Completo_${advance.studentName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}