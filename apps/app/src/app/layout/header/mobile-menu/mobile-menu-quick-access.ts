import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewEncapsulation,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { EXTERNAL_URLS } from './mobile-menu.constants';

@Component({
  selector: 'jsl-mobile-menu-quick-access',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule, LucideAngularModule],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mobile-quick-access">
      <h3 class="quick-access-title">{{ 'HEADER.QUICK_ACCESS' | translate }}</h3>
      <div class="quick-access-grid">
        <a [routerLink]="[currentLang, 'contact']" routerLinkActive="active" class="quick-tile" (click)="close.emit()">
          <div class="tile-icon"><lucide-icon name="Mail"></lucide-icon></div>
          <span>{{ 'HEADER.QUICK_CONTACT' | translate }}</span>
        </a>
        <a [routerLink]="[currentLang, 'pricing']" routerLinkActive="active" class="quick-tile" (click)="close.emit()">
          <div class="tile-icon"><lucide-icon name="CircleDollarSign"></lucide-icon></div>
          <span>{{ 'HEADER.QUICK_PRICING' | translate }}</span>
        </a>
        <a [routerLink]="[currentLang, 'faq']" routerLinkActive="active" class="quick-tile" (click)="close.emit()">
          <div class="tile-icon"><lucide-icon name="HelpCircle"></lucide-icon></div>
          <span>{{ 'HEADER.QUICK_FAQ' | translate }}</span>
        </a>
        <a
          [href]="supportUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="quick-tile"
          (click)="close.emit()"
          [attr.aria-label]="('HEADER.QUICK_SUPPORT' | translate) + ' (' + ('ARIA.EXTERNAL_LINK' | translate) + ')'"
        >
          <div class="tile-icon"><lucide-icon name="Headphones"></lucide-icon></div>
          <span>{{ 'HEADER.QUICK_SUPPORT' | translate }}</span>
          <lucide-icon name="ExternalLink" class="external-icon-sm"></lucide-icon>
        </a>
      </div>
    </div>
  `,
})
export class MobileMenuQuickAccess {
  @Input() currentLang = 'en';
  @Output() close = new EventEmitter<void>();

  readonly supportUrl = EXTERNAL_URLS.quickSupport;
}
