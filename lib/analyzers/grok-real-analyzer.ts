import { Advance, IAFeedback, ThesisPattern } from '@/types';
import { analyzeWithGrok, simulateGrokProcessing } from '../grok-analyzer';
import { ThesisAnalyzer } from './types';

/**
 * GrokRealAnalyzer
 * 
 * Production-grade academic quality analyzer powered by real xAI Grok models.
 * 
 * - Uses the official xAI API (OpenAI-compatible) when XAI_API_KEY is present.
 * - Falls back gracefully and transparently to the high-quality rule-based
 *   simulator (lib/grok-analyzer.ts) if:
 *     • No API key is configured
 *     • The API call fails (network, auth, rate limit, timeout, parse error)
 * - Never breaks the user experience. The simulator is a first-class citizen.
 * 
 * This fulfills the core evolution recommendation from the pront-revisor skill:
 * "Reemplazar el simulador por llamadas reales a Grok (manteniendo el simulador como fallback)".
 */

const XAI_API_BASE = 'https://api.x.ai/v1';
const DEFAULT_MODEL = 'grok-4'; // Upgrade path: grok-4, grok-3-latest, etc. as available in 2026

/**
 * Builds the expert system prompt for Grok.
 * The prompt encodes the deep academic review expertise currently in the simulator,
 * but lets the LLM reason at a much higher level (nuance, context, field-specific insight).
 */
function buildGrokSystemPrompt(pattern?: ThesisPattern, locale: 'es' | 'en' = 'es'): string {
  const isEnglish = locale === 'en';

  const baseInstructions = isEnglish
    ? `You are a world-class senior thesis reviewer and methodologist for Master's programs in Education, with 20+ years of experience evaluating thesis advances at top universities in Latin America and Spain.

Your task is to perform a rigorous, fair, and constructive academic quality review of a thesis advance (capítulo or sección de avance de tesis de maestría).

You must evaluate:
1. Structure & Organization (presence and logical flow of required sections)
2. Content & Intellectual Coherence (research problem clarity, alignment between objectives, methodology and results, depth of analysis)
3. Academic Form & Writing Quality (citation quality and quantity, academic language, precision vs. vague language)
4. Originality & Scholarly Contribution (critical thinking, limitations discussion, future research lines, genuine intellectual contribution)

Use the provided institutional ThesisPattern (if any) as the reference standard for section requirements, minimum lengths, and expectations.

Be demanding but fair. A good master's advance is not a finished thesis — it must show clear progress, methodological soundness, and academic writing at graduate level.

Output ONLY valid JSON. No markdown, no explanations outside the JSON.`
    : `Eres un revisor senior de tesis y metodólogo de talla mundial para programas de Maestría en Educación, con más de 20 años evaluando avances de tesis en las mejores universidades de América Latina y España.

Tu tarea es realizar una revisión rigurosa, justa y constructiva de la CALIDAD ACADÉMICA de un avance de tesis de maestría (capítulo o sección entregada).

Debes evaluar:
1. Estructura y Organización (presencia y flujo lógico de las secciones obligatorias)
2. Contenido y Coherencia Intelectual (claridad del problema de investigación, alineación entre objetivos, metodología y resultados, profundidad del análisis)
3. Forma y Calidad de Redacción Académica (calidad y cantidad de citas, lenguaje académico, precisión vs. lenguaje vago)
4. Originalidad y Aportación Académica (pensamiento crítico, discusión de limitaciones, líneas futuras de investigación, contribución intelectual genuina)

Utiliza el ThesisPattern institucional proporcionado (si existe) como estándar de referencia para secciones requeridas, extensiones mínimas y expectativas de calidad.

Sé exigente pero justo. Un buen avance de maestría no es una tesis terminada: debe demostrar avance claro, solidez metodológica y redacción académica de nivel de posgrado.

Devuelve SOLO JSON válido. Nada de markdown ni explicaciones fuera del JSON.`;

  const jsonContract = isEnglish
    ? `
The JSON MUST exactly match this TypeScript interface (all fields required except where marked optional):

interface IAFeedback {
  id: string;                    // e.g. "grok-ia-174xxxx"
  advanceId: string;             // pass through the input advance.id
  overallScore: number;          // 0-100 integer
  structureScore: number;        // 0-100
  contentScore: number;          // 0-100
  formScore: number;             // 0-100
  originalityScore: number;      // 0-100
  note: number;                  // final grade 0.0-5.0 or 0-20 scale (use 0-5.0 with one decimal)
  summary: string;               // 2-4 sentence executive summary in Spanish (or English if locale=en)
  findings: Array<{
    id: string;
    section: string;
    type: 'faltante' | 'error_estructural' | 'error_contenido' | 'error_forma' | 'sugerencia';
    severity: 'critico' | 'mayor' | 'menor' | 'sugerencia';
    description: string;
    instruction: string;
    example?: string;
    pageApprox?: number;
  }>;                            // 3 to 8 most important findings. Be specific and actionable.
  strengths: string[];           // 2-5 genuine strengths observed in the document
  recommendations: string[];     // 3-6 prioritized, actionable recommendations
  estimatedLevel: 'Inicial' | 'Intermedio' | 'Avanzado' | 'Excelente';
  processedAt: string;           // ISO timestamp
}

Rules for scoring:
- overallScore is a weighted combination you decide (structure ~25-30%, content ~35-40%, form ~15-20%, originality ~10-15%)
- A solid master's advance typically lands between 72-88 overall.
- Be honest: documents with missing critical sections or very weak methodology should score below 65.
- Use the full 0-100 range when justified.
`
    : `
El JSON DEBE coincidir exactamente con esta interfaz TypeScript (todos los campos son obligatorios salvo los marcados opcionales):

interface IAFeedback {
  id: string;                    // ej: "grok-ia-174xxxx"
  advanceId: string;             // pasar el advance.id de entrada
  overallScore: number;          // entero 0-100
  structureScore: number;        // 0-100
  contentScore: number;          // 0-100
  formScore: number;             // 0-100
  originalityScore: number;      // 0-100
  note: number;                  // nota final 0.0-5.0 (una decimal)
  summary: string;               // resumen ejecutivo de 2-4 oraciones en español (o inglés si locale=en)
  findings: Array<{
    id: string;
    section: string;
    type: 'faltante' | 'error_estructural' | 'error_contenido' | 'error_forma' | 'sugerencia';
    severity: 'critico' | 'mayor' | 'menor' | 'sugerencia';
    description: string;
    instruction: string;
    example?: string;
    pageApprox?: number;
  }>;                            // entre 3 y 8 hallazgos más importantes. Específicos y accionables.
  strengths: string[];           // 2-5 fortalezas genuinas observadas
  recommendations: string[];     // 3-6 recomendaciones priorizadas y accionables
  estimatedLevel: 'Inicial' | 'Intermedio' | 'Avanzado' | 'Excelente';
  processedAt: string;           // timestamp ISO
}

Reglas de puntuación:
- overallScore es una combinación ponderada que tú decides (estructura ~25-30%, contenido ~35-40%, forma ~15-20%, originalidad ~10-15%)
- Un avance sólido de maestría suele estar entre 72-88 de overall.
- Sé honesto: documentos con secciones críticas faltantes o metodología muy débil deben puntuar por debajo de 65.
- Usa todo el rango 0-100 cuando esté justificado.
`;

  return `${baseInstructions}\n\n${jsonContract}\n\nWhen the user provides the document content and optional pattern, analyze it thoroughly and return only the JSON object.`;
}

