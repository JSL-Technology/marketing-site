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
import { MobileMenuLink, isInternalLink } from './mobile-menu.constants';

// ViewEncapsulation.None es intencional: los estilos de este componente están
// definidos en mobile-menu.scss, bajo el selector .mobile-menu-container, y se
// comparten con el resto del sistema del menú lateral. Cambiar a Emulated
// requeriría duplicar o restructurar ese SCSS.
@Component({
  selector: 'jsl-mobile-menu-section',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule, LucideAngularModule],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mobile-menu-section.html',
})
export class MobileMenuSection {
  @Input() sectionId       = '';
  @Input() sectionTitleKey = '';
  @Input() isExpanded      = false;
  @Input() links: MobileMenuLink[] = [];
  @Input() searchQuery     = '';
  @Input() shouldShowLinkFn!: (linkKey: string) => boolean;

  @Output() toggle        = new EventEmitter<string>();
  @Output() close         = new EventEmitter<void>();
  @Output() routeNavigate = new EventEmitter<{ route: (string | number)[]; source: string }>();

  protected readonly isInternalLink = isInternalLink;

  shouldShowLink(linkKey: string): boolean {
    return this.shouldShowLinkFn ? this.shouldShowLinkFn(linkKey) : true;
  }

  handleRouteClick(route: (string | number)[], key: string, event: Event): void {
    event.preventDefault();
    this.routeNavigate.emit({ route, source: key });
  }
}
