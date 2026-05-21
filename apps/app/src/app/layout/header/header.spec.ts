import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Header } from './header';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ALL_ICONS } from '../../core/constants/icons';
import { MenuService } from '@core/services/menu.service';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let menuService: MenuService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header, NoopAnimationsModule],
      providers: [
        provideRouter([]), // Mock
        provideTranslateService(), // Mock
        provideZonelessChangeDetection(),
        importProvidersFrom(LucideAngularModule.pick(ALL_ICONS)),
        MenuService
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    menuService = TestBed.inject(MenuService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have mobile menu closed by default', () => {
    expect(component.isMobileMenuOpen).toBe(false);
  });

  it('should toggle mobile menu on toggleMobileMenu()', async () => {
    expect(menuService.isMobileMenuOpen()).toBe(false);

    component.toggleMobileMenu();
    expect(menuService.isMobileMenuOpen()).toBe(true);

    // Wait for MenuService cooldown (400ms)
    await new Promise(resolve => setTimeout(resolve, 450));

    component.toggleMobileMenu();
    expect(menuService.isMobileMenuOpen()).toBe(false);
  });

  it('should close mobile menu on closeMobileMenu()', async () => {
    menuService.open();
    expect(menuService.isMobileMenuOpen()).toBe(true);

    // Wait for MenuService cooldown (400ms)
    await new Promise(resolve => setTimeout(resolve, 450));

    component.closeMobileMenu();
    expect(menuService.isMobileMenuOpen()).toBe(false);
  });
});