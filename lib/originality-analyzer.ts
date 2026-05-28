import { Advance, OriginalityReport, MatchedSource, HighlightedSection } from '@/types';

// High-quality simulator for Plagiarism + AI-generated content detection
// This is designed to be easily replaced with real API calls (Copyleaks, Originality.ai, etc.)
// See PRODUCTION-MIGRATION-PLAN.md for integration path

interface OriginalityAnalysisInput {
  advance: Advance;
  content: string;
  locale?: 'es' | 'en';
}

export function analyzeOriginality(input: OriginalityAnalysisInput): OriginalityReport {
  const { advance, content, locale = 'es' } = input;
  const text = (content || advance.content || '').trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // === Realistic simulation logic ===
  // Base scores influenced by document characteristics
  let baseSimilarity = Math.min(45, Math.max(5, Math.floor(wordCount / 80) + (Math.random() * 12 - 6)));
  let baseAiScore = Math.min(65, Math.max(3, Math.floor(wordCount / 120) + (Math.random() * 18 - 9)));

  // Simulate some documents looking more "suspicious"
  if (text.length < 1500) {
    baseSimilarity += 12;
    baseAiScore += 15;
  }

  // Clamp values
  const similarityScore = Math.min(92, Math.max(4, Math.round(baseSimilarity)));
  const aiContentScore = Math.min(88, Math.max(2, Math.round(baseAiScore)));

  // AI Detection label
  let aiDetectionLabel: 'human' | 'mixed' | 'ai_generated' = 'human';
  if (aiContentScore > 72) aiDetectionLabel = 'ai_generated';
  else if (aiContentScore > 38) aiDetectionLabel = 'mixed';

  // === Generate plausible matched sources ===
  const sources: MatchedSource[] = [];
  const numSources = Math.max(1, Math.floor(similarityScore / 18) + (Math.random() > 0.6 ? 1 : 0));

  const fakeSources = [
    { title: "Impacto de la Inteligencia Artificial en la Educación Superior", url: "https://doi.org/10.1234/edtech.2024.0123", type: 'academic' as const },
    { title: "Estrategias de Gamificación para el Aprendizaje Digital", url: "https://www.researchgate.net/publication/37891234", type: 'academic' as const },
    { title: "Resiliencia Docente Post-Pandemia: Un Estudio Multinacional", url: "https://www.sciencedirect.com/science/article/pii/S0883035523000456", type: 'academic' as const },
    { title: "Personalización del Aprendizaje con Sistemas Adaptativos", url: "https://www.tandfonline.com/doi/full/10.1080/01587919.2023.2214567", type: 'academic' as const },
    { title: "Tesis: Inteligencia Artificial y Personalización del Aprendizaje - Universidad Nacional", url: "", type: 'student_paper' as const },
  ];

  for (let i = 0; i < numSources && i < fakeSources.length; i++) {
    const src = fakeSources[i];
    sources.push({
      id: `src-${i}`,
      title: src.title,
      url: src.url || undefined,
      similarity: Math.round(similarityScore / (i + 1.2) + (Math.random() * 8 - 4)),
      sourceType: src.type,
    });
  }

  // === Generate highlighted suspicious sections ===
  const highlightedSections: HighlightedSection[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 25);

  const numHighlights = Math.min(6, Math.max(2, Math.floor(similarityScore / 14)));

  for (let i = 0; i < numHighlights && i < sentences.length; i++) {
    const sentence = sentences[Math.floor(Math.random() * sentences.length)].trim();
    if (sentence.length < 30) continue;

    highlightedSections.push({
      id: `hl-${i}`,
      text: sentence.substring(0, 180) + (sentence.length > 180 ? '...' : ''),
      startIndex: Math.floor(Math.random() * (text.length - 200)),
      endIndex: 0,
      similarityScore: Math.round(similarityScore - (i * 4) + (Math.random() * 10 - 5)),
      sourceId: sources[i % Math.max(1, sources.length)]?.id,
      type: aiContentScore > 55 && Math.random() > 0.5 ? 'ai_generated' : 'plagiarism',
    });
  }

  // Fix endIndex
  highlightedSections.forEach(h => {
    h.endIndex = h.startIndex + h.text.length;
  });

  return {
    id: `orig-${Date.now()}`,
    advanceId: advance.id,
    similarityScore: Math.round(similarityScore),
    aiContentScore: Math.round(aiContentScore),
    aiDetectionLabel,
    sources,
    highlightedSections,
    totalSourcesFound: sources.length,
    processedAt: new Date().toISOString(),
    detectionMethod: 'simulated', // Will become 'copyleaks' etc. in production
  };
}

// Simulated processing for progress UI (can be merged later with academic stages)
export async function simulateOriginalityProcessing(
  onProgress: (progress: number, stage: string) => void,
  locale: 'es' | 'en' = 'es'
): Promise<void> {
  const isEnglish = locale === 'en';
  const stages = [
    { progress: 18, stage: isEnglish ? "Uploading document to originality detection service..." : "Subiendo documento al servicio de detección de originalidad..." },
    { progress: 35, stage: isEnglish ? "Scanning against academic databases and web sources..." : "Escaneando contra bases de datos académicas y fuentes web..." },
    { progress: 52, stage: isEnglish ? "Running AI content probability models..." : "Ejecutando modelos de probabilidad de contenido IA..." },
    { progress: 71, stage: isEnglish ? "Identifying paraphrased and modified passages..." : "Identificando pasajes parafraseados y modificados..." },
    { progress: 87, stage: isEnglish ? "Generating similarity report and highlights..." : "Generando reporte de similitud y resaltados..." },
    { progress: 100, stage: isEnglish ? "Originality analysis completed." : "Análisis de originalidad completado." },
  ];

  for (const stage of stages) {
    await new Promise(resolve => setTimeout(resolve, 520 + Math.random() * 310));
    onProgress(stage.progress, stage.stage);
  }
}