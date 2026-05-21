import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { CtaComponent } from '@shared/components/cta/cta';
import { DataService, CareerPosition } from '@core/services/data.service';
import { Seo } from '@core/services/seo';
import { Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Component({
  selector: 'jsl-careers',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    LucideAngularModule,
    AnimateOnScroll,
    CtaComponent,
    NgOptimizedImage
  ],
  templateUrl: './careers.html',
  styleUrl: './careers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Careers implements OnInit {

  private dataService = inject(DataService);
  private translate = inject(TranslateService);
  private seo = inject(Seo);
  public positions$!: Observable<CareerPosition[]>;

  // Beneficios de trabajar en JSL
  benefits = [
    { key: 'BENEFIT_1', icon: 'Laptop' },
    { key: 'BENEFIT_2', icon: 'Network' },
    { key: 'BENEFIT_3', icon: 'Brain' },
    { key: 'BENEFIT_4', icon: 'Plane' }
  ];

  ngOnInit() {
    this.positions$ = this.dataService.getCareersPositions();
    this.injectJobPostingsSchema();
  }

  private injectJobPostingsSchema(): void {
    this.dataService.getCareersPositions().pipe(
      switchMap((positions: CareerPosition[]) => {
        const keys = positions.flatMap(p => [
          `CAREERS.${p.key}_TITLE`,
          `CAREERS.${p.key}_DESC`,
        ]);
        return this.translate.get(keys).pipe(
          map(translations => positions.map(p => ({
            title: translations[`CAREERS.${p.key}_TITLE`] || p.key,
            description: translations[`CAREERS.${p.key}_DESC`] || '',
            employmentType: (p.typeKey === 'CAREERS.TYPE_FULLTIME' ? 'FULL_TIME' : 'PART_TIME') as 'FULL_TIME' | 'PART_TIME',
            jobLocationType: ((): 'TELECOMMUTE' | 'ONSITE' | 'HYBRID' => {
              const loc = p.locationKey || '';
              if (loc.includes('REMOTE')) return 'TELECOMMUTE';
              if (loc.includes('HYBRID')) return 'HYBRID';
              return 'ONSITE';
            })(),
            datePosted: p.postedDate || '2025-01-01',
          })))
        );
      })
    ).subscribe(enrichedJobs => {
      this.seo.setJobPostingsSchema(enrichedJobs);
    });
  }
}