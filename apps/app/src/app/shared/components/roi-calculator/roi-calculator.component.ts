import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ALL_ICONS } from '@core/constants/icons';
import { TranslateModule } from '@ngx-translate/core';
import { AnalyticsService } from '@core/services/analytics.service';

@Component({
  selector: 'app-roi-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslateModule],
  templateUrl: './roi-calculator.component.html',
  styleUrls: ['./roi-calculator.component.scss']
})
export class RoiCalculatorComponent {
  private readonly analytics = inject(AnalyticsService);
  readonly icons = ALL_ICONS;

  hoursSaved = signal<number>(10);
  hourlyRate = signal<number>(50);
  employees = signal<number>(5);

  weeklySavings = computed(() => this.hoursSaved() * this.hourlyRate() * this.employees());
  monthlySavings = computed(() => this.weeklySavings() * 52 / 12);
  annualSavings = computed(() => this.weeklySavings() * 52);

  onSliderChange(): void {
    this.analytics.trackEvent('roi_calculator_interact', {
      hours_saved: this.hoursSaved(),
      hourly_rate: this.hourlyRate(),
      employees: this.employees(),
      weekly_savings: this.weeklySavings(),
      annual_savings: this.annualSavings(),
    });
  }

  formatCurrency(value: number): string {
    const locale = typeof window !== 'undefined' ? window.navigator.language : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }
}
