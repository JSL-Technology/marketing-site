import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { ALL_ICONS } from '../../core/constants/icons';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import {
  LucideAngularModule,
  ArrowRight,
  CheckCircle,
  Briefcase,
  Users,
  Globe,
  Award,
} from 'lucide-angular';
import { Solutions } from './solutions';

describe('Solutions', () => {
  let component: Solutions;
  let fixture: ComponentFixture<Solutions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Solutions, TranslateModule.forRoot()],
      providers: [
        importProvidersFrom(LucideAngularModule.pick(ALL_ICONS)),
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Solutions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
