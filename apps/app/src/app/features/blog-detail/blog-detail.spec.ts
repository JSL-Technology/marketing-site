import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlogDetail } from './blog-detail';
import { provideZonelessChangeDetection } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ALL_ICONS } from '@core/constants/icons';
import { BASE_URL } from '@core/constants/tokens';
import { of } from 'rxjs';

describe('BlogDetail', () => {
  let component: BlogDetail;
  let fixture: ComponentFixture<BlogDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BlogDetail,
        TranslateModule.forRoot(),
        LucideAngularModule.pick(ALL_ICONS)
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: BASE_URL, useValue: 'https://www.jsl.technology' },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: () => 'future-of-angular-ssr' }),
            snapshot: { paramMap: { get: () => 'en' } }
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlogDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
