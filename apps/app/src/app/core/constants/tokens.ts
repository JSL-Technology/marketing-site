import { InjectionToken, inject, PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const BASE_URL = new InjectionToken<string>('BASE_URL');
export const RESPONSE = new InjectionToken<any>('RESPONSE');
export const REQUEST = new InjectionToken<any>('REQUEST');

/** GA4 Measurement ID (e.g. G-XXXXXXXXXX). Provided by server.ts from process.env.GA_MEASUREMENT_ID. */
export const GA_MEASUREMENT_ID = new InjectionToken<string>('GA_MEASUREMENT_ID', {
  providedIn: 'root',
  factory: () => '',
});

/** reCAPTCHA Site Key. Provided by server.ts from process.env.RECAPTCHA_SITE_KEY. */
export const RECAPTCHA_SITE_KEY = new InjectionToken<string>('RECAPTCHA_SITE_KEY', {
  providedIn: 'root',
  factory: () => {
    const platformId = inject(PLATFORM_ID);
    const transferState = inject(TransferState);
    const key = makeStateKey<string>('RECAPTCHA_SITE_KEY');
    if (isPlatformBrowser(platformId)) {
      return transferState.get(key, '');
    }
    // Return empty during SSR factory; will be overridden by provider in server.ts
    return '';
  },
});

/** Google Search Console HTML verification token. Provided by server.ts from process.env.GSC_VERIFICATION_TOKEN. */
export const GSC_VERIFICATION_TOKEN = new InjectionToken<string>('GSC_VERIFICATION_TOKEN', {
  providedIn: 'root',
  factory: () => '',
});

/** Site display name — single source of truth for branding across the app. */
export const SITE_NAME = new InjectionToken<string>('SITE_NAME', {
  providedIn: 'root',
  factory: () => 'JSL Technology',
});

/** Calendly embed URL for the booking modal. Set CALENDLY_URL env var on the server. */
export const CALENDLY_URL = new InjectionToken<string>('CALENDLY_URL', {
  providedIn: 'root',
  factory: () => '',
});

/** Feature flags map. Set FEATURE_FLAGS env var as JSON string on the server.
 *  Example: FEATURE_FLAGS={"new_hero_copy":true,"pricing_v2":false}
 */
export const FEATURE_FLAGS = new InjectionToken<Record<string, boolean>>('FEATURE_FLAGS', {
  providedIn: 'root',
  factory: () => ({}),
});

/** Microsoft Clarity project ID. Set CLARITY_PROJECT_ID env var. */
export const CLARITY_PROJECT_ID = new InjectionToken<string>('CLARITY_PROJECT_ID', {
  providedIn: 'root',
  factory: () => '',
});

/** Brevo list ID for contact-form leads. Set BREVO_LIST_CONTACT_ID env var. */
export const BREVO_LIST_CONTACT_ID = new InjectionToken<string>('BREVO_LIST_CONTACT_ID', {
  providedIn: 'root',
  factory: () => '',
});

/** Brevo list ID for whitepaper leads. Set BREVO_LIST_WHITEPAPER_ID env var. */
export const BREVO_LIST_WHITEPAPER_ID = new InjectionToken<string>('BREVO_LIST_WHITEPAPER_ID', {
  providedIn: 'root',
  factory: () => '',
});

/** Brevo list ID for enterprise fast-track. Set BREVO_LIST_ENTERPRISE_ID env var. */
export const BREVO_LIST_ENTERPRISE_ID = new InjectionToken<string>('BREVO_LIST_ENTERPRISE_ID', {
  providedIn: 'root',
  factory: () => '',
});

/** Email to receive hot-lead commercial alerts. Set SALES_ALERT_EMAIL env var. */
export const SALES_ALERT_EMAIL = new InjectionToken<string>('SALES_ALERT_EMAIL', {
  providedIn: 'root',
  factory: () => '',
});
