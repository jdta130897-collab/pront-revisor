import { Advance, IAFeedback, OriginalityReport, ThesisPattern } from '@/types';
import { academicQualityAnalyzer } from './academic-analyzer';
import { originalityAnalyzer } from './originality-analyzer';
import { grokRealAnalyzer } from './grok-real-analyzer';
import { geminiAnalyzer } from './gemini-analyzer';
import { analyzerRegistry } from './registry';
import { AnalysisOrchestrator } from './types';

/**
 * Default orchestrator for PRONT Revisor.
 * 
 * Supports multiple real AI providers with automatic fallback:
 * Grok → Gemini → High-quality simulator
 */
export const defaultAnalysisOrchestrator: AnalysisOrchestrator = {
  async runAll({ advance, content, pattern, locale = 'es', onProgress }) {
    const results: {
      academic?: IAFeedback;
      originality?: OriginalityReport;
      combinedScore?: number;
    } = {};

    // === Academic Quality with real multi-provider fallback ===
    // Priority order: Grok → Gemini → High-quality simulator
    const academicCandidates: any[] = [];

    if (process.env.XAI_API_KEY) {
      academicCandidates.push(analyzerRegistry.get('academic-quality-grok') || grokRealAnalyzer);
    }
    if (process.env.GEMINI_API_KEY) {
      academicCandidates.push(analyzerRegistry.get('academic-quality-gemini') || geminiAnalyzer);
    }
    academicCandidates.push(analyzerRegistry.get('academic-quality') || academicQualityAnalyzer);

    let academicResult: IAFeedback | null = null;
    let usedAnalyzerName = 'Unknown';

    for (const analyzer of academicCandidates) {
      try {
        if (analyzer.simulateProgress && onProgress) {
          await analyzer.simulateProgress(onProgress, locale);
        }

        const result = await analyzer.analyze({ advance, content, pattern, locale });
        academicResult = result;
        usedAnalyzerName = analyzer.name || analyzer.id;
        break;
      } catch (err: any) {
        if (err.message === 'NO_API_KEY') {
          console.info(`[Orchestrator] Skipping ${analyzer.name || analyzer.id} (no API key configured)`);
        } else {
          console.warn(`[Orchestrator] ${analyzer.name || analyzer.id} failed: ${err.message}. Trying next provider...`);
        }
      }
    }

    if (!academicResult) {
      // Final fallback to pure simulator
      if (academicQualityAnalyzer.simulateProgress && onProgress) {
        await academicQualityAnalyzer.simulateProgress(onProgress, locale);
      }
      academicResult = await academicQualityAnalyzer.analyze({ advance, content, pattern, locale });
      usedAnalyzerName = 'High-quality Simulator (fallback)';
    }

    console.info(`[Orchestrator] Academic analysis completed using: ${usedAnalyzerName}`);
    results.academic = academicResult;

    // Originality + AI Detection
    const originality = analyzerRegistry.get('originality-ai') || originalityAnalyzer;

    if (originality.simulateProgress && onProgress) {
      await originality.simulateProgress((p, stage) => {
        onProgress(70 + Math.floor(p * 0.3), stage);
      }, locale);
    }
    results.originality = await originality.analyze({ advance, content, pattern, locale });

    // === FINAL SCORE LOGIC (with STRONG penalty for high IA + Similarity) ===
    // Business rule (enforced with 60% weight on integrity):
    // - Low IA content + Low Similarity   →  Much higher final grade (tends to be aprobatoria)
    // - High IA content + High Similarity  →  Significantly lower final grade (tends to be desaprobatoria)
    //
    // Integrity now has 60% weight (academic quality only 40%), so originality problems penalize the grade heavily.
    if (results.academic && results.originality) {
      const academicScore = results.academic.overallScore;

      // Integrity score (0-100): heavily penalized by high similarity and high AI-generated content
      // Stronger penalties applied as requested
      const similarityPenalty = results.originality.similarityScore * 0.85;   // stronger penalty
      const aiContentPenalty  = results.originality.aiContentScore  * 1.05;   // very aggressive penalty

      const integrityScore = Math.max(0, Math.min(100, 
        100 - similarityPenalty - aiContentPenalty
      ));

      // Final combined score (this becomes the initial finalScore shown to student and advisor):
      // 40% Academic Quality + 60% Integrity (stronger weight on penalties)
      // 
      // Business rule (enforced):
      // - Low IA content + Low Similarity  →  Higher / passing grade (aprobatoria)
      // - High IA content + High Similarity →  Significantly lower / failing grade (desaprobatoria)
      //
      // Because Integrity now has 60% weight, high originality problems drag the final grade down hard.
      results.combinedScore = Math.round(
        (academicScore * 0.40) +
        (integrityScore * 0.60)
      );
    }

    return {
    ...results,
    academicProvider: usedAnalyzerName,   // Expose which engine was actually used
  };
  }
};