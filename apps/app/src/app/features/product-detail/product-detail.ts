// src/app/features/product-detail/product-detail.ts
import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { DataService, Product } from '@core/services/data.service';
import { Title } from '@angular/platform-browser';
import { CtaComponent } from '@shared/components/cta/cta';
import { Seo } from '@core/services/seo';

interface ProductModule {
  icon: string;
  name: string;
  desc: string;
}

interface ProductPlatform {
  icon: string;
  name: string;
  tech: string;
  desc: string;
}

interface ProductCountry {
  flag: string;
  name: string;
  status: 'GA' | 'Beta' | 'Roadmap';
  detail: string;
}

interface ProductStat {
  valueKey: string;
  labelKey: string;
  icon: string;
}

interface ProductExtras {
  brandName: string;
  tagline: string;
  overview: string;
  stats: ProductStat[];
  modules: ProductModule[];
  platforms: ProductPlatform[];
  countries: ProductCountry[];
  coreTech: string[];
  securityFeatures: { icon: string; title: string; desc: string }[];
}

const PRODUCT_EXTRAS: Record<string, ProductExtras> = {
  'virtex': {
    brandName: 'virtex',
    tagline: 'Enterprise Resource Planning for Latin America & the US',
    overview: 'virtex is a multi-tenant, multi-region ERP SaaS ecosystem built on Clean Architecture, microservices, and GraphQL Federation. Designed for the fiscal complexity of the Americas, it offers complete tax localization, offline-first mobile apps, and an extensible plugin marketplace — all from a single unified platform.',
    stats: [
      { valueKey: 'PRODUCTS.VIRTEX_STAT_MODULES_VAL',  labelKey: 'PRODUCTS.VIRTEX_STAT_MODULES_LABEL',  icon: 'LayoutGrid' },
      { valueKey: 'PRODUCTS.VIRTEX_STAT_APPS_VAL',     labelKey: 'PRODUCTS.VIRTEX_STAT_APPS_LABEL',     icon: 'Monitor'    },
      { valueKey: 'PRODUCTS.VIRTEX_STAT_COUNTRIES_VAL',labelKey: 'PRODUCTS.VIRTEX_STAT_COUNTRIES_LABEL',icon: 'Globe'      },
      { valueKey: 'PRODUCTS.VIRTEX_STAT_SAAS_VAL',     labelKey: 'PRODUCTS.VIRTEX_STAT_SAAS_LABEL',     icon: 'Infinity'   },
    ],
    modules: [
      { icon: 'Shield',       name: 'Identity & Access',      desc: 'SSO with Keycloak, MFA (WebAuthn), RBAC/ABAC and full access audit.' },
      { icon: 'DollarSign',   name: 'Accounting & FinOps',    desc: 'Multi-company accounting, financial statements, bank reconciliation and fixed assets.' },
      { icon: 'Receipt',      name: 'Billing & POS',          desc: 'Mass billing, offline-ready touch POS, and subscription management.' },
      { icon: 'Package',      name: 'Inventory & Catalog',    desc: 'Multi-warehouse management, lot/serial traceability, and product catalog.' },
      { icon: 'Users',        name: 'CRM & Sales',            desc: 'Lead management, sales funnel, quotes, and marketing automation.' },
      { icon: 'Briefcase',    name: 'Payroll & HR',           desc: 'Localized payroll, benefits management, employee portal and labor compliance.' },
      { icon: 'ShoppingBag',  name: 'Procurement',            desc: 'Full purchasing cycle: requisitions, purchase orders and goods receipt.' },
      { icon: 'Factory',      name: 'Manufacturing',          desc: 'Production planning (MRP), work orders and inline quality control.' },
      { icon: 'FolderKanban', name: 'Project Management',     desc: 'Milestone-based project tracking, timesheets and profitability analysis.' },
      { icon: 'BarChart3',    name: 'Business Intelligence',  desc: 'Interactive dashboards (Highcharts), custom reports and predictive analytics.' },
    ],
    platforms: [
      { icon: 'Monitor',    name: 'Web Portal',         tech: 'Angular 19+',           desc: 'Main admin center with advanced dashboards and complex workflows.' },
      { icon: 'Smartphone', name: 'Mobile App',         tech: 'Ionic 8 / Capacitor',  desc: 'Field operations, warehouse and sales. SQLite local DB for offline mode.' },
      { icon: 'Laptop',     name: 'Desktop App',        tech: 'Electron / Tauri',      desc: 'Native app for high-performance environments and local peripheral access.' },
      { icon: 'Server',     name: 'Background Workers', tech: 'NestJS / BullMQ',       desc: 'Queue processing, cron jobs, heavy reports and event orchestration.' },
      { icon: 'Zap',        name: 'Edge BFF',           tech: 'NestJS / Fastify',      desc: 'Backend-for-Frontend optimized for edge security and ultra-low latency.' },
    ],
    countries: [
      { flag: '🇲🇽', name: 'Mexico',   status: 'GA',      detail: 'Factura 4.0, Complementos, Cancelación — via Finkok PAC' },
      { flag: '🇧🇷', name: 'Brazil',   status: 'Beta',    detail: 'NFe, CTe, MDFe — SEFAZ Adapter per UF' },
      { flag: '🇨🇴', name: 'Colombia', status: 'Beta',    detail: 'E-Invoicing, Electronic Payroll — DIAN Adapter' },
      { flag: '🇺🇸', name: 'USA',      status: 'Beta',    detail: 'Dynamic Sales Tax by state, 1099 reconciliation' },
      { flag: '🇩🇴', name: 'DOM / CL / PE / AR', status: 'Roadmap', detail: 'DGII, SII, SUNAT, AFIP via local partners' },
    ],
    coreTech: [
      'NestJS', 'GraphQL Federation', 'Angular 19', 'Ionic 8',
      'PostgreSQL', 'Redis', 'Kafka', 'BullMQ',
      'MikroORM', 'Docker', 'Kubernetes', 'OpenTelemetry',
      'Keycloak', 'WebAssembly', 'V8 Isolates',
    ],
    securityFeatures: [
      { icon: 'ShieldCheck',  title: 'Zero-Trust Architecture', desc: 'Every request is authenticated and authorized, regardless of origin.' },
      { icon: 'FileKey',      title: 'SBOM & Supply Chain',     desc: 'Automatic Software Bill of Materials generation and artifact signing with Cosign.' },
      { icon: 'Eye',          title: 'Full Observability',      desc: 'OpenTelemetry instrumentation (Traces, Metrics, Logs) via Grafana/Prometheus.' },
      { icon: 'Scale',        title: 'Policy-as-Code (OPA)',    desc: 'Infrastructure and access policies validated automatically via Open Policy Agent.' },
    ],
  },
};

