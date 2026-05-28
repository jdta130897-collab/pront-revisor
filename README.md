# PRONT Revisor v4.8

**Sistema Inteligente de Revisión y Evaluación de Avances de Tesis Universitarias**

Plataforma en desarrollo con Next.js 15 + React 19 + TypeScript + Tailwind + Prisma para la gestión académica de tesis.

**Enfoque actual (Opción A):** Backend real funcional dentro de Next.js + analizadores de alta calidad. Se está migrando progresivamente toda la lógica al servidor con persistencia real en base de datos.

## ✨ Estado Actual

- **Backend Real**: Prisma + SQLite (fácil migración a PostgreSQL). Análisis completo (calidad académica + originalidad/plagio + IA) ejecutándose en el servidor y persistiendo resultados.
- **Diseño Futurista**: Interfaz glassmorphism, modo oscuro/claro, animaciones fluidas con Framer Motion, métricas en tiempo real.
- **Todo en Español**: Interfaz, feedback y documentación completamente en español.
- **Roles Granulares**: Estudiante, Asesor, Coordinador y Administrador (demo vía selector).
- **Análisis Dual Real**: 
  - Calidad Académica (estructura, coherencia, citas, metodología, etc.)
  - Originalidad y Contenido IA (similitud + probabilidad de IA generativa)
- **Puntaje Final Combinado**: Promedio ponderado (60% calidad académica + 25% originalidad + 15% autenticidad IA).
- **Reportes Profesionales**: Exportación a PDF con actas oficiales (tanto cliente como generadas desde servidor con datos reales).
- **Arquitectura en Evolución**: Capa de Analyzers pluggable (`lib/analyzers/`) + Registry + Orchestrator. Preparado para escalar.

**Próximos hitos inmediatos (Opción A):**
- Persistencia completa de revisiones humanas
- Autenticación real
- [x] Listado de avances desde backend con paginación, búsqueda, filtros y RBAC por rol
- [x] Dashboard 100% backend-driven (todos los KPIs, gráficos y datos recientes vienen de /api/stats)
- [x] "Cargar más" + paginación real
- [x] Flujo completo de revisiones humanas con historial (múltiples revisiones + UI de historial)
- [x] Relación advisor-estudiante + asignación real desde UI
- [x] Despliegue completo en Railway (base de datos + archivos persistentes con Volume)
- Preparación para separación hacia NestJS backend

## 🚀 Instalación Rápida

```bash
cd pront-revisor
npm install
npm run dev:stable
```

Abre http://localhost:3000

**Credenciales de demo**: Cualquier rol funciona (usa el selector superior).

## 🚀 Despliegue en Railway (Producción - TODO en Railway)

Todo el proyecto se despliega en **Railway** (base de datos + backend + archivos persistentes).

### 1. Base de datos (PostgreSQL en Railway)

Ya tienes configurado PostgreSQL en Railway con estas variables en `.env.local`:
- `DATABASE_URL` → Conexión pública
- `DIRECT_URL` → Conexión interna (para migraciones)

### 2. Almacenamiento de archivos persistentes (IMPORTANTE)

En Railway el sistema de archivos es **efímero**. Si no usas un Volume, los archivos subidos (PDFs, DOCX, etc.) se perderán en cada deploy o reinicio.

#### Cómo crear el Volume para archivos:

1. En Railway, ve a tu servicio de la aplicación (el que ejecuta Next.js).
2. En el menú lateral haz clic en **Volumes**.
3. Haz clic en **Add Volume**.
4. Configura:
   - **Name**: `uploads` (o el nombre que quieras)
   - **Size**: Empieza con 1 GB o 2 GB
   - **Mount Path**: `/data/uploads`  ← (usa exactamente este path)
5. Guarda.

6. Ahora ve a **Variables** de ese mismo servicio y agrega esta variable de entorno:

```env
UPLOADS_DIR=/data/uploads
```

Con esto, todos los archivos que se suban en producción se guardarán de forma persistente en el Volume.

> Nota: En desarrollo local sigue usando la carpeta `./uploads` automáticamente (no necesitas esta variable en local).

### 3. Variables de entorno requeridas en Railway

Configura al menos estas variables en tu servicio:

- `DATABASE_URL` (la pública de Railway)
- `DIRECT_URL` (la interna de Railway)
- `NEXTAUTH_URL` → `https://tu-proyecto.up.railway.app`
- `NEXTAUTH_SECRET` → (genera una fuerte: `openssl rand -base64 32`)
- `XAI_API_KEY` y/o `GEMINI_API_KEY`
- `UPLOADS_DIR=/data/uploads`

### 4. Build y Deploy

- **Build Command**: `npm run build` (ya incluye `prisma generate`)
- **Start Command**: `npm start`
- Conecta tu repositorio de GitHub en Railway para deploys automáticos.

### 5. Migraciones de Prisma en producción

Después del primer deploy, ejecuta manualmente:

```bash
npx prisma migrate deploy
```

---

**¡Listo!** Con el Volume correctamente montado en `/data/uploads` y la variable `UPLOADS_DIR`, los archivos subidos por los estudiantes se guardarán de forma persistente aunque reinicies o redeployes el servicio.

## 🛠️ Stack Tecnológico (2026) - En Desarrollo

**Frontend:**
- Next.js 15 (App Router + Turbo)
- React 19 + TypeScript 5.8
- Tailwind CSS 4 + Framer Motion
- Recharts + Sonner (toasts)
- jsPDF para reportes (cliente + servidor)

