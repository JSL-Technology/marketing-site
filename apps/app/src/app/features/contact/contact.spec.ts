import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { ALL_ICONS } from '../../core/constants/icons';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { RECAPTCHA_SITE_KEY, BASE_URL } from '@core/constants/tokens';

import { provideRouter } from '@angular/router';
import { LucideAngularModule, Zap, Phone, Shield, Clock, Globe, Mail, MapPin, MessageSquare, Check, User, Building2, LayoutGrid, Pencil, DollarSign, Megaphone, Send, CheckCircle, XCircle, MessageCircle, Calendar, Headphones, ArrowRight, ArrowLeft } from 'lucide-angular';

import { Contact } from './contact';

describe('Contact', () => {
  let component: Contact;
  let fixture: ComponentFixture<Contact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contact],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        provideZonelessChangeDetection(),
        provideRouter([]),
        importProvidersFrom(LucideAngularModule.pick(ALL_ICONS)),
        { provide: RECAPTCHA_SITE_KEY, useValue: 'test-key' },
        { provide: BASE_URL, useValue: 'http://localhost' }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Contact);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});