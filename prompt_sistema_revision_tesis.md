# PROMPT: Sistema de Revisión de Tesis y Proyectos con Detección de Plagio e IA

## 1. DESCRIPCIÓN GENERAL DEL PROYECTO

Desarrollar una **plataforma web full-stack de revisión de tesis y proyectos de investigación** que incluya:
- Detección automática de plagio y similitud textual
- Detección de contenido generado por IA (ChatGPT, Claude, Gemini, etc.)
- Dashboard de análisis e informes detallados
- Gestión de revisiones y comentarios
- Sistema de autenticación y control de acceso

**Tipo de arquitectura:** Monolítica escalable / Microservicios según volumen

---

## 2. STACK TECNOLÓGICO RECOMENDADO

### Backend
- **Framework:** Node.js (Express/NestJS) o Python (FastAPI/Django)
- **Base de datos:** PostgreSQL + Redis para sesiones/caché
- **Autenticación:** JWT + OAuth 2.0
- **Almacenamiento:** AWS S3 o alternativa gratuita (Cloudinary para MVP)
- **Procesamiento de archivos:** Multer (Node) / FastAPI UploadFile (Python)
- **Logging:** Winston (Node) o Python Logging

### Frontend
- **Framework:** React 18+ con TypeScript
- **State Management:** Redux Toolkit o Zustand
- **UI Component Library:** Material-UI (MUI), Shadcn/ui o Ant Design
- **Visualización de reportes:** Chart.js, Recharts o Plotly
- **HTTP Client:** Axios con interceptores

### DevOps & Hosting
- **Backend:** Render.com (plan gratuito) o Railway
- **Frontend:** Vercel o Netlify (recomendado para mayor velocidad)
- **Repositorio:** GitHub (control de versiones obligatorio)
- **CI/CD:** GitHub Actions

---

## 3. APIS EXTERNAS RECOMENDADAS (Prioridad)

### PRIORIDAD 1: Detección de Plagio + IA (Solución integral)
**API Recomendada:** Copyleaks
- ✅ Detección de plagio + contenido generado por IA en una llamada
- ✅ Soporta +100 idiomas
- ✅ Acepta PDF, DOCX, TXT y código fuente
- ✅ Webhooks para resultados asincronos
- 📊 Plan gratuito limitado / Planes por crédito
- 🔗 https://copyleaks.com/api

### PRIORIDAD 2: Alternativa con mayor precisión
**API Alternativa:** Originality.ai
- ✅ Excelente precisión en detección de IA y plagio web
- ✅ Puntuación de legibilidad y verificación de hechos
- ✅ API REST v3 bien documentada
- 📊 Plan gratuito con créditos limitados
- 🔗 https://originality.ai/

### PRIORIDAD 3: Solución para entornos académicos serios
**API Alternativa:** Turnitin (iThenticate)
- ✅ Estándar en universidades y editoriales
- ✅ Comparación contra base de datos enorme de papers académicos
- ✅ Similarity Report + AI Writing Detection
- 📊 Requiere plan comercial/contacto directo
- 🔗 https://developers.turnitin.com/

### Opción MVP de presupuesto bajo
**API:** PlagiarismCheck.org o Grammarly (Beta)
- ✅ Planes gratuitos limitados
- ⚠️ Menos precisos que Copyleaks
- Para MVP inicial mientras ajustas el presupuesto

---

## 4. ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────┐
│            FRONTEND (React + TypeScript)             │
│   ┌──────────────┬──────────────┬──────────────┐   │
│   │ Auth Pages   │ Upload Form  │  Dashboard   │   │
│   │ Login/Reg    │ Drag & Drop  │  Reportes    │   │
│   └──────────────┴──────────────┴──────────────┘   │
└─────────────────────────────────────────────────────┘
           ↕ API REST (CORS enabled)
┌─────────────────────────────────────────────────────┐
│         BACKEND (Node.js/Python + PostgreSQL)       │
│   ┌────────────┬──────────────┬────────────────┐   │
│   │   Auth     │ Upload       │  Processing    │   │
│   │ Middleware │ Manager      │  Queue (Bull)  │   │
│   └────────────┴──────────────┴────────────────┘   │
│   ┌────────────────────────────────────────────┐   │
│   │  Integración con APIs Externas             │   │
│   │  ├─ Copyleaks (Plagio + IA)                │   │
│   │  ├─ Originality.ai (Alternativa)           │   │
│   │  └─ Turnitin (Enterprise)                  │   │
│   └────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
           ↕ Async Processing
