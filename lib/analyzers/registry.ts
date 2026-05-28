import { ThesisAnalyzer } from './types';

/**
 * Simple but powerful Analyzer Registry.
 * 
 * Allows registering analyzers at runtime and retrieving them by id.
 * This is the foundation for making the system extensible.
 */
class AnalyzerRegistry {
  private analyzers = new Map<string, ThesisAnalyzer<any, any>>();

  /**
   * Register a new analyzer.
   * If an analyzer with the same id already exists, it will be overwritten.
   */
  register<T = any, C = any>(analyzer: ThesisAnalyzer<T, C>): void {
    if (this.analyzers.has(analyzer.id)) {
      console.warn(`[AnalyzerRegistry] Overwriting existing analyzer with id: ${analyzer.id}`);
    }
    this.analyzers.set(analyzer.id, analyzer);
  }

  /**
   * Get an analyzer by its id.
   */
  get<T = any, C = any>(id: string): ThesisAnalyzer<T, C> | undefined {
    return this.analyzers.get(id) as ThesisAnalyzer<T, C> | undefined;
  }

  /**
   * Get all registered analyzers.
   */
  getAll(): ThesisAnalyzer<any, any>[] {
    return Array.from(this.analyzers.values());
  }

  /**
   * Check if an analyzer is registered.
   */
  has(id: string): boolean {
    return this.analyzers.has(id);
  }

  /**
   * Unregister an analyzer (useful for testing or dynamic loading).
   */
  unregister(id: string): boolean {
    return this.analyzers.delete(id);
  }

  /**
   * Clear all registered analyzers.
   */
  clear(): void {
    this.analyzers.clear();
  }
}

// Singleton instance
export const analyzerRegistry = new AnalyzerRegistry();

// Auto-register core analyzers when this module is imported
import { academicQualityAnalyzer } from './academic-analyzer';
import { originalityAnalyzer } from './originality-analyzer';
import { grokRealAnalyzer } from './grok-real-analyzer';
import { geminiAnalyzer } from './gemini-analyzer';

analyzerRegistry.register(academicQualityAnalyzer);
analyzerRegistry.register(originalityAnalyzer);
analyzerRegistry.register(grokRealAnalyzer);
analyzerRegistry.register(geminiAnalyzer);

// Convenience function
export function registerAnalyzer(analyzer: ThesisAnalyzer<any, any>) {
  analyzerRegistry.register(analyzer);
}

export function getAnalyzer<T = any, C = any>(id: string) {
  return analyzerRegistry.get<T, C>(id);
}