import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WhatsAppButtonComponent } from './whatsapp-button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideZonelessChangeDetection } from '@angular/core';

describe('WhatsAppButtonComponent', () => {
  let component: WhatsAppButtonComponent;
  let fixture: ComponentFixture<WhatsAppButtonComponent>;
  let translateService: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsAppButtonComponent, TranslateModule.forRoot()],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhatsAppButtonComponent);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService);
    translateService.setDefaultLang('en');
    translateService.use('en');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct WhatsApp link for english', () => {
    const anchor = fixture.nativeElement.querySelector('a');
    expect(anchor.href).toContain('wa.me/18092641693?text=Hi!%20I%20would%20like%20more%20information%20about%20your%20services.');
  });

  it('should change WhatsApp message based on current language', () => {
    translateService.use('es');
    fixture.detectChanges();

    const anchor = fixture.nativeElement.querySelector('a');
    expect(anchor.href).toContain('%C2%A1Hola!%20Me%20gustar%C3%ADa%20recibir%20m%C3%A1s%20informaci%C3%B3n%20sobre%20sus%20servicios.');
  });

  it('should have target="_blank"', () => {
    const anchor = fixture.nativeElement.querySelector('a');
    expect(anchor.target).toBe('_blank');
  });
});
