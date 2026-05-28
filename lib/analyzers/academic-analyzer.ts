import { Advance, IAFeedback, ThesisPattern } from '@/types';
import { analyzeWithGrok, simulateGrokProcessing } from '../grok-analyzer';
import { ThesisAnalyzer } from './types';

/**
 * Academic Quality Analyzer
 * 
 * Evaluates structure, content coherence, academic writing, citations, 
 * and adherence to the institutional thesis pattern.
 * 
 * Currently powered by a sophisticated rule-based simulator (can be replaced
 * later with real Grok-4 + RAG or fine-tuned models).
 */
export class AcademicQualityAnalyzer implements ThesisAnalyzer<IAFeedback> {
  readonly id = 'academic-quality';
  readonly name = 'Calidad Académica';
  readonly description = 'Evalúa estructura, coherencia, redacción académica, citas y cumplimiento del patrón institucional.';

  async analyze(params: {
    advance: Advance;
    content: string;
    pattern: ThesisPattern;
    locale?: 'es' | 'en';
  }): Promise<IAFeedback> {
    const { advance, content, pattern, locale = 'es' } = params;

    return analyzeWithGrok(advance, pattern, content, locale);
  }

  async simulateProgress(
    onProgress: (progress: number, stage: string) => void,
    locale: 'es' | 'en' = 'es'
  ): Promise<void> {
    return simulateGrokProcessing(onProgress, locale);
  }
}

// Singleton instance for easy use
export const academicQualityAnalyzer = new AcademicQualityAnalyzer();