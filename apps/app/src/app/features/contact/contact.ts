import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { AnalyticsService } from '@core/services/analytics.service';
import { ClarityService } from '@core/services/clarity.service';
import { PersonalizationService } from '@core/services/personalization.service';
import { Seo } from '@core/services/seo';
import { Router, RouterLink } from '@angular/router';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { Subject } from 'rxjs';
import { takeUntil, finalize, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { ALL_ICONS } from '@core/constants/icons';

@Component({
  selector: 'jsl-contact',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, LucideAngularModule, AnimateOnScroll, RouterLink],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact implements OnInit, OnDestroy {
  contactForm!: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  submitError = false;
  readonly icons = ALL_ICONS;

  // Multi-step state
  currentStep = signal<1 | 2 | 3>(1);
  readonly totalSteps = 3;
  progressPercent = computed(() => Math.round(((this.currentStep() - 1) / this.totalSteps) * 100));

  private readonly recaptchaSiteKey = (globalThis as any).__env?.RECAPTCHA_SITE_KEY ?? '';
  private destroy$ = new Subject<void>();
  private formStarted = false;
  private lastInteractedField = 'none';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private toastService: ToastService,
    private analytics: AnalyticsService,
    private clarityService: ClarityService,
    private personalizationService: PersonalizationService,
    private router: Router,
    private seo: Seo,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    this.seo.setOrganizationSchema();
    this.injectRecaptchaScript();
    this.contactForm = this.fb.group({
      // Step 1 — Identity
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      company: [''],
      // Step 2 — Project
      service: ['', [Validators.required]],
      serviceOther: [''],
      budget: [''],
      message: ['', [Validators.required, Validators.minLength(10)]],
      // Step 3 — Final
      phone: ['', [Validators.pattern(/^[+()\-.\s\d]{7,20}$/)]],
      referralSource: [''],
      privacy: [false, Validators.requiredTrue],
      // Hidden
      honeypot: [''],
      recaptchaToken: ['']
    });

    this.setupConditionalValidation();

    if (isPlatformBrowser(this.platformId)) {
      this.loadDraft();
      this.setupDraftAutoSave();
      this.setupFormStartTracking();
      this.prefillKnownData();
    }
  }

  // --- Step navigation ---

  get step1Valid(): boolean {
    return (
      this.contactForm.get('name')!.valid &&
      this.contactForm.get('email')!.valid
    );
  }

  get step2Valid(): boolean {
    return (
      this.contactForm.get('service')!.valid &&
      this.contactForm.get('message')!.valid &&
      (this.contactForm.get('service')!.value !== 'other' || this.contactForm.get('serviceOther')!.valid)
    );
  }

  nextStep(): void {
    const step = this.currentStep();
    if (step === 1) {
      this.contactForm.get('name')!.markAsTouched();
      this.contactForm.get('email')!.markAsTouched();
      if (!this.step1Valid) return;
      this.analytics.trackEvent('form_step_complete', { form_name: 'contact', step: 1 });
    } else if (step === 2) {
      this.contactForm.get('service')!.markAsTouched();
      this.contactForm.get('message')!.markAsTouched();
      if (this.contactForm.get('service')!.value === 'other') this.contactForm.get('serviceOther')!.markAsTouched();
      if (!this.step2Valid) return;
      // Save the selected service to sessionStorage for thank-you personalization
      if (isPlatformBrowser(this.platformId)) {
        sessionStorage.setItem('jsl_last_service', this.contactForm.get('service')!.value ?? '');
        sessionStorage.setItem('jsl_whitepaper_downloaded', localStorage.getItem('jsl_whitepaper_downloaded') ?? 'false');
      }
      this.analytics.trackEvent('form_step_complete', { form_name: 'contact', step: 2 });
    }
    if (step < 3) this.currentStep.set((step + 1) as 1 | 2 | 3);
  }

  prevStep(): void {
    const step = this.currentStep();
    if (step > 1) this.currentStep.set((step - 1) as 1 | 2 | 3);
  }

  // --- Progressive profiling ---

  private prefillKnownData(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const draft = localStorage.getItem('jsl_contact_draft');
    if (draft) {
      try {
        this.contactForm.patchValue(JSON.parse(draft), { emitEvent: false });
        return; // draft already has everything
      } catch {
        // fall through to segment-based prefill
      }
    }
    // Pre-fill segment from personalization service
    const segment = this.personalizationService.userSegment();
    if (segment && segment !== 'unknown') {
      this.contactForm.patchValue({ referralSource: segment }, { emitEvent: false });
    }
  }

  private setupFormStartTracking(): void {
    this.contactForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        const lastField = this.getLastMeaningfulField(value);
        if (lastField) {
          this.lastInteractedField = lastField;
          this.analytics.trackEvent('form_field_interaction', {
            form_name: 'contact',
            field: lastField,
            interaction_type: 'change'
          });
        }

        if (!this.formStarted) {
          this.formStarted = true;
          const leadId = 'lead_' + Math.random().toString(36).substring(2, 11);
          this.analytics.setLeadId(leadId);
          this.analytics.startFormTimer('contact');
          this.analytics.trackEvent('form_start', { form_name: 'contact' });
          this.clarityService.identify(leadId, this.personalizationService.userSegment());
        }
      });
  }

  private setupDraftAutoSave(): void {
    this.contactForm.valueChanges
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((value) => {
        const { recaptchaToken, honeypot, ...draft } = value;
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('jsl_contact_draft', JSON.stringify(draft));
        }
      });
  }

  private loadDraft(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const saved = localStorage.getItem('jsl_contact_draft');
    if (saved) {
      try {
        this.contactForm.patchValue(JSON.parse(saved), { emitEvent: false });
      } catch { /* ignore */ }
    }
  }

  private setupConditionalValidation(): void {
    const serviceControl = this.contactForm.get('service');
    const serviceOtherControl = this.contactForm.get('serviceOther');

    serviceControl?.valueChanges
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((value: string) => {
        if (value === 'other') {
          serviceOtherControl?.setValidators([Validators.required, Validators.minLength(3)]);
        } else {
          serviceOtherControl?.clearValidators();
          serviceOtherControl?.setValue('');
        }
        serviceOtherControl?.updateValueAndValidity({ emitEvent: false });
      });
  }

  ngOnDestroy(): void {
    if (this.formStarted && !this.submitSuccess) {
      const elapsed = this.analytics.getFormElapsedTime('contact');
      this.analytics.trackEvent('form_abandon', {
        form_name: 'contact',
        last_field: this.lastInteractedField,
        time_to_abandon: elapsed
      });
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  get f() { return this.contactForm.controls; }

  get currentLang(): string { return this.router.url.split('/')[1] || 'en'; }

  async onSubmit(): Promise<void> {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    this.contactForm.get('privacy')!.markAsTouched();
    this.contactForm.get('phone')!.markAsTouched();

    if (this.contactForm.invalid) {
      this.isSubmitting = false;
      this.contactForm.markAllAsTouched();
      this.toastService.show('CONTACT.FORM.ERROR', 'error');
      Object.keys(this.contactForm.controls).forEach(key => {
        const errors = this.contactForm.get(key)?.errors;
        if (errors) {
          this.analytics.trackEvent('form_error', { form_name: 'contact', field: key, error_type: Object.keys(errors)[0] });
        }
      });
      return;
    }

    if (this.contactForm.value.honeypot) {
      this.isSubmitting = false;
      this.submitSuccess = true;
      this.contactForm.reset({ privacy: false, serviceOther: '', referralSource: '', honeypot: '' });
      this.toastService.show('CONTACT.FORM.SUCCESS', 'success');
      return;
    }

    const recaptchaToken = await this.getRecaptchaToken();
    if (!recaptchaToken) {
      this.isSubmitting = false;
      this.toastService.show('CONTACT.FORM.RECAPTCHA_ERROR', 'error');
      return;
    }

    this.submitSuccess = false;
    this.submitError = false;

    const segment = isPlatformBrowser(this.platformId)
      ? localStorage.getItem('jsl_user_segment') ?? ''
      : '';
    const clientId = this.analytics.getClientId() ?? '';
    const leadId = this.analytics.getLeadId() ?? '';

    this.apiService
      .sendContactForm({
        ...this.contactForm.value,
        recaptchaToken,
        segment,
        clientId,
        leadId,
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isSubmitting = false; })
      )
      .subscribe({
        next: (response: any) => {
          const timeToComplete = this.analytics.getFormElapsedTime('contact');
          this.analytics.trackEvent('form_submit_success', { form_name: 'contact', time_to_complete: timeToComplete });
          this.submitSuccess = true;
          this.contactForm.reset({ privacy: false, serviceOther: '', referralSource: '', honeypot: '' });
          if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem('jsl_contact_draft');
          }
          this.toastService.show('CONTACT.FORM.SUCCESS', 'success');
          this.analytics.trackEvent('lead_synced', { form_name: 'contact', lead_status: response?.success ? 'synced' : 'pending_sync' });
          this.analytics.trackConversion('contact_form_submit');
          this.analytics.trackEvent('generate_lead', { method: 'contact_form' });
          const currentLang = this.router.url.split('/')[1] || 'en';
          this.router.navigate(['/', currentLang, 'thank-you']);
        },
        error: (err: any) => {
          this.submitError = true;
          this.toastService.show('CONTACT.FORM.ERROR', 'error');
          this.analytics.trackEvent('form_submit_error', { form_name: 'contact', error_code: err.status || 'unknown' });
        },
      });
  }

  private async getRecaptchaToken(): Promise<string | null> {
    if (!this.recaptchaSiteKey || !(globalThis as any).grecaptcha?.execute) return null;
    try {
      return await (globalThis as any).grecaptcha.execute(this.recaptchaSiteKey, { action: 'contact_form_submit' });
    } catch {
      return null;
    }
  }

  private getLastMeaningfulField(value: Record<string, unknown>): string | null {
    const candidates = ['name', 'email', 'company', 'phone', 'service', 'serviceOther', 'budget', 'referralSource', 'message'];
    for (const field of candidates) {
      const raw = value[field];
      if (typeof raw === 'string' && raw.trim().length > 0) return field;
    }
    return null;
  }

  private injectRecaptchaScript(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.recaptchaSiteKey || document.getElementById('recaptcha-enterprise-script')) return;
    const script = document.createElement('script');
    script.id = 'recaptcha-enterprise-script';
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(this.recaptchaSiteKey)}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
}