**Backend Real (desplegado en Railway):**
- Prisma + PostgreSQL en Railway (con Volume para archivos persistentes)
- API Routes reales para upload, análisis y reportes
- Análisis completo ejecutado en servidor con persistencia

**Análisis (Alta calidad, actualmente basado en reglas + IA real):**
- Calidad Académica (estructura, coherencia, citas, metodología, etc.)
- Originalidad + Detección de Contenido IA (con penalización fuerte en la nota final)
- Score combinado ponderado (con penalización por alto contenido IA o similitud)

**Preparado para (según plan de migración):**
- NestJS backend separado
- Integración real con Copyleaks / Originality.ai
- BullMQ + Redis para procesamiento asíncrono
- Autenticación con NextAuth / JWT
- pgvector + embeddings reales

## 📁 Estructura del Proyecto (Actual)

```
pront-revisor/
├── app/
│   ├── api/
│   │   └── advances/            # Backend real (upload, análisis, reportes)
│   │       ├── route.ts
│   │       └── [id]/
│   ├── layout.tsx
│   ├── page.tsx                 # Orquestador principal (migrando a backend)
│   └── globals.css
├── components/
│   ├── Dashboard.tsx
│   ├── ReviewPanel.tsx          # ❤️ El corazón del sistema
│   ├── UploadModal.tsx
│   └── ...
├── lib/
│   ├── analyzers/               # Capa de analizadores pluggable (nueva arquitectura)
│   │   ├── types.ts
│   │   ├── registry.ts
│   │   ├── orchestrator.ts
│   │   ├── academic-analyzer.ts
│   │   └── originality-analyzer.ts
│   ├── grok-analyzer.ts         # Motor de calidad académica
│   ├── originality-analyzer.ts  # Motor de plagio + IA
│   └── prisma.ts
├── hooks/
│   └── useThesisAnalysis.ts     # Hook recomendado para la UI
├── prisma/
│   └── schema.prisma            # Esquema real de base de datos
├── types/
│   └── index.ts
└── ARCHITECTURE.md              # Documento vivo de arquitectura
```

## 🔑 Integración Real con xAI Grok (Producción) — IMPLEMENTADA

La integración con **Grok real (xAI)** ya está completa y sigue los principios de la skill `pront-revisor`:

- Nuevo analizador pluggable: `lib/analyzers/grok-real-analyzer.ts` (implementa `ThesisAnalyzer`)
- Selección automática en el `AnalysisOrchestrator`: si `XAI_API_KEY` existe → usa **Grok-4 real** con structured outputs; cualquier error → **fallback transparente** al simulador de alta calidad (`grok-analyzer.ts`).
- El simulador **nunca se desecha**. Es fallback de primera clase (offline, tests, demos).
- Progreso y mensajes de UI adaptados según si es real o simulado.

**Cómo activarlo:**
1. Copia `.env.example` → `.env.local`
2. Añade tu clave: `XAI_API_KEY=sk-...` (de https://console.x.ai)
3. Reinicia el servidor de desarrollo.

El resto del sistema (RBAC, persistencia, revisiones humanas, reportes, etc.) funciona idénticamente.

Ver también:
- `lib/analyzers/grok-real-analyzer.ts` (prompt experto + manejo robusto de errores)
- `lib/analyzers/orchestrator.ts` (lógica de selección)
- `.env.example` (todas las variables)

## 📌 Decisiones de Arquitectura Actuales (Opción A)

1. **Backend real dentro de Next.js primero** → Se está construyendo un backend funcional con Prisma + API Routes reales. El frontend está migrando progresivamente a consumir estas rutas.
2. **Arquitectura de Analyzers Pluggable** → Capa `lib/analyzers/` con interfaz formal, Registry y Orchestrator. Fácil agregar o reemplazar analizadores.
3. **Análisis Dual de Alta Calidad** → Calidad Académica + Originalidad/Plagio/IA, con score combinado ponderado.
4. **Todo en Español** → Interfaz, feedback y documentación completamente en español.
5. **Diseño Futurista** → Glassmorphism + dark-first + métricas claras.
6. **Preparado para escalar** → Estructura lista para extraer a NestJS + colas + APIs externas reales cuando sea necesario.

## 🎯 Próximos Pasos (Opción A - Backend Real Acelerado)

**Completados (base sólida de producción):**
- [x] Autenticación real con Auth.js v5 + RBAC + relaciones advisor-estudiante
- [x] Persistencia completa (Prisma + SQLite/Postgres) + revisiones humanas
- [x] Almacenamiento real de archivos en `./uploads/`
- [x] Arquitectura pluggable de analizadores + Registry + Orchestrator
- [x] **Integración real con xAI Grok-4** (con fallback premium al simulador)

**Alto prioridad actual:**
- Mejorar generación de reportes PDF desde el servidor (incluyendo resultados de Grok real)
- Pulir la detección de originalidad (preparar swap a Copyleaks/Originality.ai real)

**Mediano plazo:**
- Extracción hacia NestJS backend separado (cuando el volumen lo justifique)
- Integración con servicio real de plagio + IA (Copyleaks recomendado)
- Soporte para múltiples patrones institucionales configurables por asesor

**Largo plazo (ya preparado):**
- pgvector + embeddings para análisis semántico + RAG con patrones del asesor
- BullMQ / colas para procesamiento asíncrono pesado
- Fine-tuning / few-shot con historial de revisiones humanas reales

---

**Desarrollado con ❤️ por Grok (xAI) como Arquitecto de Software IA Senior**

¿Quieres que continúe acelerando el backend real (autenticación, almacenamiento de archivos, persistencia de revisiones humanas, etc.)? Dímelo y lo ejecutamos.
