import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Trust } from './trust';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { ALL_ICONS } from '../../core/constants/icons';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { provideZonelessChangeDetection } from '@angular/core';

describe('Trust', () => {
  let component: Trust;
  let fixture: ComponentFixture<Trust>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Trust,
        TranslateModule.forRoot(),
        LucideAngularModule.pick(ALL_ICONS)
      ],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ lang: 'en' }),
            snapshot: { params: { lang: 'en' } }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Trust);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have security pillars', () => {
    expect(component.securityPillars.length).toBeGreaterThan(0);
  });

  it('should have certifications', () => {
    expect(component.certifications.length).toBeGreaterThan(0);
  });
});