┌─────────────────────────────────────────────────────┐
│   WORKERS / QUEUE (Bull Queue + Redis)              │
│   - Procesa archivos en background                  │
│   - Llamadas a APIs externas                        │
│   - Genera reportes PDF                             │
└─────────────────────────────────────────────────────┘
```

---

## 5. FUNCIONALIDADES PRINCIPALES (MVP)

### 5.1 Autenticación y Gestión de Usuarios
- ✅ Registro de usuarios (estudiante, revisor, admin)
- ✅ Login con JWT y refresh tokens
- ✅ Perfil de usuario (foto, información académica)
- ✅ Roles y permisos (RBAC)
- ✅ Recuperación de contraseña (email verification)

### 5.2 Carga y Procesamiento de Documentos
- ✅ Drag & drop de archivos (PDF, DOCX, TXT)
- ✅ Validación de tipos y tamaño (máx. 50MB recomendado)
- ✅ Conversión de DOCX/PDF a texto plano para análisis
- ✅ Almacenamiento seguro en S3 o servidor
- ✅ Cola de procesamiento asincronous (Bull Queue)

### 5.3 Detección de Plagio e IA
- ✅ Envío automático a API Copyleaks/Originality.ai
- ✅ Manejo de webhooks para resultados asincronos
- ✅ Almacenamiento de reportes en BD
- ✅ Retry automático en caso de fallos
- ✅ Logging detallado de cada análisis

### 5.4 Dashboard de Resultados
- ✅ Visualización del % de similitud / % IA
- ✅ Tabla interactiva de fuentes encontradas
- ✅ Highlightings de secciones sospechosas
- ✅ Estadísticas gráficas (Chart.js / Recharts)
- ✅ Descarga de reportes en PDF

### 5.5 Revisión y Comentarios
- ✅ Anotaciones/comentarios en el documento
- ✅ Sistema de versiones (historial de uploads)
- ✅ Notificaciones por email
- ✅ Vista colaborativa en tiempo real (opcional: WebSockets)

### 5.6 Administración
- ✅ Dashboard admin (estadísticas generales)
- ✅ Gestión de usuarios y roles
- ✅ Monitor de uso de APIs (créditos/llamadas)
- ✅ Logs de auditoría

---

## 6. FLUJO DE DATOS

### Caso de Uso: Estudiante Sube Tesis

```
1. UPLOAD
   Usuario → Frontend → Backend (POST /api/documents/upload)
   └─ Valida archivo
   └─ Almacena en S3/servidor
   └─ Crea registro en BD (status: "pending")

2. PROCESAMIENTO
   Backend → Cola de trabajos (Bull Queue)
   └─ Extrae texto del archivo (pdf2text, docx parsing)
   └─ Fragmenta texto (chunks de 5000 chars aprox.)
   └─ Envía chunks a Copyleaks API
   └─ Actualiza BD (status: "processing")

3. ANÁLISIS
   Copyleaks API → Webhook (callback a /api/webhooks/copyleaks)
   └─ Recibe resultado: 
       {
         similarityScore: 25,
         aiScore: 8,
         sources: [...],
         highlightedParagraphs: [...]
       }
   └─ Almacena en BD
   └─ Actualiza status: "completed"

4. PRESENTACIÓN
   Frontend → Backend (GET /api/documents/{id}/report)
   └─ Recupera datos de BD
   └─ Renderiza dashboard con gráficos
   └─ Permite descargar PDF completo

5. NOTIFICACIÓN
   Backend → Mail Service (SendGrid/Resend)
   └─ Notifica al usuario: "Tu análisis está listo"
```

---

## 7. ENDPOINTS PRINCIPALES (API REST)

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh-token` - Renovar JWT
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Recuperar contraseña

### Documentos
- `POST /api/documents/upload` - Subir archivo
- `GET /api/documents` - Listar documentos del usuario
- `GET /api/documents/{id}` - Obtener detalles
- `DELETE /api/documents/{id}` - Eliminar documento
- `GET /api/documents/{id}/report` - Obtener reporte completo
- `GET /api/documents/{id}/export-pdf` - Descargar PDF

