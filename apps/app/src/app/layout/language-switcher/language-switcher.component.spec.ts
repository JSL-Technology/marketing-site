import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { ALL_ICONS } from '../../core/constants/icons';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguageSwitcher } from './language-switcher';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LucideAngularModule, Globe, ChevronDown, Check, Languages, X } from 'lucide-angular';
import { of } from 'rxjs';

describe('LanguageSwitcher', () => {
  let component: LanguageSwitcher;
  let fixture: ComponentFixture<LanguageSwitcher>;
  let translateService: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSwitcher,
        TranslateModule.forRoot(),
        NoopAnimationsModule],
      providers: [
        importProvidersFrom(LucideAngularModule.pick(ALL_ICONS)),
        provideZonelessChangeDetection(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSwitcher);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService);

    // Setup essential TranslateService state
    translateService.addLangs(['en', 'es']);
    translateService.use('es');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});