# CARTA GANTT - PROYECTO HEYTERS
## Plataforma de Batallas de Rap en Tiempo Real

**Duración Total:** 8 semanas
**Equipo:** 1 desarrollador full-stack
**Metodología:** Desarrollo iterativo por fases

---

## CRONOGRAMA VISUAL

```
FASE 1: DISEÑO Y PLANIFICACIÓN (Semana 1-2)
═══════════════════════════════════════════
├─ Definición de requisitos funcionales    [████████]
├─ Diseño de arquitectura del sistema      [████████]
├─ Diseño de base de datos PostgreSQL      [████████]
└─ Mockups de interfaz de usuario          [████████]

FASE 2: DESARROLLO BACKEND (Semana 2-5)
═══════════════════════════════════════════
├─ Configuración inicial Node.js/Express   [████]
├─ Sistema de autenticación JWT            [████████]
├─ API REST (usuarios + batallas)          [████████████]
├─ Integración MercadoPago                 [████]
├─ WebSockets con Socket.IO                [████████]
├─ Integración LiveKit                     [████████]
└─ Seguridad (rate limiting + validación)  [████]

FASE 3: DESARROLLO FRONTEND (Semana 5-6)
═══════════════════════════════════════════
├─ Configuración React + Vite              [████]
├─ Componentes UI reutilizables            [████████]
├─ Páginas principales                     [████████]
├─ Página de batalla en vivo               [████████]
├─ Integración LiveKit                     [████████]
├─ Panel de administración                 [████]
└─ Sistema de pagos frontend               [████]

FASE 4: TESTING Y DEPLOY (Semana 7)
═══════════════════════════════════════════
├─ Pruebas unitarias backend               [████████]
├─ Pruebas de integración                  [████████]
├─ Deploy Railway (backend)                [████████]
├─ Deploy Vercel (frontend)                [████████]
└─ Configuración dominios y variables      [████████]

FASE 5: PRODUCCIÓN Y OPTIMIZACIÓN (Semana 8)
═══════════════════════════════════════════
├─ Monitoreo y logs                        [████████]
├─ Optimizaciones de rendimiento           [████████]
├─ Documentación técnica                   [████████]
└─ Video demostración                      [████████]
```

---

## DETALLES POR FASE

### **FASE 1: Diseño (Semana 1-2)** ✅
**Objetivos:**
- Definir alcance completo del proyecto
- Diseñar arquitectura escalable
- Crear mockups de todas las vistas

**Entregables:**
- Documento de requisitos funcionales
- Diagrama de arquitectura del sistema
- Schema de base de datos PostgreSQL
- Wireframes/mockups en Figma

**Dependencias:** Ninguna

---

### **FASE 2: Desarrollo Backend (Semana 2-5)** ✅
**Objetivos:**
- Implementar toda la lógica de negocio
- Crear API REST completa
- Integrar servicios externos

**Entregables:**
- API REST documentada
- Sistema de autenticación seguro (JWT)
- Integración con MercadoPago
- WebSockets para tiempo real
- Integración LiveKit para video
- Middleware de seguridad

**Dependencias:** FASE 1 completada

**Tecnologías:**
- Node.js + Express
- PostgreSQL (Neon)
- JWT + bcrypt
- Socket.IO
- LiveKit SDK
- MercadoPago SDK

---

### **FASE 3: Desarrollo Frontend (Semana 5-6)** ✅
**Objetivos:**
- Crear interfaz de usuario completa
- Integrar con backend
- Implementar video en tiempo real

**Entregables:**
- Aplicación React desplegable
- Sistema de rutas y navegación
- Componentes reutilizables
- Integración LiveKit
- Panel de administración
- Flujo de pago completo

**Dependencias:** FASE 2 completada (API funcionando)

**Tecnologías:**
- React + Vite
- TailwindCSS
- React Router
- LiveKit React Components
- Axios

---

### **FASE 4: Testing y Deploy (Semana 7)** ✅
**Objetivos:**
- Validar funcionamiento completo
- Desplegar en producción
- Configurar ambiente productivo

**Entregables:**
- Suite de pruebas
- Backend en Railway
- Frontend en Vercel
- Variables de entorno configuradas
- Dominios activos

**Dependencias:** FASE 2 y 3 completadas

**Actividades:**
- Pruebas unitarias con Jest
- Pruebas de integración
- Deploy automatizado
- Configuración de DNS

---

### **FASE 5: Producción (Semana 8)** ✅
**Objetivos:**
- Optimizar rendimiento
- Documentar proyecto
- Crear video demostración

**Entregables:**
- Sistema de monitoreo activo
- Logs estructurados
- Documentación técnica
- Video demostración (8-10 min)
- Informe de gestión

**Dependencias:** FASE 4 completada

---

## JUSTIFICACIÓN DEL CRONOGRAMA

### **¿Por qué 8 semanas?**

1. **Funcionalidad Completa (4 semanas dev)**
   - Backend complejo requiere autenticación, pagos, websockets y video
   - Frontend con LiveKit requiere tiempo de integración y testing

2. **Capacidad Técnica Realista**
   - Aprendizaje de LiveKit SDK (nueva tecnología)
   - Integración de MercadoPago requiere testing extensivo
   - WebRTC tiene complejidades de red y configuración

3. **Gestión de Dependencias**
   - Backend debe estar funcional antes de iniciar frontend
   - Testing requiere features completas
   - Deploy requiere ambiente estable

4. **Tiempo para Iteraciones**
   - 2 semanas buffer para ajustes y bugs
   - Testing integral antes de producción
   - Optimizaciones post-deploy

### **Riesgos Identificados**

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| LiveKit complejidad alta | Media | Documentación oficial + ejemplos |
| MercadoPago webhook delays | Alta | Polling como fallback |
| PostgreSQL rendimiento | Baja | Indexes + connection pooling |
| Browser compatibility | Media | Testing cross-browser |

---

## HERRAMIENTAS Y METODOLOGÍA

**Control de Versiones:** Git + GitHub
**Gestión de Tareas:** GitHub Issues
**Deploy:** Railway (backend) + Vercel (frontend)
**Monitoreo:** Winston Logs + Railway Metrics
**Comunicación:** Discord/Slack

**Metodología de Desarrollo:**
- Commits atómicos frecuentes
- Feature branches con PR reviews
- Deploy continuo en cada push a main
- Testing manual + automatizado

---

## HITOS PRINCIPALES

✅ **Semana 2:** Diseño completado
✅ **Semana 4:** API REST funcional
✅ **Semana 6:** Frontend integrado
✅ **Semana 7:** Desplegado en producción
✅ **Semana 8:** Video demostración listo

---

**Última actualización:** Diciembre 2024
**Estado:** ✅ Completado