### Análisis & Reportes
- `POST /api/analysis/run` - Iniciar análisis manual (admin)
- `GET /api/analysis/{id}` - Obtener resultado de análisis
- `GET /api/statistics` - Estadísticas globales (admin)

### Webhooks
- `POST /api/webhooks/copyleaks` - Webhook de Copyleaks
- `POST /api/webhooks/originality` - Webhook de Originality.ai

### Usuarios
- `GET /api/users/me` - Perfil actual
- `PUT /api/users/me` - Actualizar perfil
- `GET /api/users` - Listar usuarios (admin)
- `PUT /api/users/{id}/role` - Cambiar rol (admin)

---

## 8. MODELO DE DATOS (PostgreSQL)

```sql
-- Usuarios
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role ENUM('student', 'reviewer', 'admin') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documentos
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  file_path VARCHAR(512),
  file_size INT,
  original_filename VARCHAR(255),
  status ENUM('pending', 'processing', 'completed', 'failed'),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reportes de Análisis
CREATE TABLE analysis_reports (
  id SERIAL PRIMARY KEY,
  document_id INT REFERENCES documents(id) ON DELETE CASCADE,
  api_source ENUM('copyleaks', 'originality', 'turnitin'),
  similarity_score DECIMAL(5,2), -- 0-100%
  ai_score DECIMAL(5,2), -- 0-100%
  ai_detection TEXT, -- 'human', 'mixed', 'ai_generated'
  sources JSONB, -- Array de fuentes encontradas
  highlighted_sections JSONB, -- Párrafos sospechosos
  full_report JSONB, -- Reporte completo de API
  analysis_timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Comentarios & Anotaciones
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  document_id INT REFERENCES documents(id) ON DELETE CASCADE,
  reviewer_id INT REFERENCES users(id),
  paragraph_index INT,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Historial de auditoría
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  action VARCHAR(255),
  entity_type VARCHAR(100),
  entity_id INT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 9. CONFIGURACIÓN DE VARIABLES DE ENTORNO

```bash
# Base de Datos
DATABASE_URL=postgresql://user:pass@localhost:5432/thesis_db
REDIS_URL=redis://localhost:6379

# APIs Externas
COPYLEAKS_API_KEY=your_copyleaks_key
COPYLEAKS_WEBHOOK_SECRET=your_webhook_secret
ORIGINALITY_API_KEY=your_originality_key
TURNITIN_API_KEY=your_turnitin_key

# Autenticación
JWT_SECRET=your_secret_key_256_bits
JWT_EXPIRATION=24h
REFRESH_TOKEN_EXPIRATION=7d

# Email
SENDGRID_API_KEY=your_sendgrid_key
MAIL_FROM=noreply@thesis-check.com

# Almacenamiento
AWS_S3_BUCKET=thesis-documents
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Frontend
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Thesis Reviewer

# Aplicación
NODE_ENV=development
PORT=5000
LOG_LEVEL=debug
MAX_FILE_SIZE=52428800 # 50MB en bytes
```

---

## 10. FLUJO DE DESARROLLO (Recomendado)

### Fase 1: MVP Core (2-3 semanas)
- [ ] Setup inicial (repo, estructura, deploy)
- [ ] Autenticación básica (JWT)
- [ ] Upload de archivos y almacenamiento
- [ ] Integración básica con Copyleaks
- [ ] Dashboard simple con resultados
- [ ] Despliegue en Render (backend) + Vercel (frontend)

### Fase 2: Mejoras MVP (1-2 semanas)
- [ ] Integraciones alternativas (Originality.ai)
- [ ] Sistema de comentarios
- [ ] Notificaciones por email
- [ ] Historial de versiones
- [ ] Reportes PDF descargables

### Fase 3: Características Avanzadas (2-3 semanas)
- [ ] Colaboración en tiempo real (WebSockets)
- [ ] Caché inteligente de análisis
- [ ] Detección de plagio entre documentos del sistema
- [ ] Machine Learning para mejora de detección
- [ ] API pública (para integraciones de terceros)
- [ ] Certificados de originalidad

### Fase 4: Escalabilidad & Producción (Ongoing)
- [ ] Optimizaciones de performance
- [ ] Load testing
- [ ] GDPR compliance
- [ ] Seguridad avanzada (2FA, encryption at rest)
- [ ] Monitoreo y alertas

---

## 11. SEGURIDAD CRÍTICA

### 🔐 Obligatorio
- ✅ HTTPS/TLS en producción
- ✅ CORS configurado restricto
- ✅ Rate limiting en endpoints (express-rate-limit)
- ✅ Validación y sanitización de inputs (joi, validator)
- ✅ SQL Injection prevention (prepared statements)
- ✅ JWT con algoritmo fuerte (HS512/RS512)
- ✅ Hasheo de contraseñas (bcrypt con salt 12+)
- ✅ Almacenamiento seguro de API keys (variables de entorno)
- ✅ Desinfección de archivos (antivirus/MIME validation)
- ✅ Logs de auditoría para todas las acciones críticas

### 🔒 Recomendado
- [ ] OWASP Top 10 mitigation
- [ ] Helmet.js para headers seguro
- [ ] Content Security Policy (CSP)
- [ ] Encryption at rest para datos sensibles
- [ ] MFA (2FA) para usuarios admin
- [ ] Backup automático de BD
- [ ] DDoS protection (Cloudflare)

---

## 12. TESTING (Requisito de calidad)

### Backend
```bash
# Unit tests (Jest)
npm test