/**
 * Calls the real xAI Grok API with structured output expectations.
 */
async function callRealGrok(
  content: string,
  advance: Advance,
  pattern: ThesisPattern | null,
  locale: 'es' | 'en'
): Promise<IAFeedback> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY not configured');
  }

  const systemPrompt = buildGrokSystemPrompt(pattern || undefined, locale);
  const userPrompt = [
    `ADVANCE ID: ${advance.id}`,
    `TITLE: ${advance.title}`,
    `PROGRAM: ${advance.program || 'Maestría en Educación'}`,
    pattern ? `INSTITUTIONAL PATTERN: ${JSON.stringify(pattern, null, 2)}` : '',
    '',
    'DOCUMENT CONTENT (extracted from PDF/DOCX):',
    '---',
    content.slice(0, 32000), // Safety cap for very long documents; Grok handles large context well
    '---',
    '',
    'Perform the full academic quality review now. Return ONLY the JSON object.'
  ].join('\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000); // 45s hard timeout

  try {
    const response = await fetch(`${XAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent, professional reviews
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`xAI API error ${response.status}: ${errorText.slice(0, 300)}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error('Empty response from Grok');
    }

    // Parse and validate the JSON shape
    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch (e) {
      // Sometimes the model still wraps in ```json ... ```
      const match = rawContent.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw e;
    }

    // Minimal normalization + safety defaults
    const now = new Date().toISOString();
    const feedback: IAFeedback = {
      id: parsed.id || `grok-real-${Date.now()}`,
      advanceId: parsed.advanceId || advance.id,
      overallScore: Math.max(0, Math.min(100, Math.round(parsed.overallScore || 70))),
      structureScore: Math.max(0, Math.min(100, Math.round(parsed.structureScore || 70))),
      contentScore: Math.max(0, Math.min(100, Math.round(parsed.contentScore || 70))),
      formScore: Math.max(0, Math.min(100, Math.round(parsed.formScore || 70))),
      originalityScore: Math.max(0, Math.min(100, Math.round(parsed.originalityScore || 70))),
      note: parseFloat((parsed.note || 3.5).toFixed(1)),
      summary: parsed.summary || (locale === 'en' ? 'Analysis completed by Grok.' : 'Análisis completado por Grok.'),
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
      throw new Error('Grok API request timed out after 45 seconds');
    }
    throw err;
  }
}

