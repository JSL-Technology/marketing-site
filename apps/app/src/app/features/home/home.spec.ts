import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { BASE_URL } from '@core/constants/tokens';

import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home, TranslateModule.forRoot()],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BASE_URL, useValue: 'http://localhost' },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            queryParams: of({}),
            snapshot: {
              params: {},
              queryParams: {},
              data: {}
            }
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    // fixture.detectChanges(); // Avoid early detectChanges with zoneless if not needed immediately
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
