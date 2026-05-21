import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguageSwitcher } from './language-switcher';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { of, EMPTY } from 'rxjs';
import { LucideAngularModule, Globe, ChevronDown, Check } from 'lucide-angular';

describe('LanguageSwitcher', () => {
  let component: LanguageSwitcher;
  let fixture: ComponentFixture<LanguageSwitcher>;
  let translateService: TranslateService;

  // Mock del TranslateService
  const mockTranslateService = {
    use: jasmine.createSpy('use'),
    addLangs: jasmine.createSpy('addLangs'),
    setDefaultLang: jasmine.createSpy('setDefaultLang'),
    getLangs: jasmine.createSpy('getLangs').and.returnValue(['en', 'es']),
    get: jasmine.createSpy('get').and.returnValue(of('')),
    getCurrentLang: jasmine.createSpy('getCurrentLang').and.returnValue('es'),
    getFallbackLang: jasmine.createSpy('getFallbackLang').and.returnValue('en'),
    onTranslationChange: EMPTY,
    onLangChange: EMPTY,
    onDefaultLangChange: EMPTY,
    currentLang: 'es',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSwitcher, TranslateModule.forRoot()],
      providers: [
        provideZonelessChangeDetection(),
        importProvidersFrom(LucideAngularModule.pick({ Globe, ChevronDown, Check })),
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LanguageSwitcher);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});