# virtex: Ecosistema ERP SaaS de Clase Empresarial

## 🚀 Resumen Ejecutivo

virtex es un ecosistema suite ERP SaaS diseñado para operar de forma escalable, segura y localizada en Latinoamérica y Estados Unidos. Combina una arquitectura moderna multi-tenant y multi-región con localización fiscal completa por país (impuestos, tipos de documento, reportes oficiales y conectores con autoridades tributarias), soporte multilingüe y una experiencia de usuario uniforme en sus aplicaciones web, móvil (offline-first) y de escritorio.

Construido sobre microservicios, GraphQL Federation y un sistema de plugins basado en V8 Isolates y WebAssembly, virtex ofrece un marketplace extensible, altos estándares de seguridad (cifrado extremo a extremo, SBOM, pipeline de admisión de plugins) y un riguroso cumplimiento normativo, con el objetivo de competir directamente con los líderes globales del mercado ERP.

---

## 🏗️ Arquitectura de Clase Mundial

virtex se basa en principios de ingeniería de software de vanguardia para garantizar mantenibilidad, testabilidad y escalabilidad infinita.

### Pilares Arquitectónicos

- **Clean Architecture**: Separación estricta de responsabilidades para evitar el acoplamiento técnico.
- **Domain-Driven Design (DDD)**: El software se modela siguiendo los procesos de negocio reales y lenguajes ubicuos.
- **Microservicios & GraphQL Federation**: Servicios desacoplados que exponen un grafo unificado de datos a través de Apollo Gateway.
- **Multi-tenant & Multi-región**: Capacidad de servir a miles de organizaciones con aislamiento total de datos y latencia mínima.
- **Offline-First & Edge Computing**: Aplicaciones móviles que funcionan sin conexión con sincronización delta bidireccional.

### Desglose de Capas (Clean Architecture)

| Capa               | Responsabilidad                                                                             | Restricciones Técnicas                                                 |
| :----------------- | :------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------- |
| **Domain**         | Corazón del negocio: Entidades, Value Objects, Domain Services y Repositorios (Interfaces). | **TypeScript Puro**. Prohibido importar frameworks (NestJS, MikroORM). |
| **Application**    | Casos de uso (Use Cases), orquestación de servicios y DTOs de entrada.                      | Independiente de la capa de transporte (HTTP/GraphQL/gRPC).            |
| **Infrastructure** | Implementaciones técnicas: MikroORM, adaptadores de API externos, drivers de DB.            | Contiene los detalles técnicos que el dominio no necesita conocer.     |
| **Presentation**   | NestJS Controllers, GraphQL Resolvers y DTOs de salida.                                     | Adaptadores de entrada que validan y transforman datos externos.       |

---

## 📱 Ecosistema de Aplicaciones

virtex ofrece una experiencia omnicanal consistente en todas las plataformas:

| Aplicación             | Tecnología          | Propósito y Capacidades                                                                                    |
| :--------------------- | :------------------ | :--------------------------------------------------------------------------------------------------------- |
| **Web Portal**         | Angular 19+         | Centro de administración principal con Dashboards avanzados y flujos complejos.                            |
| **Mobile App**         | Ionic 8 / Capacitor | Operaciones en campo, almacén y ventas. Base de datos local (SQLite) para modo offline.                    |
| **Desktop App**        | Electron / Tauri    | Aplicación nativa para entornos de alto rendimiento y acceso a periféricos locales (impresoras, scanners). |
| **Background Workers** | NestJS / BullMQ     | Procesamiento de colas, tareas cron, reportes pesados y orquestación de eventos.                           |
| **Edge BFF**           | NestJS / Fastify    | Backend-for-Frontend optimizado para seguridad en el borde y latencia ultra-baja.                          |

---

## 🧩 Módulos Funcionales

La suite virtex es modular, permitiendo a las empresas activar solo lo que necesitan:

