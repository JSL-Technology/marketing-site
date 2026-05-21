// src/app/layout/footer/footer.ts
import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '@core/services/api.service';
import { AnalyticsService } from '@core/services/analytics.service';
import { finalize } from 'rxjs/operators';
import { LanguageSwitcher } from '@app/layout/language-switcher';

@Component({
  selector: 'jsl-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, LucideAngularModule, ReactiveFormsModule, LanguageSwitcher],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer implements OnInit {
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);
  private apiService = inject(ApiService);
  private analytics = inject(AnalyticsService);

  public currentYear = new Date().getFullYear();
  public currentLang = signal(this.translate.currentLang || this.translate.defaultLang || 'es');

  newsletterForm!: FormGroup;
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal(false);
  private formStarted = false;

  constructor() {
    this.translate.onLangChange.subscribe((event) => {
      this.currentLang.set(event.lang);
    });
  }

  ngOnInit(): void {
    this.newsletterForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.newsletterForm.valueChanges.subscribe(() => {
      if (!this.formStarted && this.newsletterForm.get('email')?.value) {
        this.formStarted = true;
        const leadId = 'lead_news_' + Math.random().toString(36).substring(2, 11);
        this.analytics.setLeadId(leadId);
        this.analytics.startFormTimer('newsletter_footer');
        this.analytics.trackEvent('form_start', { form_name: 'newsletter_footer' });
      }
    });
  }

  get nf() {
    return this.newsletterForm.controls;
  }

  // 4. onSubmit actualizado para usar ApiService
  onSubmit(): void {
    if (this.newsletterForm.invalid) {
      this.newsletterForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitSuccess.set(false);
    this.submitError.set(false);

    // 5. Usar el ApiService en lugar de setTimeout
    this.apiService
      .subscribeToNewsletter(this.newsletterForm.value.email)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false); // Se ejecuta al completar o fallar
        })
      )
      .subscribe({
        next: (response: any) => {
          const timeToComplete = this.analytics.getFormElapsedTime('newsletter_footer');
          this.analytics.trackEvent('form_submit_success', {
            form_name: 'newsletter_footer',
            source: 'footer',
            time_to_complete: timeToComplete
          });

          console.log('Suscripción exitosa:', response);
          this.submitSuccess.set(true);
          this.newsletterForm.reset();
          this.formStarted = false;
          this.analytics.trackEvent('newsletter_subscribe', { source: 'footer' });
          setTimeout(() => this.submitSuccess.set(false), 3000);
        },
        error: (err: any) => {
          console.error('Error al suscribir:', err);
          this.submitError.set(true);
          this.analytics.trackEvent('form_submit_error', {
            form_name: 'newsletter_footer',
            source: 'footer',
            error_code: err.status || 'unknown'
          });
          setTimeout(() => this.submitError.set(false), 3000);
        },
      });
  }
}
