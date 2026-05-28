import { Advance, IAFeedback, ThesisPattern } from '@/types';
import { analyzeWithGrok } from '../grok-analyzer';
import { ThesisAnalyzer } from './types';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash'; // Good balance of speed/quality/cost

/**
 * GeminiAnalyzer
 * 
 * Academic quality analyzer powered by Google Gemini models.
 * Designed as a strong alternative / fallback to Grok.
 */
function buildGeminiSystemPrompt(pattern?: ThesisPattern, locale: 'es' | 'en' = 'es'): string {
  const isEnglish = locale === 'en';

  const baseInstructions = isEnglish
    ? `You are a world-class senior thesis reviewer and methodologist for Master's programs in Education, with 20+ years of experience evaluating thesis advances at top universities in Latin America and Spain.

Your task is to perform a rigorous, fair, and constructive academic quality review of a thesis advance.

You must evaluate:
1. Structure & Organization
2. Content & Intellectual Coherence
3. Academic Form & Writing Quality
4. Originality & Scholarly Contribution

Use the provided institutional ThesisPattern (if any) as the reference standard.

Be demanding but fair. Output ONLY valid JSON. No markdown.`
    : `Eres un revisor senior de tesis y metodólogo de talla mundial para programas de Maestría en Educación.

Tu tarea es realizar una revisión rigurosa, justa y constructiva de la CALIDAD ACADÉMICA de un avance de tesis.

Debes evaluar:
1. Estructura y Organización
2. Contenido y Coherencia Intelectual
3. Forma y Calidad de Redacción Académica
4. Originalidad y Aportación Académica

Utiliza el ThesisPattern institucional (si existe) como estándar de referencia.

Sé exigente pero justo. Devuelve SOLO JSON válido. Nada de markdown.`;

  const jsonContract = isEnglish
    ? `
The JSON MUST match this interface:
interface IAFeedback {
  id: string;
  advanceId: string;
  overallScore: number;          // 0-100
  structureScore: number;
  contentScore: number;
  formScore: number;
  originalityScore: number;
  note: number;                  // 0-20 scale with one decimal
  summary: string;
  findings: Array<{
    id: string;
    section: string;
    type: 'faltante' | 'error_estructural' | 'error_contenido' | 'error_forma' | 'sugerencia';
    severity: 'critico' | 'mayor' | 'menor' | 'sugerencia';
    description: string;
    instruction: string;
    example?: string;
  }>;
  strengths: string[];
  recommendations: string[];
  estimatedLevel: 'Inicial' | 'Intermedio' | 'Avanzado' | 'Excelente';
  processedAt: string;
}`
    : `
El JSON DEBE coincidir con esta interfaz:
interface IAFeedback {
  id: string;
  advanceId: string;
  overallScore: number;
  structureScore: number;
  contentScore: number;
  formScore: number;
  originalityScore: number;
  note: number;                  // escala 0-20 con un decimal
  summary: string;
  findings: Array<{...}>;
  strengths: string[];
  recommendations: string[];
  estimatedLevel: 'Inicial' | 'Intermedio' | 'Avanzado' | 'Excelente';
  processedAt: string;
}`;

  return `${baseInstructions}\n\n${jsonContract}\n\nAnalyze the document and return only the JSON object.`;
}

