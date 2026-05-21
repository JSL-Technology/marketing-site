import { Injectable, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FEATURE_FLAGS } from '../constants/tokens';
import { AnalyticsService } from './analytics.service';

export interface SignificanceResult {
  significant: boolean;
  pValue: number;
  confidence: number;
  winner: 'A' | 'B' | 'none';
}

/** Known experiments — add new entries here. */
export const EXPERIMENTS = {
  HOME_HERO_V2:      'home_hero_v2',
  CONTACT_CTA_V2:    'contact_cta_v2',
  TRUST_LAYOUT_V2:   'trust_layout_v2',
} as const;

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private analytics = inject(AnalyticsService);
  private exposedExperiments = new Set<string>();

  constructor(
    @Inject(FEATURE_FLAGS) private readonly flags: Record<string, boolean>,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  isEnabled(flag: string): boolean { return this.flags[flag] === true; }

  getVariant(experimentName: string): 'A' | 'B' {
    if (!isPlatformBrowser(this.platformId) || this.analytics.getDeviceCategory() === 'bot') return 'A';
    const key = this.getStableIdentity() + experimentName;
    return this.hashString(key) % 2 === 0 ? 'A' : 'B';
  }

  /** Same as getVariant but auto-tracks exposure on first call. */
  getVariantWithExposure(experimentName: string): 'A' | 'B' {
    const variant = this.getVariant(experimentName);
    if (!this.exposedExperiments.has(experimentName)) {
      this.exposedExperiments.add(experimentName);
      this.analytics.trackExperimentExposure(experimentName, variant);
    }
    return variant;
  }

  /**
   * Two-proportion Z-test for A/B significance.
   * Returns p-value, confidence, whether it's significant (α=0.05), and the winner.
   */
  calculateSignificance(
    controlConversions: number,
    controlVisitors: number,
    variantConversions: number,
    variantVisitors: number,
  ): SignificanceResult {
    if (controlVisitors === 0 || variantVisitors === 0) {
      return { significant: false, pValue: 1, confidence: 0, winner: 'none' };
    }

    const pA = controlConversions / controlVisitors;
    const pB = variantConversions / variantVisitors;
    const pPool = (controlConversions + variantConversions) / (controlVisitors + variantVisitors);
    const se = Math.sqrt(pPool * (1 - pPool) * (1 / controlVisitors + 1 / variantVisitors));

    if (se === 0) return { significant: false, pValue: 1, confidence: 0, winner: 'none' };

    const z = Math.abs(pA - pB) / se;
    // Two-tailed p-value approximation using complementary error function
    const pValue = 2 * (1 - this.normalCdf(z));
    const confidence = Math.round((1 - pValue) * 100 * 100) / 100;
    const significant = pValue < 0.05;
    const winner: 'A' | 'B' | 'none' = significant ? (pB > pA ? 'B' : 'A') : 'none';

    return { significant, pValue: Math.round(pValue * 10000) / 10000, confidence, winner };
  }

  private normalCdf(z: number): number {
    // Abramowitz & Stegun approximation (error < 7.5e-8)
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const x = Math.abs(z);
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return z < 0 ? 1 - y : y;
  }

  private getStableIdentity(): string {
    const clientId = this.analytics.getClientId();
    if (clientId) return clientId;
    const existingSession = sessionStorage.getItem('jsl_session_id');
    if (existingSession) return existingSession;
    const created = `sid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('jsl_session_id', created);
    return created;
  }

  private hashString(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) hash = (hash << 5) - hash + input.charCodeAt(i);
    return Math.abs(hash | 0);
  }
}
