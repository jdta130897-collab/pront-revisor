export interface User {
  id: string;
  name: string;
  email: string;
  role: 'estudiante' | 'asesor' | 'coordinador' | 'admin';
  avatar?: string;
  program?: string;
  advisorId?: string;
  orcid?: string; // ORCID identifier (verified academic ID)
  advisorAssignedManually?: boolean; // false = elegido en registro, true = reasignado manualmente por admin
}

export interface ThesisPattern {
  id: string;
  name: string;
  program: string;
  version: string;
  sections: PatternSection[];
  rubric: Rubric;
  createdAt: string;
  createdBy?: string;        // ID of the asesor who created it
  advisorId?: string;        // For filtering: which advisor owns this pattern
}

export interface PatternSection {
  id: string;
  name: string;
  required: boolean;
  minWords: number;
  maxWords: number;
  weight: number;
  description: string;
}

export interface Rubric {
  structure: number; // 30%
  content: number;   // 40%
  form: number;      // 20%
  originality: number; // 10%
}

export interface Advance {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  version: number;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'txt';
  uploadDate: string;
  status: 'pendiente' | 'analisis_ia' | 'en_revision' | 'observado' | 'aprobado' | 'rechazado';
  iaScore: number;
  humanScore?: number;
  finalScore?: number;
  program: string;
  advisor: string;
  advisorId?: string | null;   // Real field from Prisma (used for RBAC)
  content?: string; // extracted text for demo
  humanReviews?: any[];        // Populated via include in some queries
  academicReport?: any;        // Included from Prisma in detailed fetches
  originalityReport?: any;     // Included from Prisma in detailed fetches
}

export interface IAFeedback {
  id: string;
  advanceId: string;
  overallScore: number;
  structureScore: number;
  contentScore: number;
  formScore: number;
  originalityScore: number;
  note: number; // Nota final del estudiante (0-20) basada en el puntaje combinado
  summary: string;
  findings: IAFinding[];
  strengths: string[];
  recommendations: string[];
  estimatedLevel: 'Inicial' | 'Intermedio' | 'Avanzado' | 'Excelente';
  processedAt: string;
  // New: Which engine actually performed this analysis
  analysisProvider?: string;   // e.g. "grok-4-real", "gemini", "high-quality-simulator"
}

export interface IAFinding {
  id: string;
  section: string;
  type: 'faltante' | 'error_estructural' | 'error_contenido' | 'error_forma' | 'sugerencia';
  severity: 'critico' | 'mayor' | 'menor' | 'sugerencia';
  description: string;
  instruction: string;
  example?: string;
  pageApprox?: number;
}

export interface Review {
  id: string;
  advanceId: string;
  reviewerId: string;
  reviewerName: string;
  comments: string;
  adjustedScore?: number;
  status: 'aprobado' | 'observado' | 'rechazado';
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// === New: Plagiarism + AI Content Detection (for Option B) ===
export interface OriginalityReport {
  id: string;
  advanceId: string;
  similarityScore: number;      // % de similitud / plagio (0-100)
  aiContentScore: number;       // % de probabilidad de contenido generado por IA (0-100)
  aiDetectionLabel: 'human' | 'mixed' | 'ai_generated';
  sources: MatchedSource[];
  highlightedSections: HighlightedSection[];
  totalSourcesFound: number;
  processedAt: string;
  detectionMethod: 'simulated' | 'copyleaks' | 'originality_ai' | 'turnitin';
}

export interface MatchedSource {
  id: string;
  url?: string;
  title: string;
  similarity: number;           // % de coincidencia con esta fuente
  sourceType: 'web' | 'academic' | 'repository' | 'student_paper';
  matchedText?: string;
}

export interface HighlightedSection {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  similarityScore: number;
  sourceId?: string;
  type: 'plagiarism' | 'ai_generated' | 'paraphrased';
}