async function callRealGemini(
  content: string,
  advance: Advance,
  pattern: ThesisPattern | null,
  locale: 'es' | 'en'
): Promise<IAFeedback> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const systemPrompt = buildGeminiSystemPrompt(pattern || undefined, locale);
  const userPrompt = [
    `ADVANCE ID: ${advance.id}`,
    `TITLE: ${advance.title}`,
    `PROGRAM: ${advance.program || 'Maestría en Educación'}`,
    pattern ? `INSTITUTIONAL PATTERN: ${JSON.stringify(pattern, null, 2)}` : '',
    '',
    'DOCUMENT CONTENT:',
    '---',
    content.slice(0, 30000),
    '---',
    '',
    'Perform the full academic quality review. Return ONLY valid JSON.'
  ].join('\n');

  const model = DEFAULT_GEMINI_MODEL;
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 50000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4000,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Gemini API error ${response.status}: ${errorText.slice(0, 400)}`);
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContent) {
      throw new Error('Empty response from Gemini');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch (e) {
      const match = rawContent.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw e;
    }

    const now = new Date().toISOString();

    const feedback: IAFeedback = {
      id: parsed.id || `gemini-${Date.now()}`,
      advanceId: parsed.advanceId || advance.id,
      overallScore: Math.max(0, Math.min(100, Math.round(parsed.overallScore || 68))),
      structureScore: Math.max(0, Math.min(100, Math.round(parsed.structureScore || 68))),
      contentScore: Math.max(0, Math.min(100, Math.round(parsed.contentScore || 68))),
      formScore: Math.max(0, Math.min(100, Math.round(parsed.formScore || 68))),
      originalityScore: Math.max(0, Math.min(100, Math.round(parsed.originalityScore || 68))),
      note: parseFloat((parsed.note || 3.4).toFixed(1)),
      summary: parsed.summary || (locale === 'en' ? 'Analysis completed by Gemini.' : 'Análisis completado por Gemini.'),
      findings: Array.isArray(parsed.findings) ? parsed.findings.slice(0, 8) : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 6) : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 6) : [],
      estimatedLevel: ['Inicial', 'Intermedio', 'Avanzado', 'Excelente'].includes(parsed.estimatedLevel)
        ? parsed.estimatedLevel
        : (parsed.overallScore >= 90 ? 'Excelente' : parsed.overallScore >= 78 ? 'Avanzado' : parsed.overallScore >= 62 ? 'Intermedio' : 'Inicial'),
      processedAt: parsed.processedAt || now,
    };

    return feedback;

  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('Gemini API request timed out');
    }
    throw err;
  }
}

export class GeminiAnalyzer implements ThesisAnalyzer<IAFeedback> {
  readonly id = 'academic-quality-gemini';
  readonly name = 'Calidad Académica (Gemini)';
  readonly description = 'Análisis de calidad académica impulsado por Google Gemini. Fallback automático al simulador si no hay clave o falla la API.';

  async analyze(params: {
    advance: Advance;
    content: string;
    pattern: ThesisPattern;
    locale?: 'es' | 'en';
  }): Promise<IAFeedback> {
    const { advance, content, pattern, locale = 'es' } = params;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('NO_API_KEY');
    }

    try {
      const result = await callRealGemini(content || advance.content || '', advance, pattern, locale);
      console.info(`[GeminiAnalyzer] Real Gemini analysis succeeded for advance ${advance.id}`);
      return result;
    } catch (error: any) {
      console.warn(`[GeminiAnalyzer] Gemini call failed: ${error.message}`);
      throw error;
    }
  }

  async simulateProgress(
    onProgress: (progress: number, stage: string) => void,
    locale: 'es' | 'en' = 'es'
  ): Promise<void> {
    const hasKey = !!process.env.GEMINI_API_KEY;

    const stages = hasKey
      ? [
          { progress: 10, stage: locale === 'en' ? "Connecting to Gemini..." : "Conectando con Gemini..." },
          { progress: 30, stage: locale === 'en' ? "Gemini is analyzing the document..." : "Gemini está analizando el documento..." },
          { progress: 55, stage: locale === 'en' ? "Evaluating academic quality..." : "Evaluando calidad académica..." },
          { progress: 78, stage: locale === 'en' ? "Generating findings..." : "Generando hallazgos..." },
          { progress: 100, stage: locale === 'en' ? "Gemini analysis complete." : "Análisis con Gemini completado." },
        ]
      : [
          { progress: 15, stage: locale === 'en' ? "Preparing analysis..." : "Preparando análisis..." },
          { progress: 45, stage: locale === 'en' ? "Analyzing structure and content..." : "Analizando estructura y contenido..." },
          { progress: 75, stage: locale === 'en' ? "Applying rubric..." : "Aplicando rúbrica..." },
          { progress: 100, stage: locale === 'en' ? "Analysis completed." : "Análisis completado." },
        ];

    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, hasKey ? 320 + Math.random() * 180 : 400 + Math.random() * 250));
      onProgress(stage.progress, stage.stage);
    }
  }
}

export const geminiAnalyzer = new GeminiAnalyzer();