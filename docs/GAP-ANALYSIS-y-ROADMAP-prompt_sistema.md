# Gap Analysis + Roadmap de Implementación
## Basado en `prompt_sistema_revision_tesis.md` + Estado Actual de PRONT Revisor

**Fecha:** 2026  
**Contexto:** Análisis realizado por el experto de la skill `pront-revisor`

---

## 1. Resumen Ejecutivo

El archivo `prompt_sistema_revision_tesis.md` describe una **plataforma de revisión de tesis orientada principalmente a detección de plagio + contenido generado por IA** usando APIs comerciales (Copyleaks como prioridad #1).

Tu proyecto actual (**PRONT Revisor**) es muy diferente en enfoque:

- **Fortaleza actual**: Revisión profunda de **calidad académica** (estructura, coherencia, redacción, originalidad intelectual) con un simulador Grok-IA sorprendentemente bueno + excelente flujo humano-IA.
- **Debilidad actual**: No tiene detección real de plagio ni de contenido IA, ni backend real.

**Conclusión principal**: No debes "reemplazar" tu proyecto por lo que dice el spec. Debes **hibridar** las dos visiones:

> Mantener y potenciar tu excelente motor de revisión académica (grok-analyzer) + agregar las capacidades de **Plagio + Detección de IA generativa** como dimensiones adicionales muy poderosas.

---

## 2. Gap Analysis Detallado

| Área | Estado Actual (PRONT Revisor) | Lo que pide el Spec | Gap | Prioridad |
|------|-------------------------------|---------------------|-----|---------|
| **Revisión de Calidad Académica** | Excelente (reglas + heurísticas avanzadas en `grok-analyzer.ts`) | Casi inexistente (solo menciona plagio/IA) | El spec es más débil aquí | **Mantener y mejorar** |
| **Detección de Plagio** | Ninguna | Core del sistema (Copyleaks, Originality.ai, Turnitin) | Muy grande | **Alta** |
| **Detección de Contenido IA** | Ninguna | Core del sistema (mismo APIs) | Muy grande | **Alta** |
| **Backend Real** | Solo frontend demo | NestJS/Express + PostgreSQL + Redis + BullMQ | Muy grande | Alta (ver plan de migración) |
| **Autenticación y Roles reales** | Simulada (role switcher en cliente) | JWT + RBAC completo | Grande | Media-Alta |
| **Procesamiento de Archivos** | Simulado (contenido hardcodeado) | pdf-parse + mammoth + almacenamiento S3 | Grande | **Alta** (prerrequisito) |
| **Colas y Procesamiento Asíncrono** | Simulado con setTimeout | BullMQ / Workers reales | Grande | Media |
| **Webhooks y APIs externas** | No existe | Copyleaks webhooks + manejo de errores | Muy grande | Media |
| **Almacenamiento de Documentos** | No existe | S3 / MinIO | Grande | Media |
| **Reportes y Exportación** | PDF básico con jsPDF (solo acta de revisión) | Reportes completos + fuentes de plagio + highlighting | Medio | Media |
| **UI/UX y Experiencia** | Muy superior (glassmorphism, bilingual, ReviewPanel excelente) | Genérica / Básica | Tu proyecto gana claramente | **Preservar** |
| **Bilingüismo** | Excelente (ES/EN en todo el simulador) | No mencionado | Tu proyecto gana | **Preservar** |
| **Flujo Humano + IA** | Uno de los mejores del proyecto (pestaña Humana + ajuste de score) | Mencionado de forma básica | Tu proyecto gana | **Preservar y potenciar** |

---

## 3. Lo Más Importante que te Faltó (Orden de Impacto)

### Prioridad Muy Alta (Hacer primero)

1. **Parsing real de documentos** (PDF/DOCX → texto)
   - Sin esto, no puedes integrar Copyleaks ni mejorar el analizador Grok.
   - Es el prerrequisito #1.

2. **Integración con servicio de Plagio + Detección de IA**
   - Copyleaks es la recomendación más fuerte del spec (hace ambas cosas en una llamada).
   - Esto es el "killer feature" que el spec quiere vender.

3. **Arquitectura limpia para agregar analizadores**
   - Actualmente llamas directamente a `analyzeWithGrok`.
   - Necesitas un sistema de "analyzers" plugables:
     - AcademicQualityAnalyzer (tu grok-analyzer actual)
     - PlagiarismAndAIContentAnalyzer (nuevo, vía Copyleaks)
     - Future: Real Grok, etc.

### Prioridad Alta

4. Persistencia real (aunque sea localStorage primero + luego BD).
5. Autenticación básica (aunque sea simulada mejorada).
6. Mejorar el simulador actual aprovechando texto real extraído (hoy usa contenido hardcodeado).

### Prioridad Media

7. Backend real + colas.
8. Almacenamiento de archivos.
9. Reportes más ricos (incluyendo resultados de plagio).

---

## 4. Estrategia Recomendada (Híbrida Inteligente)

**No copies ciegamente el spec.** El spec tiene una visión más "commodity" (plagio + IA generativa). Tu proyecto tiene una visión más **premium académica**.

**Estrategia ganadora:**

- **Core 1 (tu diferenciador)**: Mantener y mejorar fuertemente el motor de **calidad académica** (grok-analyzer + flujo humano).
- **Core 2 (el que pide el spec)**: Agregar como segunda dimensión potente **Plagio + Detección de Contenido IA** usando Copyleaks u Originality.ai.
- Presentar ambos resultados en el ReviewPanel (pestañas o secciones separadas: "Calidad Académica" + "Originalidad y Autenticidad").

Esto te da una ventaja competitiva clara frente a herramientas que solo hacen plagio.

---

## 5. Mejoras Adicionales que Recomiendo (Más Allá del Spec)

Basado en el análisis profundo realizado con la skill `pront-revisor`:

1. **Hacer el analizador académico configurable por programa** (actualmente está muy hardcodeado a Maestría en Educación).
2. **Mejorar significativamente la detección de citas** (la regex actual es muy débil).
3. **Añadir detección de "Problema de investigación" y "Pregunta de investigación"** (faltan en el simulador actual).
4. **Soporte para múltiples patrones institucionales** (no solo uno).
5. **Versión "lite" del simulador** que funcione incluso sin conexión a APIs externas.
6. **Comparativa IA vs Humano** más rica en el Dashboard (ya tienes algo, pero se puede potenciar mucho).
7. **Modo "Estudiante" con auto-evaluación** antes de enviar al asesor.

---

## 6. Roadmap Realista Recomendado (Próximos 3-4 Meses)

### Fase A: Fundamentos (4-6 semanas)
- Parsing real de PDF/DOCX (pdf-parse + mammoth)
- Refactor del analizador a arquitectura de "Analyzers" plugables
- Guardar texto extraído real en los avances
- Mejorar el simulador académico con el texto real

### Fase B: Plagio + Detección IA (5-7 semanas)
- Elegir proveedor (recomiendo empezar con Copyleaks)
- Crear servicio de integración
- Crear nuevo Analyzer: `PlagiarismAndAIDetector`
- Mostrar resultados combinados en ReviewPanel
- Manejo básico de errores y créditos

### Fase C: Persistencia + Backend Ligero (6-8 semanas)
- Seguir el plan de migración que ya creamos (`PRODUCTION-MIGRATION-PLAN.md`)
- Empezar con localStorage → luego PostgreSQL

### Fase D: Pulido y Producción
- Autenticación
- Colas reales
- Almacenamiento de archivos
- Reportes avanzados

---

## 7. Preguntas Clave para Ti

Antes de empezar a implementar, necesito que me confirmes:

1. **¿Quieres priorizar primero el parsing real + mejora del simulador académico**, o directamente ir por la integración con Copyleaks?

2. **¿Tienes presupuesto / acceso** para una API de Copyleaks u Originality.ai en este momento, o quieres primero una versión simulada de detección de plagio/IA (para no gastar mientras desarrollamos)?

3. ¿Quieres que empecemos **hoy** implementando la Fase A (parsing + arquitectura de analyzers)?

---

**Conclusión del experto:**

Tu proyecto actual ya es más avanzado en varios aspectos importantes que lo que describe ese spec (especialmente en experiencia de revisión académica). El spec es más fuerte en detección de originalidad externa.

La mejor estrategia no es elegir uno u otro, sino **fusionarlos inteligentemente**.

¿Quieres que empecemos a construir esta fusión? Dime por dónde prefieres atacar primero.