'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, FileText, BarChart3, Settings, Upload, Eye, 
  CheckCircle, XCircle, Clock, Award, TrendingUp, 
  Moon, Sun, LogOut, Bell, Search, Filter, Plus 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSession, signOut } from 'next-auth/react';

import { 
  User, Advance, IAFeedback, IAFinding, ThesisPattern,
  OriginalityReport 
} from '@/types';
import { analyzeWithGrok, simulateGrokProcessing } from '@/lib/grok-analyzer';
import { analyzeOriginality, simulateOriginalityProcessing } from '@/lib/originality-analyzer';
import { defaultAnalysisOrchestrator } from '@/lib/analyzers';
import Dashboard from '@/components/Dashboard';
import UploadModal from '@/components/UploadModal';
import ReviewPanel from '@/components/ReviewPanel';
import PatternConfig from '@/components/PatternConfig';
import BulkReview from '@/components/BulkReview';
import Reports from '@/components/Reports';
import UserManagement from '@/components/UserManagement';
import { useTranslation, LanguageSwitcher } from '@/lib/i18n';

const MOCK_USER: User = {
  id: 's1',
  name: 'Carlos Mendoza',
  email: 'carlos.m@uni.edu',
  role: 'estudiante',
  avatar: undefined,
  program: 'Maestría en Educación',
  advisorId: 'u1',
};

const MOCK_STUDENTS: User[] = [
  { id: 's1', name: 'Carlos Mendoza', email: 'carlos.m@uni.edu', role: 'estudiante', program: 'Maestría en Educación', advisorId: 'u1' },
  { id: 's2', name: 'Laura Pérez', email: 'laura.p@uni.edu', role: 'estudiante', program: 'Maestría en Educación', advisorId: 'u1' },
  { id: 's3', name: 'Miguel Torres', email: 'miguel.t@uni.edu', role: 'estudiante', program: 'Maestría en Educación', advisorId: 'u1' },
];

const MOCK_PATTERNS: ThesisPattern[] = [
  {
    id: 'pat-001',
    name: 'Plantilla Tesis Maestría Educación 2026',
    program: 'Maestría en Educación',
    version: 'v3.2',
    sections: [
      { id: 'sec1', name: 'Portada', required: true, minWords: 0, maxWords: 0, weight: 5, description: 'Datos institucionales y título' },
      { id: 'sec2', name: 'Índice', required: true, minWords: 50, maxWords: 150, weight: 5, description: 'Tabla de contenidos numerada' },
      { id: 'sec3', name: 'Introducción', required: true, minWords: 800, maxWords: 1500, weight: 15, description: 'Contexto, problema, objetivos' },
      { id: 'sec4', name: 'Marco Teórico', required: true, minWords: 2000, maxWords: 4000, weight: 20, description: 'Fundamentos y revisión de literatura' },
      { id: 'sec5', name: 'Metodología', required: true, minWords: 1200, maxWords: 2500, weight: 20, description: 'Diseño, población, instrumentos' },
      { id: 'sec6', name: 'Resultados', required: true, minWords: 1500, maxWords: 3500, weight: 20, description: 'Análisis y presentación de datos' },
      { id: 'sec7', name: 'Conclusiones', required: true, minWords: 600, maxWords: 1200, weight: 10, description: 'Síntesis y recomendaciones' },
      { id: 'sec8', name: 'Bibliografía', required: true, minWords: 400, maxWords: 800, weight: 5, description: 'Referencias en APA 7' },
    ],
    rubric: { structure: 30, content: 40, form: 20, originality: 10 },
    createdAt: '2026-01-15',
    createdBy: 'u1',           // Dra. Elena Vargas (asesora)
    advisorId: 'u1',
  },
  // Example of another advisor's pattern
  {
    id: 'pat-002',
    name: 'Plantilla Tesis Doctorado 2026',
    program: 'Doctorado en Educación',
    version: 'v1.1',
    sections: [
      { id: 'sec1', name: 'Portada', required: true, minWords: 0, maxWords: 0, weight: 3, description: '' },
      { id: 'sec2', name: 'Resumen', required: true, minWords: 300, maxWords: 500, weight: 5, description: '' },
      { id: 'sec3', name: 'Introducción', required: true, minWords: 1500, maxWords: 3000, weight: 15, description: '' },
    ],
    rubric: { structure: 25, content: 45, form: 15, originality: 15 },
    createdAt: '2026-02-10',
    createdBy: 'u2',           // Another advisor
    advisorId: 'u2',
  }
];

const MOCK_ADVANCES: Advance[] = [
  {
    id: 'adv-001',
    studentId: 's1',
    studentName: 'Carlos Mendoza',
    title: 'Impacto de la Inteligencia Artificial en la Personalización del Aprendizaje',
    version: 2,
    fileName: 'Avance_Tesis_Carlos_Mendoza_v2.pdf',
    fileType: 'pdf',
    uploadDate: '2026-05-10T14:30:00Z',
    status: 'en_revision',
    iaScore: 78,
    humanScore: 82,
    finalScore: 81,
    program: 'Maestría en Educación',
    advisor: 'Dra. Elena Vargas',
    content: `INTRODUCCIÓN
La inteligencia artificial (IA) ha emergido como una herramienta transformadora en el ámbito educativo. El presente estudio tiene como objetivo general analizar el impacto de sistemas de IA adaptativos en la personalización del aprendizaje en estudiantes de educación superior.

MARCO TEÓRICO
Diversos autores como (Luckin et al., 2022) han destacado que los sistemas de tutoría inteligente pueden mejorar significativamente los resultados académicos. Sin embargo, persisten desafíos éticos y de equidad (Holmes & Porayska-Pomsta, 2023).

METODOLOGÍA
Se empleó un diseño mixto secuencial explicativo. La población estuvo conformada por 320 estudiantes de la Universidad Nacional. Se aplicaron encuestas validadas y entrevistas semiestructuradas. El análisis de datos se realizó mediante SPSS v29 y NVivo.

RESULTADOS
Los hallazgos revelan que el 72% de los estudiantes reportaron mayor motivación intrínseca al usar plataformas adaptativas. No obstante, el 34% expresó preocupación por la privacidad de sus datos.

CONCLUSIONES
Los sistemas de IA personalizados representan una oportunidad significativa para la educación inclusiva, siempre que se implementen con marcos éticos robustos. Se recomienda ampliar la muestra en futuras investigaciones.`,
  },
  {
    id: 'adv-002',
    studentId: 's2',
    studentName: 'Laura Pérez',
    title: 'Estrategias de Gamificación para el Desarrollo de Competencias Digitales',
    version: 1,
    fileName: 'Avance_Laura_Perez_v1.docx',
    fileType: 'docx',
    uploadDate: '2026-05-12T09:15:00Z',
    status: 'pendiente',
    iaScore: 0,
    program: 'Maestría en Educación',
    advisor: 'Dra. Elena Vargas',
  },
  {
    id: 'adv-003',
    studentId: 's3',
    studentName: 'Miguel Torres',
    title: 'Resiliencia Docente en Contextos de Crisis Educativa Post-Pandemia',
    version: 3,
    fileName: 'Avance_Miguel_Torres_v3.pdf',
    fileType: 'pdf',
    uploadDate: '2026-05-08T16:45:00Z',
    status: 'aprobado',
    iaScore: 91,
    humanScore: 94,
    finalScore: 93,
    program: 'Maestría en Educación',
    advisor: 'Dra. Elena Vargas',
  },
];

