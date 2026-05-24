import { Component, Input, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { ToastService } from '@core/services/toast.service';
import { ApiService } from '@core/services/api.service';
import { AnalyticsService } from '@core/services/analytics.service';

@Component({
  selector: 'jsl-whitepaper-download',
  standalone: true,
  imports: [CommonModule, TranslateModule, LucideAngularModule, FormsModule],
  templateUrl: './whitepaper-download.html',
  styleUrl: './whitepaper-download.scss'
})
export class WhitepaperDownloadComponent {
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);
  private apiService = inject(ApiService);
  private analytics = inject(AnalyticsService);
  private platformId = inject(PLATFORM_ID);

  @Input() titleKey = 'WHITEPAPER.DEFAULT_TITLE';
  @Input() descriptionKey = 'WHITEPAPER.DEFAULT_DESC';
  @Input() pdfUrl = '#';

  email = '';
  isSubmitted = false;
  isSubmitting = false;
  private formStarted = false;

  readonly coverLines = ['75%', '90%', '60%', '85%', '50%', '78%', '45%', '65%'];

  onEmailChange(): void {
    if (!this.formStarted && this.email.length > 0) {
      this.formStarted = true;
      const leadId = 'lead_wp_' + Math.random().toString(36).substring(2, 11);
      this.analytics.setLeadId(leadId);
      this.analytics.startFormTimer('whitepaper');
      this.analytics.trackEvent('form_start', { form_name: 'whitepaper' });
    }
  }

  private get resolvedPdfUrl(): string {
    return (globalThis as any).__env?.WHITEPAPER_PDF_URL || this.pdfUrl;
  }

  onSubmit(): void {
    if (!this.email || this.isSubmitting) return;

    // Basic email validation for error tracking
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.analytics.trackEvent('form_error', {
        form_name: 'whitepaper',
        field: 'email',
        error_type: 'invalid_format'
      });
      this.toastService.show(this.translate.instant('WHITEPAPER.ERROR_MSG'), 'error');
      return;
    }

    this.isSubmitting = true;

    this.apiService.subscribeToNewsletter(this.email).subscribe({
      next: () => {
        this.isSubmitted = true;
        this.isSubmitting = false;
        const timeToComplete = this.analytics.getFormElapsedTime('whitepaper');
        this.analytics.trackEvent('form_submit_success', {
          form_name: 'whitepaper',
          source: 'whitepaper_form',
          time_to_complete: timeToComplete
        });
        this.analytics.trackEvent('whitepaper_download', { source: 'whitepaper_form' });
        this.toastService.show(this.translate.instant('WHITEPAPER.SUCCESS_MSG'), 'success');
        const url = this.resolvedPdfUrl;
        if (url && url !== '#') {
          if (isPlatformBrowser(this.platformId)) {
            setTimeout(() => window.open(url, '_blank'), 800);
          }
        }
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.toastService.show(this.translate.instant('WHITEPAPER.ERROR_MSG'), 'error');
        this.analytics.trackEvent('form_submit_error', {
          form_name: 'whitepaper',
          source: 'whitepaper_form',
          error_code: err.status || 'unknown'
        });
        this.analytics.trackEvent('whitepaper_download_error', { source: 'whitepaper_form' });
      },
    });
  }
}
