# PRONT Revisor - Arquitectura del Proyecto

**Fecha de actualización:** 2026

## Estado Actual (Demo Avanzado)

- **Frontend**: Next.js 15 + React 19 (App Router)
- **Estado**: Principalmente client-side (todo en `app/page.tsx`)
- **Análisis**:
  - Academic Quality → `lib/grok-analyzer.ts`
  - Originality + AI Detection → `lib/originality-analyzer.ts`
- **Extracción real de texto**: `app/api/extract-text/route.ts` (única ruta API por ahora)
- **Fortalezas**: Excelente UX, simuladores muy potentes, flujo humano+IA maduro.
- **Debilidades**: Lógica muy acoplada en el componente principal, difícil de testear y extender.

## Arquitectura Objetivo (Recomendada)

Basada en el skill `pront-revisor` y el `PRODUCTION-MIGRATION-PLAN.md`:

### Capas propuestas

1. **UI Layer** (Components + Pages)
2. **Orchestration Layer** (`lib/analyzers/`)
   - `ThesisAnalyzer` interface (pluggable)
   - `AnalysisOrchestrator`
3. **Domain Analyzers** (implementaciones concretas)
   - Academic Quality
   - Originality / Plagiarism / AI Content
   - Futuro: Real Grok + RAG, etc.
4. **Infrastructure / API Layer**
   - Next.js API Routes (temporal)
   - Futuro: NestJS backend separado
5. **Data Layer** (persistencia, storage)

### Principios

- Los analizadores deben ser **intercambiables**.
- El orquestador centraliza la combinación de resultados y el cálculo del score combinado.
- La página principal (`page.tsx`) debe ser lo más delgada posible (orquestación de UI + estado).
- Mantener el simulador actual como **fallback** de alta calidad incluso después de integrar APIs reales.

## Progreso Actual (2026) - Opción A: Backend Real dentro de Next.js

**Avances significativos hacia backend real:**

- [x] Prisma + SQLite (fácil de migrar a Postgres) con esquema completo (User, Advance, AcademicReport, OriginalityReport + relaciones)
- [x] API real `/api/advances` que recibe archivos, extrae texto, ejecuta ambos analizadores y persiste todo en base de datos
- [x] Endpoint dinámico `/api/advances/[id]` para obtener reportes completos
- [x] Frontend actualizado: upload ahora llama al backend real y usa los datos persistidos
- [x] Carga inicial de avances desde la base de datos real
- [x] `finalScore` combinado se guarda y devuelve desde el backend

**Arquitectura de análisis (ya sólida):**
- [x] Carpeta `lib/analyzers/` con interfaz formal `ThesisAnalyzer`
- [x] Registry + Orchestrator
- [x] Analizadores como clases

**Debilidades actuales:**
- Sigue siendo un monorepo Next.js (BFF). No hay NestJS separado todavía.
- Autenticación real pendiente.
- Almacenamiento de archivos sigue siendo en memoria / texto extraído (no S3 todavía).
- Los analizadores siguen siendo simuladores de alta calidad (planeado hasta tener Copyleaks real).

### Progreso en migración de flujos al backend (actualizado)
- [x] Carga de avances desde base de datos real al iniciar la aplicación
- [x] Apertura de revisión carga datos frescos desde `/api/advances/[id]`
- [x] Soporte de re-análisis completo vía `POST /api/advances/[id]/reanalyze`
- [x] Generación de Acta PDF oficial desde el servidor (`/api/advances/[id]/report`) usando datos persistidos
- [x] Persistencia real de revisiones humanas (`HumanReview` + endpoint `/api/advances/[id]/review`)
- [x] Almacenamiento real de archivos en `./uploads/`
- [x] Autenticación profesional con Auth.js v5 + role-based middleware
- [x] Listado de avances desde backend con paginación, búsqueda, filtros por estado y control de acceso por rol
- [x] Dashboard consume estadísticas reales vía /api/stats
- [x] "Cargar más" (paginación real) implementado en la lista de avances
- [x] Relación advisor-estudiante implementada (advisorId + filtrado correcto)
- [x] Filtros y búsqueda con debounce llamando al backend real
- [x] Dashboard 100% backend-driven (KPIs, statusData, activityByMonth y recentAdvances vienen de /api/stats)
- [x] Flujo completo de revisiones humanas con historial (múltiples revisiones por avance + UI de historial)
- [x] Asignación real de asesores cableada en UserManagement
- [x] Almacenamiento de archivos con creación automática de carpeta

### Hitos alcanzados (actualizado 2026)
- [x] Autenticación profesional con Auth.js v5 + RBAC completo + advisorId
- [x] Persistencia real de revisiones humanas y reportes
- [x] Almacenamiento real de archivos en `./uploads/`
- [x] Arquitectura de analizadores pluggables (ThesisAnalyzer + Registry + Orchestrator)
- [x] **Integración real con Grok-4 (xAI)** — ver `grok-real-analyzer.ts` (con fallback al simulador premium)

### Próximos pasos recomendados (Opción A)
- Mejorar reportes PDF con insights de Grok real
- Preparar reemplazo del originality-analyzer por Copyleaks / Originality.ai real
- Evaluar extracción a NestJS cuando el volumen lo requiera

## Próximos Pasos Recomendados

1. Extraer custom hooks (`useAnalysis`, `useDocumentUpload`, etc.)
2. Mover la lógica de estado compleja fuera de `page.tsx`
3. Hacer que cada analizador sea una clase que implemente la interfaz
4. Preparar el camino hacia backend real (según el plan de migración)

---

Este documento debe mantenerse actualizado a medida que evolucionamos la arquitectura.