# Integration tests (Supertest)
npm run test:integration

# Coverage mínimo: 80%
npm run test:coverage
```

### Frontend
```bash
# Unit + Component tests (Vitest/Jest)
npm run test

# E2E tests (Cypress/Playwright)
npm run test:e2e

# Coverage mínimo: 75%
npm run test:coverage
```

### Pruebas Manuales
- [ ] Upload de archivos (diversos formatos)
- [ ] Timeout de APIs (simular fallos)
- [ ] Webhooks asincronos
- [ ] Flujos de usuario completos
- [ ] Responsive design (mobile/tablet)

---

## 13. MÉTRICAS Y MONITOREO

### KPIs Técnicos
- **Tiempo de procesamiento:** < 5 minutos (pequeños) a 15 min (grandes)
- **Uptime:** > 99.5%
- **Latencia API:** < 200ms (p95)
- **Tasa de error:** < 0.5%

### KPIs de Negocio
- **Tasa de conversión:** % usuarios que completan análisis
- **Documentos analizados/mes**
- **Uso de APIs (créditos/mes)**
- **Satisfacción del usuario (NPS)**

### Herramientas de Monitoreo
- **Logs:** ELK Stack o New Relic
- **Performance:** Sentry para errores
- **Uptime:** UptimeRobot
- **Analytics:** Google Analytics en frontend
- **APM:** New Relic / DataDog (opcional)

---

## 14. DEPLOYMENT & DEVOPS

### Opción 1: Render + Vercel (Recomendada para MVP)
```bash
# Backend en Render
render.yaml:
  services:
    - name: thesis-api
      env: node
      buildCommand: npm install && npm run build
      startCommand: npm run start
      envVars:
        - key: DATABASE_URL
          fromDatabase:
            name: postgres-db
            property: connectionString

# Frontend en Vercel
npm install -g vercel
vercel deploy
```

### Opción 2: Railway (Todo integrado)
- Conectar GitHub directamente
- Variables de entorno en dashboard
- Automático CI/CD

### Opción 3: AWS (Producción)
- ECS/Fargate para backend
- CloudFront + S3 para frontend
- RDS para PostgreSQL
- ElastiCache para Redis

---

## 15. EJEMPLO DE INTEGRACIÓN CON COPYLEAKS (Node.js)

```javascript
// copyleaks.service.js
const axios = require('axios');

