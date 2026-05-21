import { Component, Inject, OnDestroy } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { CtaComponent } from '@shared/components/cta/cta';
import { Subscription } from 'rxjs';

@Component({
  selector: 'jsl-pricing',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule, RouterLink, DecimalPipe, CtaComponent],
  templateUrl: './pricing.html',
  styleUrl: './pricing.scss'
})
export class Pricing implements OnDestroy {
  currentLang: string;
  private langSub: Subscription;

  step = 1;
  selections: { type: any; scale: any; features: any[] } = { type: null, scale: null, features: [] };
  estimatedPrice = 0;

  types = [
    { id: 'web',    name: 'PRICING.WEB_APP',    icon: 'Monitor',    basePrice: 10000 },
    { id: 'mobile', name: 'PRICING.MOBILE_APP', icon: 'Smartphone', basePrice: 15000 },
    { id: 'erp',    name: 'PRICING.CUSTOM_ERP', icon: 'Database',   basePrice: 25000 },
  ];

  scales = [
    { id: 'startup',    name: 'PRICING.STARTUP',    icon: 'Rocket',    multiplier: 1   },
    { id: 'smb',        name: 'PRICING.SMB',         icon: 'Building2', multiplier: 1.5 },
    { id: 'enterprise', name: 'PRICING.ENTERPRISE',  icon: 'Building',  multiplier: 2.5 },
  ];

  features = [
    { id: 'design',  name: 'PRICING.ADVANCED_UI',      icon: 'LayoutGrid',  price: 5000  },
    { id: 'backend', name: 'PRICING.COMPLEX_BACKEND',   icon: 'Server',      price: 8000  },
    { id: 'cloud',   name: 'PRICING.CLOUD_INFRA',       icon: 'Cloud',       price: 4000  },
    { id: 'ai',      name: 'PRICING.AI_INTEGRATION',    icon: 'Brain',       price: 10000 },
  ];

  comparison = [
    { feature: 'PRICING.CLOUD_NATIVE',   virteex: true,  others: false                 },
    { feature: 'PRICING.AI_INTEGRATION', virteex: true,  others: 'PRICING.PAID_ADDON'  },
    { feature: 'PRICING.SUPPORT_24_7',   virteex: true,  others: false                 },
    { feature: 'PRICING.CUSTOMIZABLE',   virteex: true,  others: true                  },
    { feature: 'PRICING.OPEN_API',       virteex: true,  others: false                 },
  ];

  constructor(@Inject(TranslateService) private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
    this.langSub = this.translate.onLangChange.subscribe(e => this.currentLang = e.lang);
  }

  ngOnDestroy() { this.langSub?.unsubscribe(); }

  selectType(type: any) { this.selections.type = type; this.nextStep(); }
  selectScale(scale: any) { this.selections.scale = scale; this.nextStep(); }

  toggleFeature(feat: any) {
    const idx = this.selections.features.indexOf(feat);
    idx > -1 ? this.selections.features.splice(idx, 1) : this.selections.features.push(feat);
  }

  nextStep() {
    this.step++;
    if (this.step === 4) this.calculate();
  }

  prevStep() { if (this.step > 1) this.step--; }

  calculate() {
    let total = this.selections.type.basePrice * this.selections.scale.multiplier;
    this.selections.features.forEach((f: any) => total += f.price);
    this.estimatedPrice = Math.round(total);
  }

  restart() {
    this.step = 1;
    this.selections = { type: null, scale: null, features: [] };
    this.estimatedPrice = 0;
  }
}
