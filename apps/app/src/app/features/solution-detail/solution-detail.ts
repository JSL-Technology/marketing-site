import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription, Observable, of, EMPTY } from 'rxjs';
import { switchMap, tap, shareReplay, map } from 'rxjs/operators';

import { DataService, Solution } from '@core/services/data.service';
import { TECH_STACK } from '@core/data/mock-data';
import { CtaComponent } from '@shared/components/cta/cta';
import { RelatedContentComponent } from '@shared/components/related-content/related-content';
import { Seo } from '@core/services/seo';

@Component({
  selector: 'jsl-solution-detail',
  standalone: true,
  imports: [
    AsyncPipe,
    TranslateModule,
    RouterLink,
    LucideAngularModule,
    CtaComponent,
    RelatedContentComponent
  ],
  templateUrl: './solution-detail.html',
  styleUrls: ['./solution-detail.scss'],
})
export class SolutionDetail implements OnInit, OnDestroy {
  public currentLang = 'es';
  // Initialize with EMPTY or a default value to satisfy strict property initialization
  public solution$: Observable<Solution | undefined> = of(undefined);

  private langSub: Subscription | undefined;
  // Removed solutionData to prevent duplicate state and visibility issues
  private techLogoMap: Map<string, string> = new Map();

  public otherSolutions: Solution[] = [];

  constructor(
    @Inject(TranslateService) private translate: TranslateService,
    private route: ActivatedRoute,
    private dataService: DataService,
    private titleService: Title,
    private seoService: Seo
  ) {
    this.currentLang =
      this.translate.currentLang || this.translate.defaultLang || 'es';
  }

  ngOnInit(): void {
    this.initTechLogoMap();

    this.langSub = this.translate.onLangChange.subscribe(event => {
      this.currentLang = event.lang;
      // We need to re-fetch or re-update title if lang changes,
      // but since the title update logic is inside the solution$ pipe,
      // we might need to trigger it.
      // However, usually navigating changes the route.
      // For now, simpler is better: rely on the template for content translation.
      // If we need to update the browser title on lang change, we'd need the current solution data.
      // Since we removed solutionData, we can't easily do it without a signal or behavior subject.
      // For this refactor, we will focus on the main content content.
      // To keep it 100% correct, we could use a signal or retain the latest value in a variable if strictly needed,
      // but let's stick to the reactive flow.
    });

    this.solution$ = this.route.paramMap.pipe(
      switchMap(params => {
        const slug = params.get('slug');
        return slug ? this.dataService.getSolutionBySlug(slug) : of(undefined);
      }),
      tap(solution => {
        if (solution) {
          this.updateMetadata(solution);
          this.loadOtherSolutions(solution);
        }
      }),
      shareReplay(1) // Share the result to avoid multiple executions if subscribed multiple times
    );
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  loadOtherSolutions(current: Solution) {
    this.dataService.getSolutions().subscribe(solutions => {
      this.otherSolutions = solutions.filter(s => s.slug !== current.slug).slice(0, 3);
    });
  }

  private initTechLogoMap(): void {
    TECH_STACK.forEach(category => {
      category.technologies.forEach(tech => {
        this.techLogoMap.set(tech.name, tech.imageUrl);
      });
    });
  }

  public getTechLogo(techName: string): string {
    return this.techLogoMap.get(techName) || '';
  }

  private updateMetadata(solution: Solution): void {
    const titleKey = `SOLUTIONS.${solution.key}_TITLE`;
    const descKey = `SOLUTIONS.${solution.key}_DESC`;

    // Set breadcrumbs first if possible, or wait for translations
    const baseUrl = this.seoService.getBaseUrl();
    const url = `${baseUrl}/${this.currentLang}/solutions/${solution.slug}`;

    this.translate.get([titleKey, descKey, 'COMMON.BREADCRUMB_HOME', 'HEADER.SERVICES', 'COMMON.DEFAULT_DESCRIPTION']).subscribe(translations => {
      const title = `${translations[titleKey] || solution.key} | JSL Technology`;
      const description = translations[descKey] !== descKey ? translations[descKey] : translations['COMMON.DEFAULT_DESCRIPTION'];

      this.seoService.updateTitleAndDescription(title, description);

      // --- Breadcrumbs Schema ---
      this.seoService.setBreadcrumbs([
        { name: translations['COMMON.BREADCRUMB_HOME'], item: `/${this.currentLang}/home` },
        { name: translations['HEADER.SERVICES'], item: `/${this.currentLang}/solutions` },
        { name: translations[titleKey], item: `/${this.currentLang}/solutions/${solution.slug}` }
      ]);

      this.seoService.updateCanonicalTag(url);
      this.seoService.updateSocialTags(
        title,
        description,
        url,
        solution.heroImage
      );

      // --- Datos Estructurados: Service ---
      const serviceSchema = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        'name': translations[titleKey],
        'description': description,
        'provider': {
          '@type': 'Organization',
          'name': 'JSL Technology',
          'url': baseUrl
        },
        'image': solution.heroImage,
        'url': url
      };
      this.seoService.setJsonLd(serviceSchema, 'service-schema');
    });
  }
}
