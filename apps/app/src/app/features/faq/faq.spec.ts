import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { BASE_URL } from '@core/constants/tokens';
import { LucideAngularModule, Search, X, LayoutGrid, Zap, DollarSign, Settings, Cpu, ChevronDown, MessageSquare, Mail, MessageCircle } from 'lucide-angular';
import { Faq } from './faq';

describe('Faq', () => {
  let component: Faq;
  let fixture: ComponentFixture<Faq>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Faq,
        TranslateModule.forRoot(),
        LucideAngularModule.pick({ Search, X, LayoutGrid, Zap, DollarSign, Settings, Cpu, ChevronDown, MessageSquare, Mail, MessageCircle })
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: BASE_URL, useValue: 'http://localhost:4200' }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Faq);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
