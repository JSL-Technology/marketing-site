import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Ventures } from './ventures';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LucideAngularModule } from 'lucide-angular';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { ALL_ICONS } from '@core/constants/icons';

describe('Ventures', () => {
  let component: Ventures;
  let fixture: ComponentFixture<Ventures>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Ventures,
        TranslateModule.forRoot(),
        LucideAngularModule.pick(ALL_ICONS)
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'en' } }
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Ventures);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
