import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';

export interface LanguageItem {
  code: string;
  nativeName: string;
  translatedName: string;
}

@Component({
  selector: 'jsl-language-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, LucideAngularModule],
  template: `
    <div class="lang-switcher__list-wrapper">
      <!-- Featured Languages -->
      <div class="lang-switcher__list">
        <a
          *ngFor="let lang of featuredLanguages"
          [routerLink]="getRouteForLang(lang.code)"
          (click)="onSelect(lang.code)"
          [class.active]="currentLang === lang.code"
          class="lang-switcher__item"
        >
          <div class="lang-switcher__item-info">
            <span class="lang-switcher__item-name">{{ lang.nativeName }}</span>
            <span class="lang-switcher__item-subname">{{ lang.translatedName | translate }} · {{ lang.code | uppercase }}</span>
          </div>
          <lucide-icon *ngIf="currentLang === lang.code" name="Check" class="lang-switcher__check"></lucide-icon>
        </a>
      </div>

      <!-- More Languages Toggle -->
      <button
        *ngIf="otherLanguages.length > 0"
        class="lang-switcher__more-toggle"
        (click)="toggleMore($event)"
        [class.is-expanded]="showAll"
      >
        <span>{{ 'LANGUAGE_SELECTOR.MORE_LANGUAGES' | translate }}</span>
        <lucide-icon name="ChevronDown"></lucide-icon>
      </button>

      <!-- Other Languages (Expandable) -->
      <div class="lang-switcher__list lang-switcher__list--others" *ngIf="showAll">
        <a
          *ngFor="let lang of otherLanguages"
          [routerLink]="getRouteForLang(lang.code)"
          (click)="onSelect(lang.code)"
          [class.active]="currentLang === lang.code"
          class="lang-switcher__item"
        >
          <div class="lang-switcher__item-info">
            <span class="lang-switcher__item-name">{{ lang.nativeName }}</span>
            <span class="lang-switcher__item-subname">{{ lang.translatedName | translate }} · {{ lang.code | uppercase }}</span>
          </div>
          <lucide-icon *ngIf="currentLang === lang.code" name="Check" class="lang-switcher__check"></lucide-icon>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .lang-switcher__list-wrapper {
      padding: 0.5rem;
      overflow-y: auto;
      max-height: 380px;
      flex: 1;

      &::-webkit-scrollbar {
        width: 4px;
      }
      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
      }
    }

    .lang-switcher__list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .lang-switcher__item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.7rem 0.85rem;
      border-radius: 12px;
      text-decoration: none;
      transition: all 0.2s ease;
      border: 1px solid transparent;
      cursor: pointer;

      .lang-switcher__item-info {
        display: flex;
        flex-direction: column;
        gap: 1px;
      }

      .lang-switcher__item-name {
        font-size: 0.95rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
      }

      .lang-switcher__item-subname {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.4);
      }

      .lang-switcher__check {
        width: 18px;
        height: 18px;
        color: var(--primary);
      }

      &:hover {
        background: rgba(255, 255, 255, 0.04);
        .lang-switcher__item-name {
          color: #fff;
        }
      }

      &.active {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.05);
        .lang-switcher__item-name {
          color: #fff;
          font-weight: 700;
        }
        .lang-switcher__item-subname {
          color: rgba(255, 255, 255, 0.6);
        }
      }
    }

    .lang-switcher__more-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 0.85rem 1rem;
      margin-top: 0.5rem;
      background: transparent;
      border: none;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      color: var(--primary);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;

      lucide-icon {
        width: 16px;
        height: 16px;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      &.is-expanded lucide-icon {
        transform: rotate(180deg);
      }

      &:hover {
        background: rgba(255, 255, 255, 0.02);
      }
    }

    .lang-switcher__list--others {
      margin-top: 0.25rem;
      animation: slideDown 0.3s cubic-bezier(0, 0, 0.2, 1);
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class LanguageListComponent {
  @Input() currentLang = 'es';
  @Input() featuredLanguages: LanguageItem[] = [];
  @Input() otherLanguages: LanguageItem[] = [];
  @Input() routeWithoutLang: string[] = [];

  @Output() select = new EventEmitter<string>();

  showAll = false;

  getRouteForLang(langCode: string): string[] {
    return [`/${langCode}`, ...this.routeWithoutLang];
  }

  onSelect(code: string): void {
    this.select.emit(code);
  }

  toggleMore(event: Event): void {
    event.stopPropagation();
    this.showAll = !this.showAll;
  }
}
