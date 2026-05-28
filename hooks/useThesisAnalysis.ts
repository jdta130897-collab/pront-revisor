'use client';

import { useState, useCallback } from 'react';
import { Advance, IAFeedback, OriginalityReport, ThesisPattern } from '@/types';
import { defaultAnalysisOrchestrator } from '@/lib/analyzers/orchestrator';

interface UseThesisAnalysisOptions {
  pattern: ThesisPattern;
  locale?: 'es' | 'en';
}

interface AnalysisResults {
  academic?: IAFeedback;
  originality?: OriginalityReport;
  combinedScore?: number;
}

interface UseThesisAnalysisReturn {
  results: AnalysisResults | null;
  isAnalyzing: boolean;
  progress: number;
  stage: string;
  error: string | null;

  runAnalysis: (advance: Advance, content: string) => Promise<AnalysisResults | null>;
  reset: () => void;
}

/**
 * Custom hook that encapsulates the full thesis analysis orchestration.
 * 
 * This is the recommended way for UI components to interact with the analysis system.
 * It keeps page.tsx (or any view) clean and focused on UI/state.
 */
export function useThesisAnalysis(options: UseThesisAnalysisOptions): UseThesisAnalysisReturn {
  const { pattern, locale = 'es' } = options;

  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async (advance: Advance, content: string): Promise<AnalysisResults | null> => {
    setIsAnalyzing(true);
    setProgress(0);
    setStage('Iniciando análisis...');
    setError(null);

    try {
      const analysisResults = await defaultAnalysisOrchestrator.runAll({
        advance,
        content,
        pattern,
        locale,
        onProgress: (p, s) => {
          setProgress(p);
          setStage(s);
        },
      });

      setResults(analysisResults);
      return analysisResults;

    } catch (err: any) {
      const errorMessage = err.message || 'Error desconocido durante el análisis';
      setError(errorMessage);
      console.error('Analysis error:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [pattern, locale]);

  const reset = useCallback(() => {
    setResults(null);
    setIsAnalyzing(false);
    setProgress(0);
    setStage('');
    setError(null);
  }, []);

  return {
    results,
    isAnalyzing,
    progress,
    stage,
    error,
    runAnalysis,
    reset,
  };
}