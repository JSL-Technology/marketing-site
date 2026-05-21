import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription, Observable, of } from 'rxjs'; 
import { switchMap } from 'rxjs/operators'; 
import { DataService, Project } from '@core/services/data.service';
import { CtaComponent } from '@shared/components/cta/cta';
import { Title } from '@angular/platform-browser';
import { Seo } from '@core/services/seo';

@Component({
  selector: 'jsl-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    RouterLink,
    LucideAngularModule,
    CtaComponent 
  ],
  templateUrl: './project-detail.html'
})
export class ProjectDetail implements OnInit, OnDestroy {
  
  public currentLang = 'es';
  public project$: Observable<Project | undefined>; 
  
  private langSub: Subscription | undefined;
  private projectData: Project | undefined; 

  constructor(
    @Inject(TranslateService) private translate: TranslateService,
    private route: ActivatedRoute,
    private dataService: DataService,
    private titleService: Title,
    private seoService: Seo
  ) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';

    this.project$ = this.route.paramMap.pipe(
      switchMap(params => {
        const slug = params.get('slug');
        if (slug) {
          return this.dataService.getProjectBySlug(slug); 
        }
        return of(undefined);
      })
    );
  }

  ngOnInit(): void {
    this.langSub = this.translate.onLangChange.subscribe(event => {
      this.currentLang = event.lang;
      if (this.projectData) this.updateMetadata(this.projectData);
    });

    this.project$.subscribe(project => {
      this.projectData = project;
      if (project) this.updateMetadata(project);
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  private updateMetadata(project: Project): void {
    const titleKey = `PROJECTS.${project.key}_TITLE`;
    const descKey = `PROJECTS.${project.key}_DESC`;
    const baseUrl = this.seoService.getBaseUrl();
    const url = `${baseUrl}/${this.currentLang}/projects/${project.slug}`;

    this.translate.get([titleKey, descKey, 'COMMON.BREADCRUMB_HOME', 'HEADER.PROJECTS', 'COMMON.DEFAULT_DESCRIPTION']).subscribe(translations => {
      const title = `${translations[titleKey]} | JSL Technology`;
      const description = translations[descKey] !== descKey ? translations[descKey] : translations['COMMON.DEFAULT_DESCRIPTION'];

      this.seoService.updateTitleAndDescription(title, description);

      // --- Breadcrumbs Schema ---
      this.seoService.setBreadcrumbs([
        { name: translations['COMMON.BREADCRUMB_HOME'], item: `/${this.currentLang}/home` },
        { name: translations['HEADER.PROJECTS'], item: `/${this.currentLang}/projects` },
        { name: translations[titleKey], item: `/${this.currentLang}/projects/${project.slug}` }
      ]);

      this.seoService.updateCanonicalTag(url);
      this.seoService.updateSocialTags(
        title,
        description,
        url,
        project.imageUrl
      );

      // --- CreativeWork Schema ---
      const projectSchema = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        'name': translations[titleKey],
        'description': description,
        'image': project.imageUrl,
        'url': url,
        'author': {
          '@type': 'Organization',
          'name': 'JSL Technology'
        }
      };
      this.seoService.setJsonLd(projectSchema, 'project-schema');
    });
  }

}