| Módulo                    | Descripción Extendida                                                                          |
| :------------------------ | :--------------------------------------------------------------------------------------------- |
| **Identity & Access**     | SSO con Keycloak, MFA (WebAuthn), RBAC/ABAC y auditoría completa de accesos.                   |
| **Accounting & FinOps**   | Contabilidad multi-compañía, estados financieros, conciliación bancaria y activos fijos.       |
| **Billing & POS**         | Facturación masiva, POS táctil offline-ready, y gestión de suscripciones recurrentes.          |
| **Inventory & Catalog**   | Gestión multi-bodega, trazabilidad por lotes/series, códigos de barra y catálogo de productos. |
| **CRM & Sales**           | Gestión de leads, embudo de ventas, cotizaciones y automatización de marketing.                |
| **Payroll & HR**          | Nómina localizable, gestión de beneficios, portal del empleado y cumplimiento laboral.         |
| **Procurement**           | Ciclo completo de compras: requerimientos, órdenes de compra y recepción de mercancía.         |
| **Manufacturing**         | Planificación de producción (MRP), órdenes de trabajo y control de calidad en línea.           |
| **Project Management**    | Gestión de proyectos por hitos, seguimiento de tiempos (timesheets) y rentabilidad.            |
| **Business Intelligence** | Dashboards interactivos (Highcharts), reportes customizados y analítica predictiva.            |

---

## 🌎 Localización Fiscal (Country Readiness)

virtex está diseñado para la complejidad fiscal de las Américas:

| País              | Status      | Provider Principal | Capacidades Incluidas                                           |
| :---------------- | :---------- | :----------------- | :-------------------------------------------------------------- |
| **México (MX)**   | **GA**      | Finkok PAC         | Factura 4.0, Complementos, Cancelación, Retenciones.            |
| **Brasil (BR)**   | **Beta**    | SEFAZ Adapter      | NFe, CTe, MDFe, Homologación por unidad federativa (UF).        |
| **Colombia (CO)** | **Beta**    | DIAN Adapter       | Facturación Electrónica, Nómina Electrónica, Documento Soporte. |
| **USA (US)**      | **Beta**    | Tax Strategy       | Sales Tax dinámico por estado, Reconciliación 1099.             |
| **Latam (Otros)** | **Roadmap** | Partners Locales   | DO (DGII), CL (SII), PE (SUNAT), AR (AFIP).                     |

---

## 🛠️ Stack Tecnológico de Vanguardia

### Backend & Core Infrastructure

- **Lenguaje**: TypeScript / Node.js
- **Framework**: **NestJS** (Arquitectura modular e inyección de dependencias)
- **API Layer**: **GraphQL Federation** (Apollo Server/Gateway)
- **Persistencia**: PostgreSQL (DB principal), Redis (Cache, Sessions, Queues)
- **ORM**: **MikroORM** (Data Mapper pattern con soporte para RLS - Row Level Security)
- **Mensajería**: **Kafka** para eventos distribuidos y **BullMQ** para trabajos asíncronos.

### Frontend & Client-Side

- **Framework**: **Angular 19** y Ionic 8
- **State Management**: **NgRx** (Arquitectura reactiva y predecible)
- **UI/UX**: Componentes customizados, Gridster2 para dashboards, Highcharts.
- **Seguridad Client**: Encriptación local y Secure Storage para datos sensibles.

### Extensibilidad (Plugin Engine)

- **Runtime**: **V8 Isolates** (Aislamiento físico de memoria y CPU para plugins externos)
- **Sandbox**: **WebAssembly (WASM)** para ejecutar lógica compleja con rendimiento nativo de forma segura.

---

## 🛡️ Seguridad, Calidad y Gobernanza Automatizada

virtex implementa un modelo de "Confianza Cero" (Zero-Trust) y gobernanza por código.

- **Seguridad de Suministros**: Generación automática de **SBOM** (Software Bill of Materials) y firma de artefactos con **Cosign**.
- **Políticas OPA**: Validación de políticas de infraestructura y acceso mediante Open Policy Agent.
- **Observabilidad Total**: Instrumentación con **OpenTelemetry** (Trazas, Métricas, Logs) hacia Grafana/Prometheus.
- **Gobernanza de Monorepo (Nx)**:
  - `npm run arch:check`: Impone reglas de Clean Architecture automáticamente.
  - `npm run doctor`: Diagnóstico completo de la salud del entorno de desarrollo.
  - `npm run readiness:commercial`: Valida la consistencia entre código y promesas comerciales por país.

---

## 🔌 Marketplace y Ecosistema de Terceros

El corazón de la extensibilidad de virtex radica en su sistema de plugins:

1.  **Aislamiento**: Los plugins no comparten memoria con el core, evitando "cascading failures".
2.  **Marketplace**: Catálogo donde desarrolladores pueden publicar soluciones verticales (ej: Conector para Shopify).
3.  **SDK**: Herramientas de desarrollo que permiten simular el entorno productivo localmente.
4.  **Pipeline de Admisión**: Escaneo automático de seguridad y vulnerabilidades para cada plugin publicado.