/**
 * GrokRealAnalyzer — implements the pluggable ThesisAnalyzer contract.
 */
export class GrokRealAnalyzer implements ThesisAnalyzer<IAFeedback> {
  readonly id = 'academic-quality-grok';
  readonly name = 'Calidad Académica (Grok-4 Real)';
  readonly description = 'Análisis profundo de calidad académica impulsado por Grok-4 (xAI) con razonamiento de alto nivel. Fallback automático al simulador de alta calidad si no hay clave API.';

  async analyze(params: {
    advance: Advance;
    content: string;
    pattern: ThesisPattern;
    locale?: 'es' | 'en';
  }): Promise<IAFeedback> {
    const { advance, content, pattern, locale = 'es' } = params;
    const apiKey = process.env.XAI_API_KEY;

    if (!apiKey) {
      // Let the orchestrator decide the next provider
      throw new Error('NO_API_KEY');
    }

    try {
      const result = await callRealGrok(content || advance.content || '', advance, pattern, locale);
      console.info(`[GrokRealAnalyzer] Real Grok analysis succeeded for advance ${advance.id} (model: ${DEFAULT_MODEL})`);
      return result;
    } catch (error: any) {
      console.warn(`[GrokRealAnalyzer] Real Grok call failed: ${error.message}`);
      // Re-throw so the orchestrator can try the next provider (Gemini) or simulator
      throw error;
    }
  }

  async simulateProgress(
    onProgress: (progress: number, stage: string) => void,
    locale: 'es' | 'en' = 'es'
  ): Promise<void> {
    const apiKey = process.env.XAI_API_KEY;
    const isReal = !!apiKey;

    const stages = isReal
      ? [
          { progress: 12, stage: locale === 'en' ? "Connecting to xAI Grok-4..." : "Conectando con xAI Grok-4..." },
          { progress: 28, stage: locale === 'en' ? "Grok is reading the full document..." : "Grok está leyendo el documento completo..." },
          { progress: 47, stage: locale === 'en' ? "Performing deep academic reasoning..." : "Realizando razonamiento académico profundo..." },
          { progress: 66, stage: locale === 'en' ? "Evaluating structure, coherence and citations..." : "Evaluando estructura, coherencia y citas..." },
          { progress: 81, stage: locale === 'en' ? "Generating nuanced findings and recommendations..." : "Generando hallazgos matizados y recomendaciones..." },
          { progress: 94, stage: locale === 'en' ? "Finalizing structured review..." : "Finalizando revisión estructurada..." },
          { progress: 100, stage: locale === 'en' ? "Grok-4 analysis complete." : "Análisis con Grok-4 completado." },
        ]
      : [
          { progress: 15, stage: locale === 'en' ? "Text extraction completed. Preparing analysis..." : "Extracción de texto completada. Preparando análisis..." },
          { progress: 32, stage: locale === 'en' ? "Analyzing document structure..." : "Analizando estructura del documento..." },
          { progress: 48, stage: locale === 'en' ? "Evaluating academic quality indicators..." : "Evaluando indicadores de calidad académica..." },
          { progress: 65, stage: locale === 'en' ? "Checking citations, coherence and language..." : "Verificando citas, coherencia y lenguaje..." },
          { progress: 80, stage: locale === 'en' ? "Applying institutional rubric..." : "Aplicando rúbrica institucional..." },
          { progress: 92, stage: locale === 'en' ? "Generating findings and recommendations..." : "Generando hallazgos y recomendaciones..." },
          { progress: 100, stage: locale === 'en' ? "Analysis completed. Ready for human review." : "Análisis completado. Listo para revisión humana." },
        ];

    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, isReal ? 380 + Math.random() * 220 : 420 + Math.random() * 280));
      onProgress(stage.progress, stage.stage);
    }
  }
}

// Singleton instance
export const grokRealAnalyzer = new GrokRealAnalyzer();