class CopyleaksService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.copyleaks.com/v3';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Enviar documento para análisis
  async submitDocument(fileBuffer, fileName, webhookUrl) {
    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, fileName);
      formData.append('webhookUrl', webhookUrl);

      const response = await this.client.post('/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return {
        scanId: response.data.scanId,
        status: 'submitted'
      };
    } catch (error) {
      console.error('Copyleaks submit error:', error);
      throw error;
    }
  }

  // Obtener resultado de análisis
  async getResult(scanId) {
    try {
      const response = await this.client.get(`/result/${scanId}`);
      return {
        similarityScore: response.data.summary.similarityScore,
        aiScore: response.data.summary.aiScore,
        sources: response.data.results.matchedSources,
        highlightedText: response.data.results.highlightedText
      };
    } catch (error) {
      console.error('Copyleaks get result error:', error);
      throw error;
    }
  }

  // Webhook handler para Copyleaks
  async processWebhook(payload, secret) {
    // Validar firma del webhook
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature !== payload.signature) {
      throw new Error('Invalid webhook signature');
    }

    return {
      scanId: payload.scanId,
      status: payload.status,
      result: payload.result
    };
  }
}

module.exports = CopyleaksService;
```

```javascript
// documents.controller.js
const CopyleaksService = require('./copyleaks.service');
const documentService = require('./document.service');
const mailService = require('./mail.service');

const copyleaksService = new CopyleaksService(process.env.COPYLEAKS_API_KEY);

// Webhook para recibir resultados
exports.handleCopyleaksWebhook = async (req, res) => {
  try {
    const payload = req.body;
    
    // Validar y procesar webhook
    const result = await copyleaksService.processWebhook(
      payload,
      process.env.COPYLEAKS_WEBHOOK_SECRET
    );

    // Obtener análisis completo
    const fullResult = await copyleaksService.getResult(result.scanId);

    // Guardar en BD
    const document = await documentService.findByScanId(result.scanId);
    await documentService.updateAnalysis(document.id, {
      similarity_score: fullResult.similarityScore,
      ai_score: fullResult.aiScore,
      sources: fullResult.sources,
      status: 'completed'
    });

    // Notificar usuario
    await mailService.sendAnalysisReady(
      document.userId,
      document.title,
      fullResult.similarityScore
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
};
```

---

## 16. CHECKLIST FINAL (Pre-Producción)

- [ ] Todas las funcionalidades de MVP completadas
- [ ] 80%+ de cobertura de tests
- [ ] Code review completado (2 personas mínimo)
- [ ] OWASP Top 10 auditado
- [ ] Performance testing completado (load test)
- [ ] Documentación de API (Swagger/OpenAPI)
- [ ] Documentación de usuario (guides, FAQs)
- [ ] Plan de disaster recovery
- [ ] Tercer seguridad (penetration testing)
- [ ] GDPR/privacidad compliance
- [ ] Backup y restore testeado
- [ ] Monitoring y alertas configurados
- [ ] Plan de rollback definido
- [ ] SLA documentado
- [ ] Training del equipo de soporte

---

## 17. REFERENCIAS Y RECURSOS

- **Copyleaks API:** https://copyleaks.com/api
- **Originality.ai API:** https://originality.ai/
- **Turnitin for Developers:** https://developers.turnitin.com/
- **Render Deploy Docs:** https://render.com/docs
- **Vercel Deploy Docs:** https://vercel.com/docs
- **PostgreSQL Best Practices:** https://wiki.postgresql.org/wiki/Performance_Optimization
- **Node.js Security:** https://nodejs.org/en/docs/guides/security/
- **React Best Practices:** https://react.dev/learn
- **OWASP Guidelines:** https://owasp.org/www-project-top-ten/

---

## 18. SOPORTE Y ESCALABILIDAD

### Si el proyecto crece:
1. **Base de datos:** Implementar sharding/partitioning
2. **Cache:** Redis + CDN para assets estáticos
3. **Colas:** Bull Queue → RabbitMQ / AWS SQS
4. **Microservicios:** Separar análisis en servicio independiente
5. **Almacenamiento:** S3 + CloudFront
6. **Autoscaling:** Kubernetes / ECS con Fargate

### Costos aproximados (mensual, después del MVP):
- **Render Pro:** $25/mes (backend)
- **Vercel Pro:** $20/mes (frontend)
- **PostgreSQL (Render):** $15/mes
- **APIs externas (Copyleaks):** $50-500/mes según uso
- **AWS S3 + CloudFront:** $5-50/mes según almacenamiento
- **Email service:** $10-100/mes según volumen
- **Monitoreo:** $20-100/mes

**Total MVP:** ~$150-250/mes | **Con crecimiento:** $500+/mes

---

**Documento creado:** Prompt completo para implementación profesional
**Versión:** 1.0
**Última actualización:** Mayo 2026
