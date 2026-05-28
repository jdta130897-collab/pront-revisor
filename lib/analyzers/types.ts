import { Advance, IAFeedback, OriginalityReport, ThesisPattern } from '@/types';

/**
 * Core interface for any analysis engine in PRONT Revisor.
 * 
 * This abstraction is the foundation for the pluggable architecture.
 * Both the academic quality analyzer and the originality/plagiarism+AI detector
 * should implement this interface.
 * 
 * Future engines (real Grok-4 + RAG, external APIs, etc.) will also implement it.
 */
export interface ThesisAnalyzer<T = any, C = any> {
  /** Unique identifier for this analyzer (e.g. "academic-quality", "originality-ai") */
  readonly id: string;

  /** Human-readable name shown in UI / logs */
  readonly name: string;

  /** Short description of what this analyzer evaluates */
  readonly description: string;

  /**
   * Optional default configuration for this analyzer.
   * Can be overridden per run.
   */
  readonly defaultConfig?: C;

  /**
   * Executes the analysis.
   * Should be deterministic given the same inputs.
   */
  analyze(params: {
    advance: Advance;
    content: string;
    pattern: ThesisPattern;
    locale?: 'es' | 'en';
    config?: C;                    // Optional per-run override
  }): Promise<T> | T;

  /**
   * Optional: Simulate progress for better UX while the analyzer "thinks".
   * Used by the orchestrator during analysis.
   */
  simulateProgress?(
    onProgress: (progress: number, stage: string) => void,
    locale?: 'es' | 'en'
  ): Promise<void>;
}

/**
 * Union type of all supported analysis results.
 * Useful for the orchestrator.
 */
export type AnalysisResult =
  | { type: 'academic'; data: IAFeedback }
  | { type: 'originality'; data: OriginalityReport };

/**
 * Orchestrator that can run multiple analyzers and combine results.
 */
export interface AnalysisOrchestrator {
  runAll(params: {
    advance: Advance;
    content: string;
    pattern: ThesisPattern;
    locale?: 'es' | 'en';
    onProgress?: (progress: number, stage: string) => void;
  }): Promise<{
    academic?: IAFeedback;
    originality?: OriginalityReport;
    combinedScore?: number;
  }>;
}