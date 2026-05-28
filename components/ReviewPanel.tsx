'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, XCircle, AlertTriangle, Edit3, Save, 
  RefreshCw, Download, UserCheck, Clock 
} from 'lucide-react';
import { Advance, IAFeedback, IAFinding, ThesisPattern, OriginalityReport } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

interface ReviewPanelProps {
  advance: Advance;
  iaFeedback: IAFeedback | null;
  originalityReport?: OriginalityReport | null;
  combinedFinalScore?: number | null;
  humanReviews?: any[]; // History of human reviews (newest first)
  selectedSuspiciousId?: string | null;
  onSelectSuspicious?: (id: string | null) => void;
  isAnalyzing: boolean;
  analysisProgress: number;
  analysisStage: string;
  onSaveReview: (feedback: IAFeedback, comments: string, status: 'aprobado' | 'observado' | 'rechazado', adjustedScore?: number) => void;
  onReanalyze: () => void;
  pattern: ThesisPattern;
  userRole?: 'estudiante' | 'asesor' | 'coordinador' | 'admin';
}

export default function ReviewPanel({ 
  advance, 
  iaFeedback, 
  originalityReport,
  combinedFinalScore,
  humanReviews = [],
  selectedSuspiciousId,
  onSelectSuspicious,
  isAnalyzing, 
  analysisProgress, 
  analysisStage, 
  onSaveReview, 
  onReanalyze,
  pattern,
  userRole = 'asesor'
}: ReviewPanelProps) {
  const canPerformHumanReview = ['asesor', 'coordinador', 'admin'].includes(userRole);

  const [activeTab, setActiveTab] = useState<'ia' | 'humana' | 'originalidad'>('ia');

  // Force students away from 'humana' tab
  useEffect(() => {
    if (!canPerformHumanReview && activeTab === 'humana') {
      setActiveTab('ia');
    }
  }, [canPerformHumanReview, activeTab]);
  const [humanComments, setHumanComments] = useState('');
  const [adjustedScore, setAdjustedScore] = useState(0);
  const [selectedFindings, setSelectedFindings] = useState<string[]>([]);
  const [finalStatus, setFinalStatus] = useState<'aprobado' | 'observado' | 'rechazado'>('observado');

  // Load most recent human review for the form (history is shown separately)
  useEffect(() => {
    const latest = humanReviews && humanReviews.length > 0 ? humanReviews[0] : null;
    if (latest) {
      setHumanComments(latest.comments || '');
      setAdjustedScore(latest.adjustedScore || iaFeedback?.overallScore || 0);
      setFinalStatus((latest.status as any) || 'observado');
    } else {
      setHumanComments('');
      setAdjustedScore(iaFeedback?.overallScore || 0);
      setFinalStatus('observado');
    }
  }, [humanReviews, iaFeedback]);

  const findings = iaFeedback?.findings || [];
  const note = iaFeedback ? iaFeedback.note : 0;

  const toggleFinding = (id: string) => {
    if (selectedFindings.includes(id)) {
      setSelectedFindings(selectedFindings.filter(f => f !== id));
    } else {
      setSelectedFindings([...selectedFindings, id]);
    }
  };

  const handleAgreeWithIA = () => {
    if (!iaFeedback) return;

    // Advisor agrees with the IA analysis (including its penalties for high AI content / similarity)
    // We do NOT send adjustedScore so the backend keeps the current (penalized) finalScore
    const updatedFeedback: IAFeedback = { ...iaFeedback };
    onSaveReview(updatedFeedback, humanComments, finalStatus, undefined);
  };

  const handleSaveWithMyScore = () => {
    if (!iaFeedback) return;

    // Advisor is overriding with their own human score
    const updatedFeedback: IAFeedback = {
      ...iaFeedback,
      overallScore: adjustedScore,
      note: parseFloat(((adjustedScore / 100) * 20).toFixed(1)),
    };

    onSaveReview(updatedFeedback, humanComments, finalStatus, adjustedScore);
  };

  const generatePDFReport = () => {
    if (!iaFeedback) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("REPORTE COMPLETO DE REVISIÓN", 105, 12, { align: 'center' });
    doc.setFontSize(10);
    doc.text("PRONT Revisor • Análisis IA + Similitud + Retroalimentación Humana", 105, 20, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);

    let y = 36;

    // Basic info
    doc.setFont('helvetica', 'bold');
    doc.text("ESTUDIANTE:", 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(advance.studentName, 55, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.text("TÍTULO:", 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(advance.title.substring(0, 70) + (advance.title.length > 70 ? '...' : ''), 55, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.text("FECHA:", 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es }), 45, y);
    y += 10;

    // === FINAL SCORES SECTION ===
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text("PUNTAJE FINAL Y NOTA", 20, y);
    y += 8;

    doc.setFontSize(11);
    const finalNote = iaFeedback.note ?? Math.round(((combinedFinalScore || iaFeedback.overallScore || 0) / 100) * 20);
    doc.text(`Nota Final del Estudiante: ${finalNote} / 20`, 25, y);
    y += 6;
    doc.text(`Puntaje IA (Calidad Académica): ${iaFeedback.overallScore}%`, 25, y);
    y += 6;

    if (originalityReport) {
      doc.text(`Similitud detectada: ${originalityReport.similarityScore}%`, 25, y);
      y += 6;
    }

    // Human review summary if exists
    if (humanReviews.length > 0) {
      const latestReview = humanReviews[0];
      doc.text(`Puntaje Ajustado por Asesor: ${latestReview.adjustedScore || '—'}%`, 25, y);
      y += 6;
      doc.text(`Estado final: ${latestReview.status?.toUpperCase() || '—'}`, 25, y);
      y += 10;
    } else {
      y += 6;
    }

    // === HUMAN REVIEW SECTION (most important for the student) ===
    if (humanReviews.length > 0) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text("RETROALIMENTACIÓN DEL ASESOR / REVISOR", 20, y);
      y += 8;

      humanReviews.slice(0, 2).forEach((rev: any, idx: number) => {
        if (y > 240) return;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${idx === 0 ? 'ÚLTIMA REVISIÓN' : 'REVISIÓN ANTERIOR'} — ${rev.reviewerName || 'Revisor'}`, 20, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        doc.text(`Fecha: ${rev.createdAt ? format(new Date(rev.createdAt), "dd/MM/yyyy HH:mm") : '—'}`, 25, y);
        y += 5;
        doc.text(`Estado: ${rev.status?.toUpperCase() || '—'}   |   Puntaje ajustado: ${rev.adjustedScore ?? '—'}%`, 25, y);
        y += 6;

        if (rev.comments) {
          doc.setFont('helvetica', 'bold');
          doc.text("Comentarios del revisor:", 25, y);
          y += 5;
          doc.setFont('helvetica', 'normal');
          const commentLines = doc.splitTextToSize(rev.comments, 155);
          doc.text(commentLines, 25, y);
          y += commentLines.length * 5 + 6;
        }
        y += 4;
      });
    }

    // === IA FINDINGS ===
    if (findings.length > 0) {
      if (y > 200) { doc.addPage(); y = 30; }

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text("HALLAZGOS DE ANÁLISIS IA (Principales)", 20, y);
      y += 8;

      findings.slice(0, 5).forEach((finding, idx) => {
        if (y > 250) return;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${idx + 1}. [${finding.severity.toUpperCase()}] ${finding.section}`, 20, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(finding.description, 155);
        doc.text(descLines, 25, y);
        y += descLines.length * 4.8 + 3;

        if (finding.instruction) {
          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);
          const inst = doc.splitTextToSize(`→ ${finding.instruction.substring(0, 130)}`, 150);
          doc.text(inst, 25, y);
          doc.setTextColor(0, 0, 0);
          y += inst.length * 4.5 + 4;
        }
      });
    }

    // === ORIGINALITY / SIMILITUD ===
    if (originalityReport) {
      if (y > 210) { doc.addPage(); y = 30; }

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text("ANÁLISIS DE ORIGINALIDAD Y SIMILITUD", 20, y);
      y += 8;

      doc.setFontSize(10);
      doc.text(`Porcentaje de similitud detectado: ${originalityReport.similarityScore}%`, 25, y);
      y += 5;
      doc.text(`Método de detección: ${originalityReport.detectionMethod || 'Avanzado'}`, 25, y);
      y += 8;

      if (originalityReport.sources && originalityReport.sources.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text("Principales fuentes de similitud:", 25, y);
        y += 5;

        originalityReport.sources.slice(0, 4).forEach((src: any) => {
          if (y > 260) return;
          doc.setFont('helvetica', 'normal');
          const title = src.title ? src.title.substring(0, 80) : 'Fuente externa';
          doc.text(`• ${title} (${src.similarity || '?'}% similitud)`, 28, y);
          y += 5;
        });
      }
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Este documento incluye: Análisis IA completo + Detección de similitud + Retroalimentación del asesor", 105, 282, { align: 'center' });
    doc.text("PRONT Revisor • Generado para uso del estudiante en la corrección de su avance de tesis", 105, 288, { align: 'center' });

    const filename = `Reporte_Completo_${advance.studentName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(filename);

    toast.success('Reporte descargado', {
      description: 'PDF completo con IA + Similitud + Revisión Humana listo para que corrijas tu documento.',
    });
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-180px)]">
        <div className="relative w-28 h-28 mb-8">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
            <circle 
              cx="60" cy="60" r="54" 
              fill="none" 
              stroke="hsl(var(--border))" 
              strokeWidth="7"
            />
            <motion.circle 
              cx="60" cy="60" r="54" 
              fill="none" 
              stroke="#3b82f6" 
              strokeWidth="7"
              strokeDasharray={340}
              strokeDashoffset={340 - (340 * analysisProgress / 100)}
              strokeLinecap="round"
              animate={{ strokeDashoffset: 340 - (340 * analysisProgress / 100) }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl font-bold tabular-nums">{analysisProgress}</div>
          </div>
        </div>

        <div className="text-2xl font-semibold mb-3">Analizando documento con IA</div>
        <div className="max-w-md text-center text-muted-foreground mb-8 text-lg">
          {analysisStage}
        </div>

        <div className="flex gap-3 text-xs text-muted-foreground">
          <div className="px-4 py-1 bg-muted rounded-full">Extracción</div>
          <div className="px-4 py-1 bg-muted rounded-full">Embeddings</div>
          <div className="px-4 py-1 bg-muted rounded-full">Razonamiento</div>
          <div className="px-4 py-1 bg-muted rounded-full">Rúbrica</div>
        </div>
      </div>
    );
  }

  if (!iaFeedback) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-180px)] text-center">
        <div className="text-7xl mb-6 opacity-40">🧠</div>
        <div className="text-3xl font-semibold mb-4">No hay análisis disponible</div>
        <p className="text-xl text-muted-foreground max-w-md mb-10">
          Este avance aún no ha sido procesado por la IA. Inicia el análisis para obtener retroalimentación detallada.
        </p>
        <button 
          onClick={onReanalyze}
          className="flex items-center gap-3 px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-lg active:scale-[0.985]"
        >
          <RefreshCw className="w-5 h-5" />
          Iniciar Análisis con IA
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Left: Document Preview (Mock) */}
      <div className="xl:col-span-5">
        <div className="sticky top-24">
          <div className="glass rounded-3xl overflow-hidden shadow-2xl border border-border/50">
            <div className="bg-muted/70 px-6 py-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-3">
                <div className="font-semibold">Vista Previa del Documento</div>
                <div className="text-xs px-2.5 py-0.5 bg-primary/10 text-primary rounded">v{advance.version}</div>
              </div>
              <div className="text-xs text-muted-foreground font-mono">{advance.fileName}</div>
            </div>

            <div className="p-8 bg-[#0a0a0f] text-white font-mono text-sm leading-relaxed h-[620px] overflow-auto relative">
              <div className="absolute top-4 right-4 text-[10px] opacity-40">PÁG 1 / 18</div>
              
              <div className="prose prose-invert max-w-none text-[13px]">
                {advance.content ? (
                  (() => {
                    const content = advance.content;
                    const selectedSection = originalityReport?.highlightedSections.find(s => s.id === selectedSuspiciousId);

                    if (selectedSection && selectedSection.text.length > 10) {
                      // Simple highlight simulation
                      const searchText = selectedSection.text.replace('...', '').trim().substring(0, 80);
                      const parts = content.split(new RegExp(`(${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

                      return parts.map((part, i) => {
                        const isMatch = part.toLowerCase() === searchText.toLowerCase();
                        return (
                          <span 
                            key={i} 
                            className={isMatch ? "bg-yellow-400/30 text-yellow-100 px-1 rounded" : ""}
                          >
                            {part}
                          </span>
                        );
                      });
                    }

                    return content.split('\n').map((line, i) => (
                      <p key={i} className="mb-3">{line}</p>
                    ));
                  })()
                ) : (
                  <>
                    <div className="text-center mb-8 opacity-60">— DOCUMENTO PDF —</div>
                    <p className="mb-4">El contenido completo del documento se muestra aquí en un visor integrado. En producción se utiliza PDF.js para renderizado nativo con anotaciones.</p>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 bg-muted/50 flex justify-between text-xs border-t border-border">
              <div>Última modificación: {format(new Date(advance.uploadDate), "dd/MM/yyyy HH:mm")}</div>
              <a 
                href={`/api/advances/${advance.id}/file`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <Download className="w-3.5 h-3.5" /> Descargar original (real)
              </a>
            </div>
          </div>

          <div className="mt-4 text-[10px] text-center text-muted-foreground">
            Vista previa simulada • En producción: PDF.js + anotaciones en tiempo real
          </div>
        </div>
      </div>

      {/* Right: Review Panel */}
      <div className="xl:col-span-7 space-y-6">
        {/* Header with Scores */}
        <div className="glass rounded-3xl p-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="uppercase tracking-[1.5px] text-xs text-muted-foreground">RESULTADO DEL ANÁLISIS</div>
              <div className="flex items-center gap-3">
                <div className="text-6xl font-bold tabular-nums tracking-tighter mt-1">{iaFeedback.overallScore}<span className="text-4xl align-super text-muted-foreground">%</span></div>
                {combinedFinalScore != null && (
                  <div className={`text-sm px-3 py-1 rounded-full font-medium mt-2 ${
                    (combinedFinalScore ?? 0) >= 85 ? 'bg-emerald-500/10 text-emerald-600' :
                    (combinedFinalScore ?? 0) >= 70 ? 'bg-blue-500/10 text-blue-600' :
                    (combinedFinalScore ?? 0) >= 55 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'
                  }`}>
                    Final: {combinedFinalScore}
                  </div>
                )}
              </div>
              <div className="text-xl text-muted-foreground -mt-1">Cumplimiento General</div>
            </div>

            <div className="text-right">
              <div className="text-sm text-muted-foreground">Nota Final del Estudiante</div>
              <div className="text-7xl font-bold text-primary tabular-nums tracking-[-3px]">{note}</div>
              <div className="text-sm text-muted-foreground -mt-2">/ 20</div>
              <div className="text-xs -mt-2 text-muted-foreground">/ 5.0</div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-4 gap-4">
            {[
              { label: 'Estructura', score: iaFeedback.structureScore, weight: '30%' },
              { label: 'Contenido', score: iaFeedback.contentScore, weight: '40%' },
              { label: 'Forma', score: iaFeedback.formScore, weight: '20%' },
              { label: 'Originalidad', score: iaFeedback.originalityScore, weight: '10%' },
            ].map((dim, idx) => (
              <div key={idx} className="text-center">
                <div className="text-xs text-muted-foreground mb-1">{dim.label}</div>
                <div className="text-4xl font-semibold tabular-nums">{dim.score}</div>
                <div className="text-[10px] text-muted-foreground">{dim.weight}</div>
                <div className="h-1.5 bg-muted rounded mt-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded" 
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* PUNTAJE FINAL COMBINADO - Weighted */}
          {combinedFinalScore !== null && (
            <div className="mt-6 p-6 rounded-3xl bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-violet-600/10 border border-primary/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm uppercase tracking-[2px] text-primary font-medium">PUNTAJE FINAL COMBINADO</div>
                  <div className={`text-[72px] font-bold tabular-nums tracking-[-4px] leading-none mt-1 ${
                    (combinedFinalScore ?? 0) >= 85 ? 'text-emerald-600' :
                    (combinedFinalScore ?? 0) >= 70 ? 'text-blue-600' :
                    (combinedFinalScore ?? 0) >= 55 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {combinedFinalScore}
                    <span className="text-4xl align-super text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className="text-right max-w-[260px] text-sm text-muted-foreground">
                  Promedio ponderado:<br />
                  <span className="font-medium text-foreground">Calidad Académica 60%</span> + 
                  <span className="font-medium text-foreground"> Originalidad 25%</span> + 
                  <span className="font-medium text-foreground"> Autenticidad IA 15%</span>
                </div>
              </div>
            </div>
          )}

          {/* IMPROVED: Originalidad y Autenticidad - Rich Visualization */}
          {originalityReport && (
            <div className="mt-6 glass rounded-3xl p-8 border border-border/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="font-semibold text-xl tracking-tight">Originalidad y Autenticidad</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Detección de plagio + contenido generado por IA
                  </div>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-muted text-xs font-mono uppercase tracking-[2px] text-muted-foreground">
                  {originalityReport.detectionMethod}
                </div>
              </div>

              {/* Score Cards with Color Coding */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Plagiarism Score */}
                <div className="bg-background rounded-2xl p-6 border border-border/60">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-sm text-muted-foreground">Similitud / Plagio</div>
                    <div className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      originalityReport.similarityScore < 15 ? 'bg-emerald-500/10 text-emerald-600' :
                      originalityReport.similarityScore < 35 ? 'bg-amber-500/10 text-amber-600' :
                      'bg-red-500/10 text-red-600'
                    }`}>
                      {originalityReport.similarityScore < 15 ? 'Bajo riesgo' : 
                       originalityReport.similarityScore < 35 ? 'Riesgo moderado' : 'Alto riesgo'}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <div className={`text-6xl font-bold tabular-nums tracking-tighter ${
                      originalityReport.similarityScore < 15 ? 'text-emerald-600' :
                      originalityReport.similarityScore < 35 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {originalityReport.similarityScore}
                    </div>
                    <div className="text-2xl text-muted-foreground">%</div>
                  </div>
                  <div className="h-2 bg-muted rounded-full mt-4 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        originalityReport.similarityScore < 15 ? 'bg-emerald-500' :
                        originalityReport.similarityScore < 35 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${originalityReport.similarityScore}%` }}
                    />
                  </div>
                </div>

                {/* AI Content Score */}
                <div className="bg-background rounded-2xl p-6 border border-border/60">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-sm text-muted-foreground">Contenido Generado por IA</div>
                    <div className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${
                      originalityReport.aiContentScore < 20 ? 'bg-emerald-500/10 text-emerald-600' :
                      originalityReport.aiContentScore < 50 ? 'bg-amber-500/10 text-amber-600' :
                      'bg-red-500/10 text-red-600'
                    }`}>
                      {originalityReport.aiDetectionLabel.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <div className={`text-6xl font-bold tabular-nums tracking-tighter ${
                      originalityReport.aiContentScore < 20 ? 'text-emerald-600' :
                      originalityReport.aiContentScore < 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {originalityReport.aiContentScore}
                    </div>
                    <div className="text-2xl text-muted-foreground">%</div>
                  </div>
                  <div className="h-2 bg-muted rounded-full mt-4 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        originalityReport.aiContentScore < 20 ? 'bg-emerald-500' :
                        originalityReport.aiContentScore < 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${originalityReport.aiContentScore}%` }}
                    />
                  </div>
                </div>

                {/* Sources Count */}
                <div className="bg-background rounded-2xl p-6 border border-border/60 flex flex-col justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Fuentes coincidentes</div>
                    <div className="text-6xl font-bold tabular-nums tracking-tighter">
                      {originalityReport.totalSourcesFound}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-4">
                    {originalityReport.sources.length > 0 
                      ? `${originalityReport.sources.length} fuentes principales detectadas`
                      : 'Sin coincidencias significativas'}
                  </div>
                </div>
              </div>

              {/* Matched Sources - Full List */}
              {originalityReport.sources.length > 0 && (
                <div className="mb-8">
                  <div className="font-semibold mb-3 flex items-center gap-2">
                    Fuentes coincidentes 
                    <span className="text-xs font-normal text-muted-foreground">({originalityReport.sources.length})</span>
                  </div>
                  <div className="space-y-2">
                    {originalityReport.sources.map((source, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between bg-background/60 hover:bg-background border border-border/50 rounded-2xl px-5 py-3.5 transition-colors group"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                            {source.title}
                          </div>
                          {source.url && (
                            <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                              {source.url}
                            </div>
                          )}
                          <div className="text-[10px] text-muted-foreground mt-1">
                            Tipo: <span className="font-mono">{source.sourceType}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-semibold tabular-nums text-orange-600">
                            {source.similarity}
                            <span className="text-sm font-normal">%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suspicious Sections */}
              {originalityReport.highlightedSections.length > 0 && (
                <div>
                  <div className="font-semibold mb-3 flex items-center gap-2">
                    Secciones sospechosas 
                    <span className="text-xs font-normal text-muted-foreground">({originalityReport.highlightedSections.length})</span>
                  </div>
                  <div className="space-y-3 max-h-[280px] overflow-auto pr-2 custom-scroll">
                    {originalityReport.highlightedSections.map((section, index) => (
                      <div 
                        key={index}
                        className="bg-background/60 border border-border/50 rounded-2xl p-4 text-sm"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                            section.type === 'ai_generated' 
                              ? 'bg-red-500/10 text-red-600' 
                              : 'bg-orange-500/10 text-orange-600'
                          }`}>
                            {section.type === 'ai_generated' ? 'IA GENERADO' : 'PLAGIO / PARAFRASIS'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {section.similarityScore}% coincidencia
                          </div>
                        </div>
                        <div className="text-muted-foreground leading-relaxed italic">
                          “{section.text}”
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-3 text-center">
                    Estas secciones fueron identificadas como de alto riesgo de similitud o generación automática.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Student Download CTA - Important after advisor review */}
        {(humanReviews.length > 0 || !canPerformHumanReview) && iaFeedback && (
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold text-emerald-400 flex items-center gap-2 mb-1">
                  <Download className="w-4 h-4" />
                  Reporte listo para corrección
                </div>
                <p className="text-sm text-muted-foreground max-w-md">
                  Descarga el reporte completo con el análisis de IA, detección de similitud y los comentarios de tu asesor. 
                  Úsalo para corregir tu documento antes de la siguiente entrega.
                </p>
              </div>
              <button
                onClick={generatePDFReport}
                className="shrink-0 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-medium flex items-center gap-2 active:scale-[0.985] transition-all shadow-lg shadow-emerald-500/25"
              >
                <Download className="w-4 h-4" />
                Descargar Reporte Completo
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button 
            onClick={() => setActiveTab('ia')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'ia' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <div className="ai-badge text-xs">GROK IA</div> Evaluación Automática
          </button>
          <button 
            onClick={() => setActiveTab('originalidad')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'originalidad' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <div className="text-xs">🛡️</div> Originalidad
          </button>
          {canPerformHumanReview && (
            <button 
              onClick={() => setActiveTab('humana')}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'humana' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              <UserCheck className="w-4 h-4" /> Mi Revisión Humana
            </button>
          )}
        </div>

        {/* IA Tab Content */}
        {activeTab === 'ia' && (
          <div className="space-y-6">
            <div className="glass rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    Resumen Ejecutivo
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      (iaFeedback.analysisProvider || '').includes('grok') 
                        ? 'bg-purple-500/10 text-purple-400' 
                        : (iaFeedback.analysisProvider || '').includes('gemini')
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {iaFeedback.analysisProvider || 'simulador'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">Generado el {format(new Date(iaFeedback.processedAt), "dd/MM/yyyy 'a las' HH:mm")}</div>
                </div>
                <div className="px-4 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> {iaFeedback.estimatedLevel}
                </div>
              </div>

              <p className="text-[15px] leading-relaxed text-muted-foreground">{iaFeedback.summary}</p>
            </div>

            {/* Findings */}
            <div className="glass rounded-3xl p-8">
              <div className="font-semibold mb-5 flex items-center gap-2">
                Hallazgos Detectados 
                <span className="text-xs font-mono bg-muted px-2 py-px rounded">({findings.length})</span>
              </div>

              <div className="space-y-4 max-h-[480px] overflow-auto pr-2 custom-scroll">
                {findings.map((finding, index) => (
                  <motion.div 
                    key={finding.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`border-l-4 p-5 rounded-r-2xl cursor-pointer transition-all ${selectedFindings.includes(finding.id) ? 'bg-primary/5 border-primary' : 'border-border hover:border-primary/60'}`}
                    onClick={() => toggleFinding(finding.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`px-3 py-0.5 text-[10px] font-mono rounded ${finding.severity === 'critico' ? 'bg-red-500/10 text-red-600' : finding.severity === 'mayor' ? 'bg-orange-500/10 text-orange-600' : 'bg-yellow-500/10 text-yellow-600'}`}>
                            {finding.severity.toUpperCase()}
                          </div>
                          <div className="text-xs text-muted-foreground">Pág. aprox. {finding.pageApprox || '—'}</div>
                        </div>
                        
                        <div className="font-semibold text-[15px] mb-1.5">{finding.section}</div>
                        <div className="text-sm text-muted-foreground mb-3">{finding.description}</div>
                        
                        {finding.instruction && (
                          <div className="text-xs bg-muted/70 p-3 rounded-xl mb-2 border-l-2 border-primary/60">
                            <span className="font-medium text-primary">Instrucción:</span> {finding.instruction}
                          </div>
                        )}
                        
                        {finding.example && (
                          <div className="text-xs italic text-muted-foreground border-l-2 border-muted pl-3">
                            Ejemplo: “{finding.example}”
                          </div>
                        )}
                      </div>
                      
                      <div className={`ml-4 mt-1 w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 ${selectedFindings.includes(finding.id) ? 'bg-primary border-primary text-white' : 'border-border'}`}>
                        {selectedFindings.includes(finding.id) && <CheckCircle className="w-4 h-4" />}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Strengths & Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass rounded-3xl p-7">
                <div className="font-semibold mb-4 text-emerald-600 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Fortalezas Identificadas
                </div>
                <ul className="space-y-3 text-sm">
                  {iaFeedback.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass rounded-3xl p-7">
                <div className="font-semibold mb-4 text-amber-600 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Recomendaciones Prioritarias
                </div>
                <ul className="space-y-3 text-sm">
                  {iaFeedback.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Originalidad Tab - Dedicated Rich View */}
        {activeTab === 'originalidad' && (
          <div className="space-y-6">
            {originalityReport ? (
              <>
                {/* Combined Originality Score */}
                <div className="glass rounded-3xl p-8">
                  <div className="text-center mb-6">
                    <div className="text-sm uppercase tracking-[2px] text-muted-foreground">PUNTAJE DE ORIGINALIDAD</div>
                    <div className="text-[92px] font-bold tabular-nums tracking-[-6px] mt-2 leading-none">
                      {combinedFinalScore ?? (100 - originalityReport.similarityScore)}
                    </div>
                    <div className="text-xl text-muted-foreground -mt-2">/ 100</div>
                  </div>
                  <div className="text-center text-sm text-muted-foreground max-w-md mx-auto">
                    Puntaje final combinado (ponderado: <span className="text-foreground font-medium">60% calidad académica</span> + <span className="text-foreground font-medium">25% originalidad</span> + <span className="text-foreground font-medium">15% autenticidad IA</span>).
                  </div>
                </div>

                {/* Full Originality Details (reuse the rich box) */}
                <div>
                  {/* The rich box we already have will be shown here too for consistency */}
                  {originalityReport && (
                    <div className="glass rounded-3xl p-8 border border-border/50">
                      <div className="font-semibold text-xl mb-6">Detalle de Detección</div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                          <div className="text-sm text-muted-foreground mb-2">Similitud / Plagio</div>
                          <div className="flex items-center gap-4">
                            <div className="text-7xl font-bold tabular-nums text-orange-600">{originalityReport.similarityScore}</div>
                            <div className="text-3xl text-muted-foreground">%</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-2">Contenido Generado por IA</div>
                          <div className="flex items-center gap-4">
                            <div className="text-7xl font-bold tabular-nums text-red-600">{originalityReport.aiContentScore}</div>
                            <div className="text-3xl text-muted-foreground">%</div>
                          </div>
                        </div>
                      </div>

                      {/* Sources in this tab */}
                      <div className="mb-8">
                        <div className="font-semibold mb-4">Todas las fuentes coincidentes</div>
                        <div className="space-y-2">
                          {originalityReport.sources.map((src, i) => (
                            <div key={i} className="bg-background/50 p-4 rounded-2xl text-sm flex justify-between">
                              <div>{src.title}</div>
                              <div className="font-mono text-orange-600">{src.similarity}%</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Clickable Suspicious Sections */}
                      <div>
                        <div className="font-semibold mb-4">Secciones sospechosas (haz clic para resaltar en el documento)</div>
                        <div className="space-y-3">
                          {originalityReport.highlightedSections.map((section, i) => (
                            <button
                              key={i}
                              onClick={() => onSelectSuspicious?.(section.id === selectedSuspiciousId ? null : section.id)}
                              className={`w-full text-left p-4 rounded-2xl border transition-all text-sm ${
                                selectedSuspiciousId === section.id 
                                  ? 'bg-yellow-400/10 border-yellow-400/50' 
                                  : 'bg-background/50 border-border hover:border-primary/40'
                              }`}
                            >
                              <div className="flex justify-between mb-1.5">
                                <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                                  section.type === 'ai_generated' ? 'bg-red-500/10 text-red-600' : 'bg-orange-500/10 text-orange-600'
                                }`}>
                                  {section.type}
                                </span>
                                <span className="text-muted-foreground">{section.similarityScore}%</span>
                              </div>
                              <div className="italic text-muted-foreground line-clamp-2">“{section.text}”</div>
                            </button>
                          ))}
                        </div>
                        <div className="text-center mt-3">
                          <button 
                            onClick={() => onSelectSuspicious?.(null)} 
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Limpiar resaltado
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
                No hay reporte de originalidad disponible para este documento.
              </div>
            )}
          </div>
        )}

        {/* Human Review Tab */}
        {activeTab === 'humana' && (
          <div className="glass rounded-3xl p-8 space-y-8">
            {/* History of previous human reviews */}
            {humanReviews && humanReviews.length > 1 && (
              <div>
                <div className="font-semibold mb-4">Historial de Revisiones Humanas</div>
                <div className="space-y-3 max-h-64 overflow-auto pr-2">
                  {humanReviews.slice(1).map((rev, idx) => (
                    <div key={idx} className="bg-background/60 border border-border/50 rounded-2xl p-4 text-sm">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{rev.reviewerName} • {new Date(rev.createdAt).toLocaleDateString()}</span>
                        <span className="font-medium">{rev.status}</span>
                      </div>
                      <div className="italic text-muted-foreground line-clamp-3">“{rev.comments}”</div>
                      {rev.adjustedScore && (
                        <div className="text-xs mt-1 text-muted-foreground">Puntaje ajustado: {rev.adjustedScore}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <div className="font-semibold mb-3">Mi Calificación (si quiero modificar)</div>
              <div className="flex items-center gap-6">
                <input 
                  type="range" 
                  min="40" 
                  max="100" 
                  value={adjustedScore} 
                  onChange={(e) => setAdjustedScore(parseInt(e.target.value))} 
                  className="flex-1 accent-primary" 
                />
                <div className="font-mono text-4xl w-20 text-right tabular-nums">{adjustedScore}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                La nota final ya viene penalizada por alto contenido IA o alta similitud. 
                Solo arrastra si quieres reemplazarla con tu criterio.
              </div>
            </div>

            <div>
              <div className="font-semibold mb-3">Comentarios y Observaciones del Revisor</div>
              <textarea 
                value={humanComments}
                onChange={(e) => setHumanComments(e.target.value)}
                placeholder="Escribe aquí tus observaciones detalladas, sugerencias específicas o puntos que la IA no haya captado..."
                className="w-full h-40 bg-background border border-border rounded-2xl p-5 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="text-right text-xs text-muted-foreground mt-1">Estos comentarios se guardarán para fine-tuning futuro del modelo</div>
            </div>

            <div>
              <div className="font-semibold mb-4">Decisión Final</div>
              <div className="flex gap-4">
                {(['aprobado', 'observado', 'rechazado'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFinalStatus(status)}
                    className={`flex-1 py-4 rounded-2xl border text-sm font-medium transition-all flex items-center justify-center gap-2
                      ${finalStatus === status 
                        ? status === 'aprobado' ? 'bg-emerald-600 border-emerald-600 text-white' : status === 'rechazado' ? 'bg-rose-600 border-rose-600 text-white' : 'bg-blue-600 border-blue-600 text-white'
                        : 'border-border hover:bg-muted'
                      }`}
                  >
                    {status === 'aprobado' && <CheckCircle className="w-4 h-4" />}
                    {status === 'observado' && <AlertTriangle className="w-4 h-4" />}
                    {status === 'rechazado' && <XCircle className="w-4 h-4" />}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button 
                  onClick={handleAgreeWithIA}
                  className="py-4 border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-2xl font-semibold flex items-center justify-center gap-2 active:scale-[0.985] transition-all"
                >
                  <CheckCircle className="w-5 h-5" /> Mantener nota de la IA
                </button>

                <button 
                  onClick={handleSaveWithMyScore}
                  className="py-4 bg-primary text-white rounded-2xl font-semibold flex items-center justify-center gap-2 active:scale-[0.985] transition-all"
                >
                  <Save className="w-5 h-5" /> Guardar con MI calificación
                </button>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={generatePDFReport}
                  className="flex-1 py-3 border border-border rounded-2xl hover:bg-muted flex items-center justify-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" /> Exportar Acta (Cliente)
                </button>

                <button 
                  onClick={() => {
                    if (advance?.id) {
                      window.open(`/api/advances/${advance.id}/report`, '_blank');
                    }
                  }}
                  className="flex-1 py-3 border border-primary text-primary rounded-2xl hover:bg-primary/5 flex items-center justify-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" /> Acta Real (Servidor)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Re-analyze button */}
        <div className="text-center">
          <button 
            onClick={onReanalyze}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reanalizar con IA (Grok / Gemini)
          </button>
        </div>
      </div>
    </div>
  );
}
