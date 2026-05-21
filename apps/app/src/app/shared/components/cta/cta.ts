// src/app/shared/components/cta/cta.ts
import { Component, Input, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';

@Component({
  selector: 'jsl-cta-section',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    LucideAngularModule,
    AnimateOnScroll
  ],
  templateUrl: './cta.html',
  styleUrl: './cta.scss'
})
export class CtaComponent {
  @Input() eyebrowKey = 'HOME.CTA_EYEBROW';
  @Input() titleKey = 'HOME.CTA_TITLE';
  @Input() subtitleKey = 'HOME.CTA_SUBTITLE';
  @Input() ctaTextKey = 'HOME.CTA_BUTTON';
  @Input() ctaLink: string[] = ['/', 'es', 'contact'];

  public currentLang: string;

  constructor(@Inject(TranslateService) private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    this.translate.onLangChange.subscribe(event => {
      this.currentLang = event.lang;
      this.ctaLink[1] = this.currentLang;
    });
    this.ctaLink[1] = this.currentLang;
  }
}