@Component({
  selector: 'jsl-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    RouterLink,
    LucideAngularModule,
    CtaComponent
  ],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.scss']
})
export class ProductDetail implements OnInit, OnDestroy {

  public currentLang = 'es';
  public product$: Observable<Product | undefined> | undefined;
  public extras: ProductExtras | null = null;

  private langSub: Subscription | undefined;
  private productData: Product | undefined;

  constructor(
    @Inject(TranslateService) private translate: TranslateService,
    private route: ActivatedRoute,
    private dataService: DataService,
    private titleService: Title,
    private seoService: Seo
  ) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
  }

  ngOnInit(): void {
    this.langSub = this.translate.onLangChange.subscribe(event => {
      this.currentLang = event.lang;
      if (this.productData) this.updateMetadata(this.productData);
    });

    this.product$ = this.route.paramMap.pipe(
      switchMap(params => {
        const slug = params.get('slug');
        if (slug) {
          return this.dataService.getProductBySlug(slug);
        }
        return of(undefined);
      })
    );

    this.product$.subscribe(product => {
      this.productData = product;
      this.extras = product ? (PRODUCT_EXTRAS[product.slug] ?? null) : null;
      if (product) this.updateMetadata(product);
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  statusClass(status: 'GA' | 'Beta' | 'Roadmap'): string {
    const map: Record<string, string> = { GA: 'badge--ga', Beta: 'badge--beta', Roadmap: 'badge--roadmap' };
    return map[status] ?? '';
  }

  private updateMetadata(product: Product): void {
    const titleKey = `PRODUCTS.${product.key}_TITLE`;
    const descKey = `PRODUCTS.${product.key}_DESC`;
    const baseUrl = this.seoService.getBaseUrl();
    const url = `${baseUrl}/${this.currentLang}/products/${product.slug}`;

    let imageUrl = product.imageUrl || '';
    if (imageUrl && !imageUrl.startsWith('http')) {
      const assetsIndex = imageUrl.indexOf('assets/');
      imageUrl = assetsIndex > -1
        ? `${baseUrl}/${imageUrl.substring(assetsIndex)}`
        : `${baseUrl}/${imageUrl}`;
    }
    if (!imageUrl) {
      imageUrl = `${baseUrl}/assets/imgs/jsl-social-default.jpg`;
    }

    this.translate.get([titleKey, descKey, 'COMMON.BREADCRUMB_HOME', 'HEADER.PRODUCTS', 'COMMON.DEFAULT_DESCRIPTION']).subscribe(translations => {
      const title = `${translations[titleKey]} | JSL Technology`;
      const description = (translations[descKey] && translations[descKey] !== descKey)
        ? translations[descKey]
        : translations['COMMON.DEFAULT_DESCRIPTION'];

      this.seoService.updateTitleAndDescription(title, description);

      this.seoService.setBreadcrumbs([
        { name: translations['COMMON.BREADCRUMB_HOME'], item: `/${this.currentLang}/home` },
        { name: translations['HEADER.PRODUCTS'], item: `/${this.currentLang}/products` },
        { name: translations[titleKey], item: `/${this.currentLang}/products/${product.slug}` }
      ]);

      this.seoService.updateCanonicalTag(url);
      this.seoService.updateSocialTags(title, description, url, imageUrl);

      const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': `${url}#product`,
        'name': translations[titleKey],
        'description': description,
        'image': imageUrl,
        'brand': {
          '@type': 'Brand',
          'name': 'JSL Technology'
        },
        'offers': {
          '@type': 'Offer',
          'url': url,
          'availability': 'https://schema.org/InStock',
          'priceCurrency': 'USD',
          'priceSpecification': {
            '@type': 'UnitPriceSpecification',
            'priceCurrency': 'USD',
            'price': 'Contact for pricing',
          }
        }
      };
      this.seoService.setJsonLd(productSchema, 'product-schema');
    });
  }
}
