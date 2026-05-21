import { Component, signal, computed, effect, inject, PLATFORM_ID, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '@core/services/analytics.service';

@Component({
  selector: 'jsl-digital-maturity-selector',
  standalone: true,
  imports: [CommonModule, TranslateModule, LucideAngularModule, RouterLink],
  templateUrl: './digital-maturity-selector.html',
  styleUrl: './digital-maturity-selector.scss'
})
export class DigitalMaturitySelector implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);
  private analytics = inject(AnalyticsService);
  private schemaScript: any; // HTMLScriptElement

  step = signal(0);
  answers = signal<Record<string, any>>({});

  // Example questions
  questions = [
    {
      id: 'size',
      titleKey: 'MATURITY.Q1_TITLE',
      options: [
        { labelKey: 'MATURITY.Q1_OPT1', value: 'startup', icon: 'Rocket' },
        { labelKey: 'MATURITY.Q1_OPT2', value: 'sme', icon: 'Building' },
        { labelKey: 'MATURITY.Q1_OPT3', value: 'enterprise', icon: 'Building2' }
      ]
    },
    {
      id: 'goal',
      titleKey: 'MATURITY.Q2_TITLE',
      options: [
        { labelKey: 'MATURITY.Q2_OPT1', value: 'efficiency', icon: 'Zap' },
        { labelKey: 'MATURITY.Q2_OPT2', value: 'growth', icon: 'TrendingUp' },
        { labelKey: 'MATURITY.Q2_OPT3', value: 'innovation', icon: 'Lightbulb' }
      ]
    },
    {
      id: 'tech',
      titleKey: 'MATURITY.Q3_TITLE',
      options: [
        { labelKey: 'MATURITY.Q3_OPT1', value: 'legacy', icon: 'HardDrive' },
        { labelKey: 'MATURITY.Q3_OPT2', value: 'cloud', icon: 'Cloud' },
        { labelKey: 'MATURITY.Q3_OPT3', value: 'mixed', icon: 'Layers' }
      ]
    }
  ];

  result = computed(() => {
    if (this.step() < this.questions.length) return null;

    // Simple logic for demo
    const size = this.answers()['size'];
    const goal = this.answers()['goal'];

    let recommendationKey = 'MATURITY.REC_GENERAL';
    let ctaLink: any[] = ['/contact'];
    let ctaLabelKey = 'HEADER.CONTACT';

    if (size === 'startup') {
      recommendationKey = 'MATURITY.REC_STARTUP';
      ctaLink = ['/ventures']; // Suggest Ventures for startups
      ctaLabelKey = 'HEADER.VENTURES';
    } else if (goal === 'efficiency') {
      recommendationKey = 'MATURITY.REC_EFFICIENCY';
      ctaLink = ['/virteex-ecosystem']; // Suggest Virteex for efficiency
      ctaLabelKey = 'VIRTEEX.TITLE';
    } else if (goal === 'innovation') {
      recommendationKey = 'MATURITY.REC_INNOVATION';
      ctaLink = ['/solutions/cloud-architecture']; // Suggest Cloud for innovation
      ctaLabelKey = 'SERVICES_LIST.CLOUD';
    }

    return {
      titleKey: 'MATURITY.RESULT_TITLE',
      descKey: recommendationKey,
      ctaLink: ctaLink,
      ctaLabelKey: ctaLabelKey
    };
  });

  selectOption(questionId: string, value: string) {
    this.answers.update(curr => ({ ...curr, [questionId]: value }));
    this.analytics.trackEvent('quiz_step', {
      quiz: 'digital_maturity',
      step: this.step() + 1,
      question: questionId,
      value,
    });
    this.nextStep();
  }

  nextStep() {
    this.step.update(s => s + 1);
  }

  reset() {
    this.step.set(0);
    this.answers.set({});
  }

  constructor() {
    effect(() => {
      if (this.result()) {
        this.injectSchema();
        const answers = this.answers();
        this.analytics.trackEvent('quiz_complete', {
          quiz: 'digital_maturity',
          size: answers['size'] ?? null,
          goal: answers['goal'] ?? null,
          tech: answers['tech'] ?? null,
        });
      }
    });
  }

  ngOnDestroy() {
    this.removeSchema();
  }

  private removeSchema() {
    if (this.schemaScript) {
      this.renderer.removeChild(this.document.head, this.schemaScript);
      this.schemaScript = null;
    }
  }

  private injectSchema() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.removeSchema(); // Remove existing script if any

    const schema = {
      "@context": "https://schema.org",
      "@type": "Quiz",
      "name": "Digital Maturity Assessment",
      "description": "Assess your company's digital maturity level.",
      "hasPart": this.questions.map(q => ({
        "@type": "Question",
        "name": q.titleKey,
        "suggestedAnswer": q.options.map(o => ({
          "@type": "Answer",
          "text": o.labelKey
        }))
      }))
    };

    this.schemaScript = this.renderer.createElement('script');
    this.schemaScript.type = 'application/ld+json';
    this.schemaScript.text = JSON.stringify(schema);
    this.renderer.appendChild(this.document.head, this.schemaScript);
  }
}
