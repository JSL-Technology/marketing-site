import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewEncapsulation,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'jsl-mobile-menu-search',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LucideAngularModule],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mobile-menu-search">
      <div class="search-input-wrapper">
        <lucide-icon name="Search" class="search-icon"></lucide-icon>
        <input
          type="text"
          [ngModel]="searchQuery"
          (ngModelChange)="searchChange.emit($event)"
          [placeholder]="'SEARCH.PLACEHOLDER' | translate"
          [attr.aria-label]="'ARIA.SEARCH_MENU' | translate"
        />
        @if (searchQuery) {
          <button
            class="clear-search"
            (click)="clearSearch()"
            [attr.aria-label]="'SEARCH.CLEAR_SEARCH' | translate"
          >
            <lucide-icon name="X"></lucide-icon>
          </button>
        }
      </div>
    </div>
  `,
})
export class MobileMenuSearch {
  @Input() searchQuery = '';
  @Input() searchResultsCount = 0;
  @Output() searchChange = new EventEmitter<string>();

  clearSearch(): void {
    this.searchChange.emit('');
  }
}
