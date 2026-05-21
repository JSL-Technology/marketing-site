import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  PLATFORM_ID,
  OnInit,
  OnDestroy,
  Renderer2,
  AfterViewInit,
  ChangeDetectorRef,
  effect,
  inject,
  HostListener,
} from '@angular/core';
import { SearchUiService } from '@core/services/search-ui.service';
import { OverlayManagerService } from '@core/services/overlay-manager.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { TopBar } from '../top-bar/top-bar';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { SearchOverlayComponent } from '../../shared/components/search-overlay/search-overlay';
import { BreakpointService } from '@core/services/breakpoint.service';
import { MenuService } from '@core/services/menu.service';
import { MobileMenu } from './mobile-menu/mobile-menu';

@Component({
  selector: 'jsl-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    LucideAngularModule,
    TopBar,
    LanguageSwitcher,
    SearchOverlayComponent,
    MobileMenu
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, OnDestroy, AfterViewInit {
  public breakpointService = inject(BreakpointService);
  private menuService = inject(MenuService);
  private searchUiService = inject(SearchUiService);
  private overlayManagerService = inject(OverlayManagerService);
  private translate = inject(TranslateService);
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private cdRef = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  public currentLang: string;
  public openDropdown: string | null = null;
  private isBrowser: boolean;

  get isSearchOpen() {
    return this.searchUiService.isOpen();
  }

  get isMobileMenuOpen() {
    return this.menuService.isMobileMenuOpen();
  }

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.currentLang = this.translate.getCurrentLang() || this.translate.defaultLang || 'es';

    this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
    });

    effect(() => {
      if (this.isBrowser) {
        if (this.searchUiService.isOpen()) {
          this.overlayManagerService.register('search-overlay');
        } else {
          this.overlayManagerService.unregister('search-overlay');
        }
      }
    });
  }

  ngOnInit() {
    if (this.isBrowser) {
      // Initialization if needed
    }
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      // Initialization if needed
    }
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  // GESTIÓN DEL DROPDOWN
  toggleDropdown(menu: string, event: MouseEvent) {
    event.stopPropagation();
    this.openDropdown = this.openDropdown === menu ? null : menu;
  }

  closeDropdowns() {
    this.openDropdown = null;
  }

  toggleSearch() {
    this.searchUiService.toggle();
  }

  // TOGGLE MANUAL DEL MENÚ
  toggleMobileMenu(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();

    this.menuService.toggle('button');
    this.closeDropdowns();
  }

  closeMobileMenu() {
    this.menuService.close('button');
    this.closeDropdowns();
  }

  onClickOutside(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.closeDropdowns();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.isBrowser) return;

    // Global Search Shortcut (Cmd/Ctrl + K)
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.searchUiService.open();
      return;
    }
  }
}