export default function PRONTRevisor() {
  const { t, locale, setLocale } = useTranslation();
  const { data: session, status } = useSession();

  // ============================================================
  // ALL STATE DECLARATIONS — must be at the very top (Rules of Hooks)
  // ============================================================

  // User / Auth
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USER);

  // Navigation & View
  const [currentView, setCurrentView] = useState<'dashboard' | 'upload' | 'review' | 'pattern' | 'bulk' | 'reports' | 'users' | 'mis-estudiantes'>('dashboard');
  const [patterns, setPatterns] = useState<ThesisPattern[]>(MOCK_PATTERNS);
  const [users, setUsers] = useState<User[]>([]);

  // =============================================
  // ROLE HIERARCHY & PERMISSIONS - PRONT REVISOR
  // =============================================
  // ESTUDIANTE
  //   - Solo ve y sube SUS propios avances
  //   - Ve resultados IA + Originalidad
  //   - NO puede hacer revisión humana ni calificar (ni siquiera los suyos)
  //
  // ASESOR (Docente)
  //   - Ve SOLO los avances de los estudiantes asignados a él (vía advisorId)
  //   - Puede subir y auto-analizar documentos
  //   - Puede hacer revisión humana y calificar avances de SUS estudiantes
  //   - Puede crear y gestionar SUS PROPIOS patrones
  //
  // COORDINADOR
  //   - Ve avances de múltiples asesores (amplio acceso)
  //   - Gestión de patrones institucionales + revisión masiva
  //
  // ADMIN
  //   - Acceso total + gestión de usuarios y asignaciones
  //
  // Jerarquía de datos:
  //   Estudiante → advisorId → Asesor
  //   Asesor → crea patrones (createdBy/advisorId)
  //   Avance → advisorId (heredado del estudiante al subir)
  // =============================================

  // Advances data (real + fallback)
  const [advances, setAdvances] = useState<Advance[]>(MOCK_ADVANCES);

  // For "Mis Estudiantes" - real students who chose this advisor (even with 0 advances)
  const [myAdvisorStudents, setMyAdvisorStudents] = useState<any[]>([]);
  const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null);
  const [iaFeedback, setIaFeedback] = useState<IAFeedback | null>(null);
  const [originalityReport, setOriginalityReport] = useState<OriginalityReport | null>(null);
  const [humanReviews, setHumanReviews] = useState<any[]>([]); // History of human reviews from DB
  const [selectedSuspiciousId, setSelectedSuspiciousId] = useState<string | null>(null);
  const [combinedFinalScore, setCombinedFinalScore] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Real backend-driven filters + pagination + loading
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Analysis UI state
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');

  // Modals & Notifications
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Helper to add real notifications based on backend results (immediate feedback)
  const addNotification = (type: 'success' | 'warning' | 'info', title: string, message: string) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      type,
      title,
      message,
      time: 'ahora',
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 19)]); // keep max 20
  };

  // Derive notifications from real backend data (advances + humanReviews)
  const deriveRealNotifications = () => {
    const derived: any[] = [];

    if (currentUser.role === 'estudiante') {
      // Student: notifications from human reviews on their advances
      const studentAdvances = advances.filter(a => a.studentId === currentUser.id);

      studentAdvances.forEach(adv => {
        const reviews = (adv as any).humanReviews || humanReviews.filter((r: any) => r.advanceId === adv.id);

        reviews.forEach((rev: any) => {
          derived.push({
            id: `hr-${adv.id}-${rev.id || Date.now()}`,
            type: 'success',
            title: 'Revisión recibida del asesor',
            message: `Tu avance "${adv.title}" fue revisado por ${rev.reviewerName || 'el asesor'}. Estado: ${rev.status || 'actualizado'}.`,
            time: rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('es-ES') : 'reciente',
            read: false,
          });
        });
      });
    }

    if (currentUser.role === 'asesor') {
      // Advisor: notifications for new advances uploaded by their students
      const myStudentsAdvances = advances.filter(adv =>
        adv.advisorId === currentUser.id ||
        (myAdvisorStudents.some((s: any) => s.id === adv.studentId))
      );

      myStudentsAdvances.slice(0, 8).forEach(adv => {
        derived.push({
          id: `new-adv-${adv.id}`,
          type: 'info',
          title: 'Nuevo avance recibido',
          message: `${adv.studentName} subió "${adv.title}"`,
          time: adv.uploadDate ? new Date(adv.uploadDate).toLocaleDateString('es-ES') : 'reciente',
          read: false,
        });
      });
    }

    // Only set if we have real derived notifications (avoid overwriting immediate ones unnecessarily)
    if (derived.length > 0) {
      setNotifications(derived);
    }
  };

  // Theme
  const [isDark, setIsDark] = useState(true);

  // Real backend KPIs (Dashboard 100% driven by /api/stats)
  const [realStats, setRealStats] = useState<any>(null);

  // Get patterns visible to the current user (ownership model)
  const visiblePatterns = React.useMemo(() => {
    if (['coordinador', 'admin'].includes(currentUser.role)) {
      return patterns; // See everything
    }
    if (currentUser.role === 'asesor') {
      // Asesores only see patterns they created
      return patterns.filter(p => p.createdBy === currentUser.id || p.advisorId === currentUser.id);
    }
    // Estudiante: only patterns from their advisor
    if (currentUser.role === 'estudiante' && currentUser.advisorId) {
      return patterns.filter(p => p.advisorId === currentUser.advisorId);
    }
    return patterns;
  }, [patterns, currentUser]);

  const activePattern = visiblePatterns[0] || patterns[0] || MOCK_PATTERNS[0];

  // ============================================================
  // EFFECTS & CALLBACKS (now safe — all state declared above)
  // ============================================================

  // Sync real session with currentUser when user is logged in
  useEffect(() => {
    if (session?.user) {
      const userId = (session.user as any).id;

      const baseUser: User = {
        id: userId || 'real-user',
        name: session.user.name || 'Usuario',
        email: session.user.email || '',
        role: ((session.user as any).role as User['role']) || 'estudiante',
        // avatar and orcid come from the database fetch below (not from JWT)
        avatar: undefined,
        orcid: (session.user as any).orcid || undefined,
        program: 'Maestría en Educación',
      };

      setCurrentUser(baseUser);

      // Always fetch fresh profile (including avatar + orcid) from DB
      if (userId) {
        fetch(`/api/users/${userId}`)
          .then(res => res.ok ? res.json() : null)
          .then(fresh => {
            if (fresh) {
              setCurrentUser(prev => ({
                ...prev,
                avatar: fresh.avatar || prev.avatar,
                orcid: fresh.orcid || prev.orcid,
              }));
            }
          })
          .catch(() => {});
      }
    }
  }, [session]);

  // Load real advances from backend with filters + pagination
  const loadRealAdvances = useCallback(async (reset = false) => {
    setIsLoadingList(true);
    try {
      const params = new URLSearchParams({
        limit: '20',
        page: reset ? '1' : currentPage.toString(),
      });

      if (filterStatus !== 'todos') params.set('status', filterStatus);
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/advances?${params}`);
      if (res.ok) {
        const response = await res.json();
        const newAdvances = Array.isArray(response) ? response : (response.data || []);

        if (reset) {
          setAdvances(newAdvances as any);
          setCurrentPage(1);
        } else {
          setAdvances(prev => [...prev, ...newAdvances] as any);
        }

        const pagination = response.pagination;
        if (pagination) {
          setHasMore(currentPage < pagination.totalPages);
        } else {
          setHasMore(newAdvances.length >= 20);
        }
      } else {
        const errorText = await res.text().catch(() => '');
        console.error('Error cargando avances desde backend:', res.status, errorText);
      }
    } catch (e) {
      console.log('Using demo data');
    } finally {
      setIsLoadingList(false);
    }
  }, [filterStatus, searchTerm, currentPage]);

  // Debounced real backend search + filters
  useEffect(() => {
    const timer = setTimeout(() => {
      loadRealAdvances(true);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, filterStatus]);

  // Reload data when entering bulk or review views (helps asesores see their students)
  useEffect(() => {
    if (['bulk', 'review'].includes(currentView)) {
      loadRealAdvances(true);
    }
  }, [currentView]);

  // Reload advances when entering bulk review (important for asesores to see their students' advances)
  useEffect(() => {
    if (currentView === 'bulk') {
      loadRealAdvances(true);
    }
  }, [currentView]);



  // Load all users for admin management
  const loadAllUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Error loading users for admin');
    }
  };

  // Load real students for "Mis Estudiantes" when advisor opens the view
  useEffect(() => {
    const loadMyStudents = async () => {
      if (currentView !== 'mis-estudiantes' || currentUser.role !== 'asesor') {
        return;
      }
      try {
        const res = await fetch(`/api/users?role=estudiante&advisorId=${currentUser.id}`);
        if (res.ok) {
          const students = await res.json();
          setMyAdvisorStudents(Array.isArray(students) ? students : []);
        } else {
          setMyAdvisorStudents([]);
        }
      } catch {
        setMyAdvisorStudents([]);
      }
    };

    loadMyStudents();
  }, [currentView, currentUser.id, currentUser.role]);

  // Load users when admin opens the users view or coordinator opens mis-estudiantes
  useEffect(() => {
    if ((currentView === 'users' && currentUser.role === 'admin') || 
        (currentView === 'mis-estudiantes' && currentUser.role === 'coordinador')) {
      loadAllUsers();
    }
  }, [currentView, currentUser.role]);

  // Auto-select first advance needing review when entering "Revisión Inteligente" directly
  // (this was the behavior before deployment prep)
  useEffect(() => {
    if (currentView !== 'review' || selectedAdvance) return;

    const needsReview = advances.find(a => 
      ['en_revision', 'observado'].includes(a.status) &&
      (currentUser.role !== 'asesor' || a.advisorId === currentUser.id)
    );

    if (needsReview) {
      setSelectedAdvance(needsReview);
      // Load fresh data
      fetch(`/api/advances/${needsReview.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(fresh => {
          if (fresh) {
            setSelectedAdvance(fresh);
            setHumanReviews(fresh.humanReviews || []);
            if (fresh.academicReport) setIaFeedback(fresh.academicReport);
            if (fresh.originalityReport) setOriginalityReport(fresh.originalityReport);
            setCombinedFinalScore(fresh.finalScore || null);
          }
        })
        .catch(() => {});
    }
  }, [currentView]);

  // Extra safety: if admin is on users view but users list is empty, load
  useEffect(() => {
    if (currentView === 'users' && currentUser.role === 'admin' && users.length === 0) {
      loadAllUsers();
    }
  }, [currentView, currentUser.role, users.length]);



  // Automatically derive real notifications from backend data when relevant data changes
  useEffect(() => {
    if (advances.length > 0 || humanReviews.length > 0) {
      deriveRealNotifications();
    }
  }, [advances, humanReviews, currentUser.role, myAdvisorStudents.length]);

  // Auto-create a default pattern for advisors the first time they visit "Patrones"
  // This prevents the tab from feeling empty for new advisors
  useEffect(() => {
    if (currentView === 'pattern' && currentUser.role === 'asesor') {
      const myVisiblePatterns = patterns.filter(p => 
        p.createdBy === currentUser.id || p.advisorId === currentUser.id
      );

      if (myVisiblePatterns.length === 0) {
        // Create a sensible default pattern for this advisor
        const defaultPattern: ThesisPattern = {
          id: `pat-${Date.now()}`,
          name: `Patrón por Defecto - ${currentUser.name.split(' ')[0]}`,
          program: currentUser.program || 'Ingeniería de Sistemas',
          version: 'v1.0',
          sections: [
            { id: 'sec1', name: 'Introducción', required: true, minWords: 600, maxWords: 1200, weight: 15, description: 'Contexto, problema, objetivos e hipótesis' },
            { id: 'sec2', name: 'Marco Teórico', required: true, minWords: 1800, maxWords: 3500, weight: 25, description: 'Fundamentos teóricos y revisión de literatura' },
            { id: 'sec3', name: 'Metodología', required: true, minWords: 800, maxWords: 1800, weight: 20, description: 'Diseño, población, instrumentos y procedimientos' },
            { id: 'sec4', name: 'Resultados', required: true, minWords: 1000, maxWords: 2500, weight: 25, description: 'Presentación y análisis de datos' },
            { id: 'sec5', name: 'Conclusiones', required: true, minWords: 500, maxWords: 1000, weight: 15, description: 'Síntesis, limitaciones y recomendaciones' },
          ],
          rubric: { structure: 25, content: 40, form: 20, originality: 15 },
          createdAt: new Date().toISOString(),
          createdBy: currentUser.id,
          advisorId: currentUser.id,
        };

        setPatterns(prev => [...prev, defaultPattern]);
        toast.info('Patrón por defecto creado', {
          description: 'Hemos creado un patrón inicial para que puedas personalizarlo.',
        });
      }
    }
  }, [currentView, currentUser.role, currentUser.id]);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Role switcher for demo
  const switchRole = (role: User['role']) => {
    const newUser = { ...currentUser, role };
    if (role === 'estudiante') {
      newUser.name = 'Carlos Mendoza';
      newUser.email = 'carlos.m@uni.edu';
    } else if (role === 'coordinador') {
      newUser.name = 'Dr. Roberto Sánchez';
      newUser.email = 'roberto.s@uni.edu';
    } else if (role === 'admin') {
      newUser.name = 'Admin Sistema';
      newUser.email = 'admin@pront.edu';
    } else {
      newUser.name = 'Dra. Elena Vargas';
      newUser.email = 'elena.vargas@universidad.edu';
    }
    setCurrentUser(newUser);
    toast.success(`Cambiado a rol: ${role.toUpperCase()}`, {
      description: 'La interfaz se ha adaptado automáticamente',
    });
    setCurrentView('dashboard');
  };

  // Client-side fallback filter (real filtering now mostly happens on backend)
  const filteredAdvances = advances
    .filter(adv => {
      const matchesSearch = adv.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           adv.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'todos' || adv.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

  // Handle file upload - REAL backend flow (Opción A)
  const handleUpload = async (file: File, title: string) => {
    setShowUploadModal(false);

    const loadingToast = toast.loading('Subiendo y analizando documento en backend real...', {
      id: 'upload-toast',
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('studentId', currentUser.id);

      const response = await fetch('/api/advances', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en el backend al procesar el documento');
      }

      const result = await response.json();

      // Dismiss the long loading toast immediately (analysis already finished in backend)
      toast.dismiss('upload-toast');

      // Use the real persisted advance from the backend
      const realAdvance = result.advance as Advance;

      setAdvances(prev => [realAdvance, ...prev.filter(a => !a.id.startsWith('adv-'))]);

      // Show success right away (no more long fake demo progress)
      toast.success('¡Documento analizado!', {
        description: `Puntaje: ${realAdvance.finalScore || 0}%`,
      });

      // Add real notification
      addNotification(
        'success',
        'Análisis completado',
        `Avance "${realAdvance.title}" procesado. Puntaje: ${realAdvance.finalScore || 0}%`
      );

      // Navigate to review with real data (no artificial 4-6 second delay)
      setSelectedAdvance(realAdvance);
      setCurrentView('review');

      if (realAdvance.academicReport) {
        setIaFeedback(realAdvance.academicReport as any);
      }
      if (realAdvance.originalityReport) {
        setOriginalityReport(realAdvance.originalityReport as any);
      }
      setCombinedFinalScore(realAdvance.finalScore || null);

      // Optional: very brief "loading results" feel if you want polish (remove if too slow)
      // setIsAnalyzing(true);
      // setTimeout(() => setIsAnalyzing(false), 600);

      // Derive notifications for advisors
      setTimeout(() => deriveRealNotifications(), 400);
    } catch (error: any) {
      toast.error('Error en el backend', {
        id: 'upload-toast',
        description: error.message || 'No se pudo procesar el documento en el servidor.',
      });
    }
  };

  // Start Analysis - Academic Quality + Originality (Plagiarism + AI Content)
  const handleStartAnalysis = async (advance: Advance) => {
    setSelectedAdvance(advance);
    setIaFeedback(null);
    setOriginalityReport(null);
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisStage('Iniciando análisis combinado...');
    setCurrentView('review');

    try {
      // Use the Analysis Orchestrator (new architectural layer)
      // This is the recommended way going forward. It coordinates multiple analyzers.
      const results = await defaultAnalysisOrchestrator.runAll({
        advance,
        content: advance.content || '',
        pattern: activePattern,
        locale,
        onProgress: (progress, stage) => {
          setAnalysisProgress(progress);
          setAnalysisStage(stage);
        }
      });

      if (results.academic) setIaFeedback(results.academic);
      if (results.originality) setOriginalityReport(results.originality);
      if (results.combinedScore) {
        setCombinedFinalScore(results.combinedScore);

        const updatedAdvance = {
          ...advance,
          status: 'en_revision' as const,
          iaScore: results.academic?.overallScore || 0,
          finalScore: results.combinedScore,
        };

        setAdvances(prev => prev.map(a => a.id === advance.id ? updatedAdvance : a));
        setSelectedAdvance(updatedAdvance);

        toast.success('Análisis completo', {
          description: `Final: ${results.combinedScore}%`,
          action: {
            label: 'Ver detalles',
            onClick: () => setCurrentView('review'),
          },
        });
      }

    } catch (error) {
      toast.error('Error en el análisis', {
        description: 'Por favor intenta nuevamente o contacta al administrador',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save human review - REAL persistence in backend
  // If adjustedScore is provided → human score replaces the IA score (including its penalties)
  // If adjustedScore is undefined → advisor agrees with the IA → keep the current (penalized) finalScore
  const handleSaveReview = async (updatedFeedback: IAFeedback, humanComments: string, finalStatus: 'aprobado' | 'observado' | 'rechazado', adjustedScore?: number) => {
    if (!selectedAdvance) return;

    try {
      const payload: any = {
        reviewerId: currentUser.id,
        reviewerName: currentUser.name,
        comments: humanComments,
        status: finalStatus,
      };

      if (adjustedScore !== undefined && adjustedScore !== null) {
        payload.adjustedScore = adjustedScore;
      }
      // If not sent → backend keeps the existing finalScore (which already has the IA + penalty logic)

      const res = await fetch(`/api/advances/${selectedAdvance.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error guardando revisión en backend');

      // Refresh the full advance from backend to get the latest humanReview
      const refreshRes = await fetch(`/api/advances/${selectedAdvance.id}`);
      if (refreshRes.ok) {
        const freshAdvance = await refreshRes.json();
        setSelectedAdvance(freshAdvance);
        setHumanReviews(freshAdvance.humanReviews || []);
        setAdvances(prev => prev.map(a => a.id === selectedAdvance.id ? freshAdvance : a));
      }

      setIaFeedback(updatedFeedback);

      toast.success('Revisión guardada en base de datos real', {
        description: `Estado actualizado a: ${finalStatus.toUpperCase()}`,
      });

      // Real notification for human review
      addNotification(
        'success',
        'Revisión humana guardada',
        `Avance "${selectedAdvance.title}" actualizado a estado: ${finalStatus}`
      );

      // Notify the student (they will see it when they load their data)
      setTimeout(() => deriveRealNotifications(), 200);

    } catch (error) {
      // Fallback (consistent with the rule)
      const isHumanOverride = adjustedScore !== undefined && adjustedScore !== null;

      const updatedAdvance: Advance = {
        ...selectedAdvance,
        status: finalStatus,
        humanScore: isHumanOverride ? adjustedScore! : undefined,
        finalScore: isHumanOverride ? adjustedScore! : (selectedAdvance.finalScore ?? selectedAdvance.iaScore),
      };

      setAdvances(prev => prev.map(a => 
        a.id === selectedAdvance.id ? updatedAdvance : a
      ));
      setIaFeedback(updatedFeedback);

      toast.error('Error guardando revisión en backend', {
        description: 'Se actualizó localmente. La persistencia falló.',
      });
    }
  };

  // Re-analyze an existing advance using the real backend
  // Now shows the same beautiful "Analyzing with Grok" circular effect as the demo
  const handleReanalyze = async (advance: Advance) => {
    setSelectedAdvance(advance);
    setCurrentView('review');
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisStage('Preparando re-análisis con Grok...');

    // Beautiful staged progress (same premium effect as upload for students)
    const stages = [
      { progress: 12, stage: 'Cargando documento anterior...' },
      { progress: 28, stage: 'Re-analizando estructura con Grok...' },
      { progress: 47, stage: 'Evaluando mejoras y calidad académica...' },
      { progress: 65, stage: 'Detectando contenido IA nuevamente...' },
      { progress: 82, stage: 'Recalculando puntaje final...' },
      { progress: 100, stage: 'Re-análisis completado' },
    ];

    let currentStage = 0;

    const progressInterval = setInterval(() => {
      if (currentStage < stages.length) {
        const stageInfo = stages[currentStage];
        setAnalysisProgress(stageInfo.progress);
        setAnalysisStage(stageInfo.stage);
        currentStage++;
      } else {
        clearInterval(progressInterval);
      }
    }, 580);

    try {
      const res = await fetch(`/api/advances/${advance.id}/reanalyze`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Error al re-analizar');

      const result = await res.json();
      const freshAdvance = result.advance;

      // Load fresh data
      setSelectedAdvance(freshAdvance);
      setIaFeedback(freshAdvance.academicReport || null);
      setOriginalityReport(freshAdvance.originalityReport || null);
      setCombinedFinalScore(freshAdvance.finalScore || null);

      // Update list
      setAdvances(prev => prev.map(a => a.id === advance.id ? freshAdvance : a));

      // Finish animation nicely
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisProgress(0);
        setAnalysisStage('');

        toast.success('Re-análisis con Grok completado', {
          description: `Nuevo Puntaje Final: ${freshAdvance.finalScore}%`,
        });

        // Real notification for reanalysis
        addNotification(
          'success',
          'Re-análisis completado',
          `Avance actualizado. Nuevo puntaje: ${freshAdvance.finalScore}%`
        );

        setTimeout(() => deriveRealNotifications(), 200);
      }, 800);

    } catch (error) {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setAnalysisStage('');
      toast.error('Error en el re-análisis');
    }
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          setRealStats(await res.json());
        } else {
          const errorText = await res.text().catch(() => '');
          console.error('Error cargando stats desde backend:', res.status, errorText);
        }
      } catch (e) {
        console.error('Error en fetch de stats:', e);
      }
    };
    loadStats();
  }, [advances.length]);

  // Dashboard is now 100% backend-driven when real data exists
  const kpis = realStats?.hasData ? {
    total: realStats.total || 0,
    pending: (realStats.byStatus?.pendiente || 0) + (realStats.byStatus?.analisis_ia || 0),
    reviewed: (realStats.byStatus?.en_revision || 0) + (realStats.byStatus?.observado || 0),
    approved: realStats.byStatus?.aprobado || 0,
    avgIaScore: realStats.avgIaScore || 0,
    avgFinalScore: realStats.avgFinalScore || 0,
    avgTime: locale === 'en' ? '2.4 days' : '2.4 días',
    recentAdvances: realStats.recentAdvances || [],
    statusData: realStats.statusData || [],
    activityByMonth: realStats.activityByMonth || [],
  } : {
    // Minimal fallback only for pure demo with no data in DB yet
    pending: advances.filter(a => a.status === 'pendiente' || a.status === 'analisis_ia').length,
    reviewed: advances.filter(a => a.status === 'en_revision' || a.status === 'observado').length,
    approved: advances.filter(a => a.status === 'aprobado').length,
    avgIaScore: Math.round(advances.filter(a => a.iaScore > 0).reduce((sum, a) => sum + a.iaScore, 0) / Math.max(1, advances.filter(a => a.iaScore > 0).length)) || 0,
    avgFinalScore: Math.round(advances.filter(a => a.finalScore).reduce((sum, a) => sum + (a.finalScore || 0), 0) / Math.max(1, advances.filter(a => a.finalScore).length)) || 0,
    avgTime: locale === 'en' ? '2.4 days' : '2.4 días',
    recentAdvances: advances.slice(0, 5),
    statusData: [],
    activityByMonth: [],
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-violet-600 flex items-center justify-center neon-blue">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-2xl tracking-tighter">{t('app.title')}</div>
                <div className="text-[10px] text-muted-foreground -mt-1.5">{t('app.subtitle')} • {t('app.version')}</div>
              </div>
            </div>
            <div className="ml-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono tracking-[3px]">
              {t('app.poweredBy')}
            </div>

            {/* Auth status indicator */}
            {session ? (
              <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-medium tracking-wide">
                SESIÓN REAL
              </div>
            ) : (
              <div className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-medium tracking-wide">
                MODO DEMO
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            {/* Role + Language Switcher - Hidden when real user is logged in */}
            <div className="flex items-center gap-3">
              {!session && (
                <div className="flex items-center bg-muted rounded-2xl p-1 text-sm">
                  {(['estudiante', 'asesor', 'coordinador', 'admin'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => switchRole(role)}
                      className={`px-5 py-1.5 rounded-xl transition-all font-medium capitalize ${
                        currentUser.role === role 
                          ? 'bg-background shadow-sm text-foreground' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t(`roles.${role}`)}
                    </button>
                  ))}
                </div>
              )}
              <LanguageSwitcher />
            </div>

            {/* Search + Status Filter (real backend) */}
            <div className="flex items-center gap-3">
              <div className="relative w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {isLoadingList && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                disabled={isLoadingList}
                className="px-4 py-2.5 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="analisis_ia">En análisis</option>
                <option value="en_revision">En revisión</option>
                <option value="observado">Observado</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 hover:bg-muted rounded-2xl transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-96 glass rounded-3xl shadow-2xl border border-border p-4 z-50"
                  >
                    <div className="flex justify-between items-center mb-4 px-2">
                      <div className="font-semibold">Notificaciones</div>
                      <button 
                        onClick={() => setNotifications(prev => prev.map(n => ({...n, read: true})))}
                        className="text-xs text-primary hover:underline"
                      >
                        Marcar todas como leídas
                      </button>
                    </div>
                    <div className="space-y-2 max-h-[420px] overflow-auto pr-2">
                      {notifications.map((notif, idx) => (
                        <div key={idx} className="flex gap-3 p-3 rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notif.type === 'success' ? 'bg-emerald-500' : notif.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{notif.title}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">{notif.message}</div>
                            <div className="text-[10px] text-muted-foreground mt-1">{notif.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-3 hover:bg-muted rounded-2xl transition-all active:scale-95"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User Profile - Real session aware */}
            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <div className="text-right">
                <div className="font-semibold text-sm">{currentUser.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{currentUser.role}</div>
                {currentUser.orcid && (
                  <a 
                    href={`https://orcid.org/${currentUser.orcid}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-400 font-mono mt-0.5 hover:underline flex items-center gap-1 justify-end"
                    title="Ver perfil en ORCID"
                  >
                    ORCID: {currentUser.orcid}
                    <span className="text-[9px]">↗</span>
                  </a>
                )}
              </div>

              {/* Avatar with edit icon */}
              <div className="relative group">
                <div className="w-10 h-10 rounded-2xl overflow-hidden ring-2 ring-primary/20">
                  <img 
                    src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}&background=3b82f6&color=fff`} 
                    alt={currentUser.name} 
                    className="object-cover w-full h-full" 
                  />
                </div>
                
                {/* Edit avatar icon */}
                <label 
                  className="absolute -bottom-1 -right-1 bg-background border border-border rounded-full p-1 cursor-pointer hover:bg-primary hover:text-white transition-colors shadow-sm"
                  title="Cambiar foto de perfil"
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        const base64 = event.target?.result as string;

                        try {
                          await fetch(`/api/users/${currentUser.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ avatar: base64 }),
                          });

                          // Update locally so it shows immediately
                          setCurrentUser(prev => ({ ...prev, avatar: base64 }));
                          toast.success('Foto de perfil actualizada');
                        } catch {
                          toast.error('No se pudo guardar la foto');
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2 2 2 0 012 2m0 0a2 2 0 01-2 2m2-2v9a2 2 0 01-2 2m10-9a2 2 0 01-2-2m2 2a2 2 0 01-2 2m2-2v9a2 2 0 01-2 2" />
                  </svg>
                </label>
              </div>

              {session ? (
                <button 
                  onClick={() => {
                    signOut({ callbackUrl: '/login' });
                    // Reset demo user to default student on real logout
                    setCurrentUser(MOCK_USER);
                  }}
                  className="p-2 hover:bg-destructive/10 text-destructive rounded-xl transition-colors"
                  title="Cerrar sesión real"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={() => toast.info('Sesión cerrada (demo)')}
                  className="p-2 hover:bg-destructive/10 text-destructive rounded-xl transition-colors"
                  title="Cerrar demo"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-20 h-screen">
        {/* Sidebar */}
        <div className="w-72 border-r border-border bg-card/50 backdrop-blur-xl flex-shrink-0 hidden lg:flex flex-col">
          <div className="p-8">
            <div className="text-xs uppercase tracking-[2px] text-muted-foreground mb-4 px-3">{t('nav.dashboard').toUpperCase().replace('DASHBOARD', 'MAIN MODULES')}</div>
            
            <div className="space-y-1">
              {[
                { id: 'dashboard', label: t('nav.dashboard'), icon: BarChart3, roles: ['estudiante','asesor','coordinador','admin'] },
                // All roles can upload and self-analyze documents
                { id: 'upload', label: t('nav.upload'), icon: Upload, roles: ['estudiante','asesor','coordinador','admin'] },
                // Only those who can perform human reviews (asesores, coordinadores, admins)
                { id: 'review', label: t('nav.review'), icon: Eye, roles: ['asesor','coordinador','admin'] },
                // Asesores can now also configure their own patterns (as requested)
                { id: 'pattern', label: t('nav.pattern'), icon: FileText, roles: ['asesor','coordinador','admin'] },
                // Asesores see their assigned students. Coordinadores see grouped view.
                { id: 'mis-estudiantes', label: 'Mis Estudiantes', icon: Users, roles: ['asesor', 'coordinador'] },
                { id: 'bulk', label: t('nav.bulk'), icon: Users, roles: ['asesor', 'coordinador','admin'] },
                { id: 'reports', label: t('nav.reports'), icon: TrendingUp, roles: ['asesor','coordinador','admin'] },
                { id: 'users', label: t('nav.users'), icon: Users, roles: ['admin'] },
              ].filter(item => item.roles.includes(currentUser.role)).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as any)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-left transition-all group ${
                    currentView === item.id 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${currentView === item.id ? '' : 'text-muted-foreground'}`} />
                  <span className="font-medium">{item.label}</span>
                  {item.id === 'review' && advances.filter(a => a.status === 'en_revision').length > 0 && (
                    <div className="ml-auto bg-white/20 text-xs px-2 py-0.5 rounded-full">
                      {advances.filter(a => a.status === 'en_revision').length}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto p-8 border-t border-border">
            <div className="glass rounded-3xl p-5 text-xs">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="font-mono text-emerald-500">MOTOR ACADÉMICO</span>
              </div>
              <div className="text-muted-foreground leading-snug">
                Grok-4 (xAI) + Simulador Premium<br />
                + Detección de Originalidad<br />
                Fallback automático garantizado
              </div>
              <div className="mt-4 text-[10px] text-muted-foreground/70">
                {t('common.lastSync')}: {format(new Date(), 'HH:mm', { locale: es })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-[1480px] mx-auto p-8 lg:p-12">
            
            {/* Header dinámico */}
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="flex items-center gap-4">
                  <h1 className="text-5xl font-bold tracking-tighter">
                    {currentView === 'dashboard' && t('dashboard.title')}
                    {currentView === 'upload' && t('upload.title')}
                    {currentView === 'review' && t('review.title')}
                    {currentView === 'pattern' && t('pattern.title')}
                    {currentView === 'bulk' && (currentUser.role === 'asesor' ? 'Revisión por Lotes - Mis Estudiantes' : t('bulk.title'))}
                    {currentView === 'reports' && t('reports.title')}
                    {currentView === 'users' && t('users.title')}
                    {currentView === 'mis-estudiantes' && (currentUser.role === 'coordinador' ? 'Estudiantes por Asesor' : 'Mis Estudiantes')}
                  </h1>
                  <div className="ai-badge text-sm px-4 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30">
                    {t('common.analyze')}
                  </div>
                </div>
                <p className="text-xl text-muted-foreground mt-2">
                  {currentView === 'dashboard' && currentUser.role === 'asesor' && 'Avances de tus estudiantes asignados'}
                  {currentView === 'dashboard' && currentUser.role !== 'asesor' && t('dashboard.welcome')}
                  {currentView === 'review' && 'Evaluación automática + validación humana'}
                  {currentView === 'pattern' && 'Configura la estructura y rúbricas para tus estudiantes'}
                  {currentView === 'mis-estudiantes' && (currentUser.role === 'coordinador' ? 'Vista consolidada de todos los equipos' : 'Gestiona y revisa los avances de tus estudiantes asignados')}
                </p>
              </div>

              {currentView === 'dashboard' && currentUser.role === 'estudiante' && (
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-2xl font-semibold shadow-xl shadow-primary/25 active:scale-[0.985] transition-all"
                >
                  <Upload className="w-5 h-5" />
                  Subir Nuevo Avance
                </button>
              )}

              {/* Student: Show their advisor's ORCID visibly */}
              {currentUser.role === 'estudiante' && currentUser.advisorId && (
                <div className="mt-4 p-4 bg-muted/30 rounded-2xl border border-border/50 flex items-center gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Tu Asesor</div>
                    <div className="font-medium">
                      {users.find((u: any) => u.id === currentUser.advisorId)?.name || 'Asesor asignado'}
                    </div>
                  </div>
                  {users.find((u: any) => u.id === currentUser.advisorId)?.orcid && (
                    <div className="ml-auto text-right">
                      <div className="text-xs text-muted-foreground">ORCID</div>
                      <div className="font-mono text-sm text-blue-400">
                        {users.find((u: any) => u.id === currentUser.advisorId)?.orcid}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Filter summary bar */}
            {(searchTerm || filterStatus !== 'todos') && (
              <div className="flex items-center justify-between mb-4 px-1 text-sm">
                <div className="text-muted-foreground">
                  {advances.length} resultados
                  {searchTerm && <span> para “{searchTerm}”</span>}
                  {filterStatus !== 'todos' && <span> · Estado: {filterStatus}</span>}
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('todos');
                  }}
                  className="text-primary hover:underline text-xs"
                >
                  Limpiar filtros
                </button>
              </div>
            )}

            {/* Dynamic Content */}
            <AnimatePresence mode="wait">
              {currentView === 'dashboard' && (
                <Dashboard 
                  user={currentUser} 
                  advances={filteredAdvances} 
                  kpis={kpis} 
                  onReview={async (adv) => {
                    const isStudent = currentUser.role === 'estudiante';

                    // Students can view their IA + Originality results, but not enter human review mode
                    if (isStudent) {
                      setIsAnalyzing(true);
                      setAnalysisStage('Cargando resultados de IA...');

                      try {
                        const res = await fetch(`/api/advances/${adv.id}`);
                        if (res.ok) {
                          const fullAdvance = await res.json();
                          setSelectedAdvance(fullAdvance);
                          if (fullAdvance.academicReport) setIaFeedback(fullAdvance.academicReport);
                          if (fullAdvance.originalityReport) setOriginalityReport(fullAdvance.originalityReport);
                          setHumanReviews(fullAdvance.humanReviews || []);
                          setCombinedFinalScore(fullAdvance.finalScore || null);
                        } else {
                          setSelectedAdvance(adv);
                        }
                      } catch {
                        setSelectedAdvance(adv);
                      } finally {
                        setIsAnalyzing(false);
                        // For students we still use 'review' view but ReviewPanel will hide the humana tab
                        setCurrentView('review');
                      }
                      return;
                    }

                    // For reviewers (asesor, coordinador)
                    setCurrentView('review');
                    setIsAnalyzing(true);
                    setAnalysisStage('Cargando datos reales desde el backend...');

                    try {
                      const res = await fetch(`/api/advances/${adv.id}`);
                      if (res.ok) {
                        const fullAdvance = await res.json();
                        setSelectedAdvance(fullAdvance);

                        if (fullAdvance.academicReport) {
                          setIaFeedback(fullAdvance.academicReport);
                        }
                        if (fullAdvance.originalityReport) {
                          setOriginalityReport(fullAdvance.originalityReport);
                        }
                        setHumanReviews(fullAdvance.humanReviews || []);
                        setCombinedFinalScore(fullAdvance.finalScore || null);
                      } else {
                        setSelectedAdvance(adv);
                      }
                    } catch (e) {
                      setSelectedAdvance(adv);
                    } finally {
                      setIsAnalyzing(false);
                    }
                  }}
                  onUpload={() => setShowUploadModal(true)}
                />
              )}

              {currentView === 'review' && selectedAdvance && (
                <ReviewPanel 
                  advance={selectedAdvance}
                  iaFeedback={iaFeedback}
                  originalityReport={originalityReport}
                  combinedFinalScore={combinedFinalScore}
                  humanReviews={humanReviews}
                  selectedSuspiciousId={selectedSuspiciousId}
                  onSelectSuspicious={(id) => setSelectedSuspiciousId(id)}
                  isAnalyzing={isAnalyzing}
                  analysisProgress={analysisProgress}
                  analysisStage={analysisStage}
                  onSaveReview={handleSaveReview}
                  onReanalyze={() => handleReanalyze(selectedAdvance)}
                  pattern={activePattern}
                  userRole={currentUser.role}
                />
              )}

              {/* Empty state for "Revisión Inteligente" when no advance is selected */}
              {currentView === 'review' && !selectedAdvance && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-7xl mb-8 opacity-40">🧠</div>
                  <h2 className="text-4xl font-semibold tracking-tight mb-4">Revisión Inteligente</h2>
                  <p className="text-2xl text-muted-foreground max-w-lg mb-10">
                    Selecciona un avance desde el Dashboard o "Mis Estudiantes" para comenzar la revisión.
                  </p>
                  <button
                    onClick={() => setCurrentView(currentUser.role === 'asesor' ? 'mis-estudiantes' : 'dashboard')}
                    className="px-8 py-4 bg-primary text-white rounded-2xl font-semibold"
                  >
                    Ir a {currentUser.role === 'asesor' ? 'Mis Estudiantes' : 'Dashboard'}
                  </button>
                </div>
              )}

              {currentView === 'pattern' && (
                <PatternConfig 
                  patterns={visiblePatterns}
                  currentUser={currentUser}
                  onUpdate={(updatedPattern) => {
                    setPatterns(prev => prev.map(p => p.id === updatedPattern.id ? updatedPattern : p));
                    toast.success('Patrón actualizado');
                  }}
                  onCreateNew={(newPattern) => {
                    // Automatically assign ownership to the current advisor
                    const ownedPattern = {
                      ...newPattern,
                      createdBy: currentUser.id,
                      advisorId: currentUser.id,
                    };
                    setPatterns(prev => [...prev, ownedPattern]);
                    toast.success('Nuevo patrón creado', {
                      description: 'Este patrón estará disponible para tus estudiantes',
                    });
                  }}
                />
              )}

              {/* Mis Estudiantes - Visible only for Asesores - Enhanced with real data */}
              {currentView === 'mis-estudiantes' && currentUser.role === 'asesor' && (
                <div className="max-w-6xl mx-auto">
                  <div className="mb-8 flex items-end justify-between">
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight">Mis Estudiantes</h2>
                      <p className="text-muted-foreground mt-2">
                        Estudiantes asignados a ti. Puedes ver sus avances y realizar revisiones humanas.
                      </p>
                      {currentUser.orcid && (
                        <div className="mt-2 text-xs font-mono text-emerald-400">
                          Tu ORCID: {currentUser.orcid}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        // Show unassigned students for manual assignment
                        const unassigned = MOCK_STUDENTS.filter(s => !s.advisorId || s.advisorId !== currentUser.id);
                        if (unassigned.length === 0) {
                          toast.info('No hay estudiantes sin asignar en este momento.');
                          return;
                        }
                        // Simple prompt for demo - in real would be a nice modal
                        const selected = prompt(`Estudiantes sin asignar:\n${unassigned.map((s, i) => `${i+1}. ${s.name}`).join('\n')}\n\nIngresa el número del estudiante a asignar:`);
                        if (selected) {
                          const index = parseInt(selected) - 1;
                          if (unassigned[index]) {
                            // Simulate assignment (in real app this would call an API)
                            unassigned[index].advisorId = currentUser.id;
                            toast.success(`Estudiante ${unassigned[index].name} asignado a ti.`);
                            // Force re-render by updating a state if needed
                          }
                        }
                      }}
                      className="px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-2xl font-medium flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Asignar estudiante manualmente
                    </button>
                  </div>

                  <div className="glass rounded-3xl p-8">
                    {(() => {
                      // Merge real registered students (myAdvisorStudents) + advance data
                      const advanceMap = new Map();
                      advances.forEach(adv => {
                        if (adv.advisorId === currentUser.id || adv.advisor === currentUser.name) {
                          const key = adv.studentId;
                          if (!advanceMap.has(key)) {
                            advanceMap.set(key, { count: 0, lastScore: null, latestDate: null, title: '' });
                          }
                          const entry = advanceMap.get(key);
                          entry.count++;
                          if (!entry.latestDate || new Date(adv.uploadDate) > new Date(entry.latestDate)) {
                            entry.latestDate = adv.uploadDate;
                            entry.lastScore = adv.finalScore ?? adv.iaScore;
                            entry.title = adv.title;
                          }
                        }
                      });

                      // Start with students who explicitly chose this advisor at registration
                      let studentsToShow = myAdvisorStudents.length > 0 
                        ? myAdvisorStudents.map((s: any) => ({
                            id: s.id,
                            name: s.name,
                            email: s.email,
                            advancesCount: advanceMap.get(s.id)?.count || 0,
                            lastScore: advanceMap.get(s.id)?.lastScore || null,
                          }))
                        : [];

                      // Fallback: if no registered students yet, derive from advances (old behavior)
                      if (studentsToShow.length === 0) {
                        const derived = new Map();
                        advances.forEach(adv => {
                          if (adv.advisorId === currentUser.id || adv.advisor === currentUser.name) {
                            if (!derived.has(adv.studentId)) {
                              derived.set(adv.studentId, {
                                id: adv.studentId,
                                name: adv.studentName,
                                email: '',
                                advancesCount: 0,
                                lastScore: null,
                              });
                            }
                            const st = derived.get(adv.studentId);
                            st.advancesCount++;
                            if (st.lastScore === null) st.lastScore = adv.finalScore ?? adv.iaScore;
                          }
                        });
                        studentsToShow = Array.from(derived.values());
                      }

                      if (studentsToShow.length === 0) {
                        return (
                          <div className="text-center py-12 text-muted-foreground">
                            Aún no tienes estudiantes asignados.
                            <br />
                            Cuando un estudiante te elija como asesor al registrarse, aparecerá aquí automáticamente.
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {studentsToShow.map((student: any) => (
                            <div key={student.id} className="flex items-center justify-between p-5 bg-muted/30 rounded-2xl hover:bg-muted/50 transition-colors">
                              <div className="flex-1">
                                <div className="font-semibold text-lg">{student.name}</div>
                                <div className="text-sm text-muted-foreground">{student.email || 'Estudiante asignado a ti'}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {student.advancesCount} avance{student.advancesCount !== 1 ? 's' : ''} subido{student.advancesCount !== 1 ? 's' : ''}
                                </div>
                              </div>

                              <div className="flex items-center gap-6">
                                {student.lastScore !== null && (
                                  <div className="text-right">
                                    <div className="text-xs text-muted-foreground">Último puntaje</div>
                                    <div className="text-2xl font-bold tabular-nums text-primary">{student.lastScore}</div>
                                  </div>
                                )}

                                <button
                                  onClick={() => {
                                    setCurrentView('dashboard');
                                    toast.info(`Mostrando avances de ${student.name}`);
                                  }}
                                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 active:scale-[0.985]"
                                >
                                  Ver sus Avances
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Vista Agrupada para Coordinador: Estudiantes por Asesor */}
              {currentView === 'mis-estudiantes' && currentUser.role === 'coordinador' && (
                <div className="max-w-6xl mx-auto">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold tracking-tight">Estudiantes por Asesor</h2>
                    <p className="text-muted-foreground mt-2">
                      Vista agrupada de todos los estudiantes por su asesor asignado.
                    </p>
                  </div>

                  <div className="glass rounded-3xl p-8 space-y-8">
                    {(() => {
                      // Build a lookup map from user id to name (for resolving advisorId)
                      const advisorNameMap = new Map();
                      users.forEach((u: any) => {
                        if (u.role === 'asesor' || u.role === 'coordinador') {
                          advisorNameMap.set(u.id, u.name);
                        }
                      });

                      const grouped = new Map();
                      advances.forEach(adv => {
                        // Resolve advisorId to actual name if possible
                        const resolvedName = adv.advisorId 
                          ? (advisorNameMap.get(adv.advisorId) || adv.advisor || adv.advisorId)
                          : (adv.advisor || 'Sin asignar');

                        const key = resolvedName;
                        if (!grouped.has(key)) grouped.set(key, []);
                        grouped.get(key).push(adv);
                      });

                      return Array.from(grouped.entries()).map(([advisor, advs]) => (
                        <div key={advisor}>
                          <div className="font-semibold text-lg mb-3 flex items-center gap-2">
                            Asesor: <span className="text-primary">{advisor}</span>
                            <span className="text-sm font-normal text-muted-foreground">({advs.length} avances)</span>
                          </div>
                          <div className="grid gap-3 pl-4">
                            {advs.map((adv: any) => (
                              <div key={adv.id} className="flex justify-between items-center p-4 bg-muted/20 rounded-2xl text-sm">
                                <div>
                                  <span className="font-medium">{adv.studentName}</span> — {adv.title}
                                </div>
                                <div className="text-muted-foreground">
                                  Tu nota final: {adv.finalScore ?? adv.iaScore ?? '—'}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {currentView === 'bulk' && (
                (() => {
                  const bulkAdvances = advances.filter(a => {
                    // Asesores solo ven avances de sus propios estudiantes
                    if (currentUser.role === 'asesor') {
                      return a.advisorId === currentUser.id;
                    }
                    // Coordinadores y admins ven los que están pendientes de análisis
                    return a.status === 'pendiente' || a.status === 'analisis_ia';
                  });

                  if (bulkAdvances.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-6xl mb-6 opacity-40">📋</div>
                        <h3 className="text-2xl font-semibold mb-3">No hay avances para revisar en lote</h3>
                        <p className="text-muted-foreground max-w-md mb-6">
                          {currentUser.role === 'asesor' 
                            ? 'Aún no tienes estudiantes con avances pendientes de análisis.'
                            : 'No hay avances pendientes de análisis en este momento.'}
                        </p>
                        <button 
                          onClick={() => setCurrentView(currentUser.role === 'asesor' ? 'mis-estudiantes' : 'dashboard')}
                          className="px-6 py-3 bg-primary text-white rounded-xl font-medium"
                        >
                          {currentUser.role === 'asesor' ? 'Ir a Mis Estudiantes' : 'Volver al Dashboard'}
                        </button>
                      </div>
                    );
                  }

                  return (
                    <BulkReview 
                      advances={bulkAdvances}
                      onProcessBatch={(selectedIds) => {
                        // Procesamiento real llamando al endpoint de reanálisis
                        const processBatch = async () => {
                          let processed = 0;
                          for (const id of selectedIds) {
                            try {
                              const res = await fetch(`/api/advances/${id}/reanalyze`, { method: 'POST' });
                              if (res.ok) processed++;
                            } catch (e) {
                              console.error('Error procesando lote:', id);
                            }
                          }
                          await loadRealAdvances(true);
                          return processed;
                        };

                        toast.promise(
                          processBatch(),
                          {
                            loading: `Procesando ${selectedIds.length} avances con Grok-IA...`,
                            success: (count) => `Se procesaron ${count} de ${selectedIds.length} avances exitosamente`,
                            error: 'Error en procesamiento masivo',
                          }
                        );
                      }}
                      title={currentUser.role === 'asesor' ? 'Revisión por Lotes - Mis Estudiantes' : undefined}
                    />
                  );
                })()
              )}

              {currentView === 'reports' && (
                <Reports advances={advances} pattern={activePattern} />
              )}

              {currentView === 'users' && (
                <UserManagement 
                  users={users} 
                  onAssignAdvisor={async (studentId, advisorId) => {
                    try {
                      // Update the student's advisorId on the User model (primary relationship)
                      const res = await fetch(`/api/users/${studentId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ advisorId: advisorId || null }),
                      });
                      if (res.ok) {
                        toast.success('Asignación de asesor actualizada');
                        // Refresh the users list so the admin sees the change immediately
                        loadAllUsers();
                      } else {
                        toast.error('Error al asignar asesor');
                      }
                    } catch {
                      toast.error('Error de conexión');
                    }
                  }}
                  onUpdateOrcid={async (userId, newOrcid) => {
                    try {
                      const res = await fetch(`/api/users/${userId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orcid: newOrcid }),
                      });
                      if (res.ok) {
                        // Refresh users list
                        loadAllUsers();
                      } else {
                        throw new Error('Error al actualizar');
                      }
                    } catch {
                      throw new Error('Error de conexión');
                    }
                  }}
                />
              )}

              {/* Dedicated Upload View - Now has actual content */}
              {currentView === 'upload' && (
                <div className="max-w-3xl mx-auto">
                  <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/10 mb-6">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight mb-3">Cargar Nuevo Avance</h2>
                    <p className="text-xl text-muted-foreground max-w-md mx-auto">
                      Sube tu documento (PDF o DOCX) para que Grok IA lo analice automáticamente.
                    </p>
                  </div>

                  <div 
                    onClick={() => setShowUploadModal(true)}
                    className="group border-2 border-dashed border-border hover:border-primary/50 rounded-3xl p-16 text-center cursor-pointer transition-all bg-card/50 hover:bg-card"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-3xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-6 transition-colors">
                        <Upload className="w-10 h-10 text-primary" />
                      </div>
                      
                      <div className="text-2xl font-semibold mb-2">Arrastra tu documento aquí</div>
                      <div className="text-muted-foreground mb-6">o haz clic para seleccionar archivo</div>
                      
                      <div className="text-sm text-muted-foreground">
                        Formatos soportados: <span className="font-medium">PDF, DOCX</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 text-center text-sm text-muted-foreground">
                    El análisis con Grok IA incluye evaluación de calidad académica y detección de contenido generado por IA.
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Load More + Pagination info */}
            <div className="flex flex-col items-center gap-3 mt-8">
              <div className="text-xs text-muted-foreground">
                Mostrando {advances.length} avances
              </div>

              {hasMore && !isLoadingList && (
                <button
                  onClick={() => {
                    setCurrentPage(p => p + 1);
                    loadRealAdvances(false);
                  }}
                  className="px-8 py-3 border border-border rounded-2xl hover:bg-muted transition-colors flex items-center gap-2 active:scale-[0.985]"
                >
                  Cargar más avances
                </button>
              )}

              {isLoadingList && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Cargando...
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
        onUpload={handleUpload}
        currentUser={currentUser}
      />

      {/* Floating Action Button for mobile */}
      <div className="lg:hidden fixed bottom-8 right-8 z-50">
        <button 
          onClick={() => setShowUploadModal(true)}
          className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center shadow-2xl neon-blue active:scale-95 transition-transform"
        >
          <Upload className="w-7 h-7 text-white" />
        </button>
      </div>
    </div>
  );
}
